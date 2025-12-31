"""
ⒸAngelaMos | 2025
server.py
"""

from mcp.server.fastmcp import FastMCP


mcp = FastMCP(
    "CarterOSContentStudio",
    stateless_http = True,
)


def register_all_tools() -> None:
    """
    Register all MCP tools and resources
    """


register_all_tools()
