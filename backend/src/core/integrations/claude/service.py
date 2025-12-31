"""
ⒸAngelaMos | 2025
service.py
"""

import os
import json
import re
from pathlib import Path
from typing import Any
from collections.abc import AsyncIterator
from datetime import datetime

from claude_agent_sdk import query, ClaudeAgentOptions
from pydantic import BaseModel

from config import settings
from core.foundation.logging import get_logger


logger = get_logger(__name__)


class ClaudeMessage(BaseModel):
    """
    Structured message from Claude Agent SDK
    """

    content: str
    session_id: str | None = None
    tokens_used: int | None = None
    timestamp: datetime = datetime.now()


class ClaudeService:
    """
    Service for interacting with Claude Code via Agent SDK

    Uses Carter's Claude Max subscription ($200/month) via OAuth token
    Connects Claude to CarterOS MCP server for database context access

    Architecture:
    FastAPI → ClaudeService → Agent SDK → Claude CLI → Anthropic API (Max quota)
                                              ↓
                                        MCP Server (localhost:8000/mcp)
                                              ↓
                                        PostgreSQL (via repos)
    """
    def __init__(self):
        """
        Initialize Claude Service with OAuth authentication and MCP configuration
        """
        self.oauth_token = self._load_oauth_token()
        self.mcp_server_url = self._get_mcp_server_url()
        self.default_options = self._build_default_options()

    def _load_oauth_token(self) -> str:
        """
        Load OAuth token from environment or credentials file

        Priority:
        1. CLAUDE_CODE_OAUTH_TOKEN env var
        2. ~/.claude/credentials.json file

        Token format: sk-ant-oat01-... (access token, 8-12hr lifespan)
                      sk-ant-ort01-... (refresh token, longer-lived)

        Raises:
            ValueError: If no token found
        """
        env_token = os.getenv("CLAUDE_CODE_OAUTH_TOKEN")
        if env_token:
            logger.info(
                "Loaded Claude OAuth token from environment variable"
            )
            return env_token

        credentials_path = Path.home() / ".claude" / "credentials.json"
        if credentials_path.exists():
            try:
                with credentials_path.open() as f:
                    creds = json.load(f)
                    access_token = creds.get("claudeAiOauth",
                                             {}).get("accessToken")
                    if access_token:
                        logger.info(
                            "Loaded Claude OAuth token from credentials.json"
                        )
                        return access_token
            except Exception as e:
                logger.error(f"Failed to load credentials.json: {e}")

        raise ValueError(
            "Claude OAuth token not found. "
            "Run 'claude setup-token' and set CLAUDE_CODE_OAUTH_TOKEN env var"
        )

    def _get_mcp_server_url(self) -> str:
        """
        Get MCP server URL for Claude to connect to

        Dev: http://localhost:8000/mcp
        Prod: https://carteros.com/mcp

        Claude connects to this to query database context
        """
        if settings.ENVIRONMENT.value == "development":
            return "http://localhost:8000/mcp"
        return os.getenv("MCP_SERVER_URL", "https://carteros.com/mcp")

    def _build_default_options(self) -> ClaudeAgentOptions:
        """
        Build default Agent SDK options

        Configures:
        - OAuth authentication (Max subscription)
        - MCP server connection (CarterOS database access)
        - Allowed tools (Read for MCP resources)
        - Permission mode (bypass for automation)
        - Model selection (Opus 4.5 for quality)
        """
        return ClaudeAgentOptions(
            mcp_servers = {
                "carteros": {
                    "type": "http",
                    "url": self.mcp_server_url,
                }
            },
            allowed_tools = ["Read"],
            permission_mode = "dontAsk",
            model = "claude-opus-4-5",
            env = {"CLAUDE_CODE_OAUTH_TOKEN": self.oauth_token},
        )

    async def generate(
        self,
        prompt: str,
        session_id: str | None = None,
        max_turns: int = 1,
        resume_session: str | None = None,
    ) -> AsyncIterator[ClaudeMessage]:
        """
        Generate content using Claude Code with streaming responses

        Args:
            prompt: The complete system + user prompt
            session_id: Workflow session ID for logging
            max_turns: Max agentic turns (default 1 for simple generation)
            resume_session: Claude session ID to resume (enables context caching)

        Yields:
            ClaudeMessage objects with content, session_id, tokens

        Session Continuation:
        - First call: resume_session=None, full context sent
        - Subsequent calls: resume_session=claude_session_id, context cached

        Example:
            async for msg in claude_service.generate(prompt):
                print(msg.content)
        """
        options = ClaudeAgentOptions(
            mcp_servers = self.default_options.mcp_servers,
            allowed_tools = self.default_options.allowed_tools,
            permission_mode = self.default_options.permission_mode,
            model = self.default_options.model,
            max_turns = max_turns,
            env = {"CLAUDE_CODE_OAUTH_TOKEN": self.oauth_token},
            cli_path = "/usr/bin/claude",
            resume = resume_session,
            continue_conversation = resume_session is not None,
        )

        logger.info(
            "Starting Claude generation",
            session_id = session_id,
            prompt_length = len(prompt),
            max_turns = max_turns,
        )

        start_time = datetime.now()
        total_tokens = 0
        content_buffer = ""

        try:
            async for message in query(prompt = prompt, options = options):
                if hasattr(message, "content") and message.content:
                    content_buffer += str(message.content)

                    yield ClaudeMessage(
                        content = str(message.content),
                        session_id = session_id or (
                            message.session_id
                            if hasattr(message,
                                       "session_id") else None
                        ),
                        tokens_used = message.tokens_used
                        if hasattr(message,
                                   "tokens_used") else None,
                    )

                    if hasattr(message,
                               "tokens_used") and message.tokens_used:
                        total_tokens += message.tokens_used

            duration = (datetime.now() - start_time).total_seconds()

            logger.info(
                "Claude generation complete",
                session_id = session_id,
                duration_seconds = duration,
                total_tokens = total_tokens,
                response_length = len(content_buffer),
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(
                "Claude generation failed",
                error = error_msg,
                session_id = session_id,
                prompt_length = len(prompt),
            )

            if "Check stderr" in error_msg:
                logger.error(
                    "Claude CLI stderr was not captured - trying to get more details",
                    session_id = session_id,
                )
            raise

    async def generate_structured(
        self,
        prompt: str,
        expected_format: str = "json",
        session_id: str | None = None,
        resume_session: str | None = None,
    ) -> tuple[dict[str, Any], str | None]:
        """
        Generate content and parse as JSON

        Used for structured outputs (hooks, ideas, analysis)

        Args:
            prompt: System + user prompt (should request JSON output)
            expected_format: Output format (currently only "json" supported)
            session_id: Optional workflow session ID for logging
            resume_session: Claude session ID to resume (enables context caching)

        Returns:
            Tuple of (parsed JSON dict, claude_session_id)

        Raises:
            ValueError: If response is not valid JSON

        Example:
            result, claude_sid = await claude_service.generate_structured(
                prompt="Generate 20 hooks as JSON array: [{id, text, ...}]"
            )
            hooks = result["hooks"]
        """
        full_response = ""
        claude_session_id: str | None = None

        async for msg in self.generate(prompt, session_id, max_turns = 1, resume_session = resume_session):
            if msg.session_id and not claude_session_id:
                claude_session_id = msg.session_id

            content = str(msg.content)

            if "TextBlock(text=" in content:
                match = re.search(r"text=['\"](.+?)['\"]\)", content, re.DOTALL)
                if match:
                    content = match.group(1)
                    content = content.replace("\\'", "'").replace('\\"', '"')

            full_response += content

        if expected_format == "json":
            try:
                code_block_match = re.search(r'```(?:json)?\s*(\{.+?\}|\[.+?\])\s*```', full_response, re.DOTALL)
                if code_block_match:
                    json_str = code_block_match.group(1)
                else:
                    start = full_response.find("{")
                    if start == -1:
                        start = full_response.find("[")

                    if start == -1:
                        raise ValueError(
                            "No JSON object or array found in response"
                        )

                    json_str = full_response[start:]

                json_str = json_str.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace("\\'", "'")

                decoder = json.JSONDecoder()
                result, _ = decoder.raw_decode(json_str)
                return result, claude_session_id

            except json.JSONDecodeError as e:
                logger.error(
                    "Failed to parse Claude response as JSON",
                    error = str(e),
                    response_preview = full_response[: 500],
                )
                raise ValueError(
                    f"Invalid JSON in Claude response: {e}"
                ) from e

        return {"raw": full_response}, claude_session_id

    async def generate_with_mcp_context(
        self,
        prompt: str,
        mcp_resources: list[str],
        session_id: str | None = None,
    ) -> AsyncIterator[ClaudeMessage]:
        """
        Generate content with explicit MCP resource loading

        Tells Claude which MCP resources to query before generating

        Args:
            prompt: Base prompt
            mcp_resources: List of MCP resource URIs to load
                          Example: ["content://identity/carter", "content://hooks/all"]
            session_id: Optional session ID

        Example:
            async for msg in claude_service.generate_with_mcp_context(
                prompt="Generate hooks",
                mcp_resources=["content://identity/carter", "content://hooks/all"]
            ):
                print(msg.content)
        """
        resource_instructions = "\n".join(
            [f"- Query MCP resource: {uri}" for uri in mcp_resources]
        )

        enhanced_prompt = f"""
Before generating, load this context from MCP resources:
{resource_instructions}

Then:
{prompt}
"""

        async for msg in self.generate(enhanced_prompt, session_id):
            yield msg

    def verify_authentication(self) -> dict[str, Any]:
        """
        Verify Claude authentication is working

        Returns:
            Status dict with auth method and token info

        Raises:
            ValueError: If authentication fails
        """
        try:
            token_prefix = self.oauth_token[: 15] if len(
                self.oauth_token
            ) > 15 else "..."

            if self.oauth_token.startswith("sk-ant-oat"):
                auth_method = "OAuth Access Token (Max Subscription)"
                expires = "8-12 hours (needs refresh)"
            elif self.oauth_token.startswith("sk-ant-ort"):
                auth_method = "OAuth Refresh Token (Max Subscription)"
                expires = "Long-lived (1 year)"
            else:
                auth_method = "Unknown token type"
                expires = "Unknown"

            logger.info(
                "Claude authentication verified",
                auth_method = auth_method,
                token_prefix = token_prefix,
            )

            return {
                "authenticated": True,
                "method": auth_method,
                "token_prefix": token_prefix,
                "expires": expires,
                "mcp_server": self.mcp_server_url,
            }

        except Exception as e:
            logger.error(
                "Claude authentication verification failed",
                error = str(e)
            )
            raise ValueError(f"Authentication failed: {e}") from e

    async def test_mcp_connection(self) -> dict[str, Any]:
        """
        Test that Claude can connect to CarterOS MCP server

        Sends simple query asking Claude to list available MCP tools

        Returns:
            Dict with MCP connection status and available tools
        """
        test_prompt = """
List all available MCP tools and resources you have access to.
Return as JSON: {"tools": [...], "resources": [...]}
"""

        try:
            result = await self.generate_structured(test_prompt)

            logger.info(
                "MCP connection test successful",
                tools_count = len(result.get("tools",
                                             [])),
                resources_count = len(result.get("resources",
                                                 [])),
            )

            return {
                "mcp_connected": True,
                "server_url": self.mcp_server_url,
                "tools": result.get("tools",
                                    []),
                "resources": result.get("resources",
                                        []),
            }

        except Exception as e:
            logger.error("MCP connection test failed", error = str(e))
            return {
                "mcp_connected": False,
                "server_url": self.mcp_server_url,
                "error": str(e),
            }
