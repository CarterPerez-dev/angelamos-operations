/**
 * CarterOS Telegram Bot - Configuration
 *
 * Environment variables, paths, and settings.
 * Simplified for personal use (no complex security layers).
 */

import { homedir } from "os";
import { resolve, dirname } from "path";
import type { McpServerConfig } from "./types";

const HOME = homedir();

const EXTRA_PATHS = [
  `${HOME}/.local/bin`,
  `${HOME}/.bun/bin`,
  "/usr/local/bin",
];

const currentPath = process.env.PATH || "";
const pathParts = currentPath.split(":");
for (const extraPath of EXTRA_PATHS) {
  if (!pathParts.includes(extraPath)) {
    pathParts.unshift(extraPath);
  }
}
process.env.PATH = pathParts.join(":");

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const ALLOWED_USERS: number[] = (
  process.env.TELEGRAM_ALLOWED_USERS || ""
)
  .split(",")
  .filter((x) => x.trim())
  .map((x) => parseInt(x.trim(), 10))
  .filter((x) => !isNaN(x));

export const WORKING_DIR = process.env.CLAUDE_WORKING_DIR || `${HOME}/dev/operations/angelamos-operations/carter-telegram-bot`;

export const WHISPER_CLI_PATH = process.env.WHISPER_CLI_PATH || `${HOME}/tools/whisper.cpp/build/bin/whisper-cli`;
export const WHISPER_MODEL_PATH = process.env.WHISPER_MODEL_PATH || `${HOME}/tools/whisper.cpp/models/ggml-medium.bin`;

let MCP_SERVERS: Record<string, McpServerConfig> = {};

try {
  const mcpConfigPath = resolve(dirname(import.meta.dir), "mcp-config.ts");
  const mcpModule = await import(mcpConfigPath).catch(() => null);
  if (mcpModule?.MCP_SERVERS) {
    MCP_SERVERS = mcpModule.MCP_SERVERS;
    console.log(
      `Loaded ${Object.keys(MCP_SERVERS).length} MCP servers from mcp-config.ts`
    );
  }
} catch {
  console.log("No mcp-config.ts found - running without custom MCPs");
}

export { MCP_SERVERS };

export const SYSTEM_PROMPT = `You are Carter's personal assistant accessible via Telegram.
You have full access to CarterOS (notes, planner, job tracker, challenge tracker, identity).
Use the MCP tools to read and write data. Be concise and helpful.`;

const thinkingKeywordsStr =
  process.env.THINKING_KEYWORDS || "think,reason,analyze";
const thinkingDeepKeywordsStr =
  process.env.THINKING_DEEP_KEYWORDS || "ultrathink,think hard,deep think";

export const THINKING_KEYWORDS = thinkingKeywordsStr
  .split(",")
  .map((k) => k.trim().toLowerCase());
export const THINKING_DEEP_KEYWORDS = thinkingDeepKeywordsStr
  .split(",")
  .map((k) => k.trim().toLowerCase());

export const TELEGRAM_MESSAGE_LIMIT = 4096;
export const TELEGRAM_SAFE_LIMIT = 4000;
export const STREAMING_THROTTLE_MS = 500;

export const SESSION_FILE = "/tmp/carter-telegram-session.json";
export const RESTART_FILE = "/tmp/carter-telegram-restart.json";
export const TEMP_DIR = "/tmp/carter-telegram-bot";

await Bun.write(`${TEMP_DIR}/.keep`, "");

if (!TELEGRAM_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

if (ALLOWED_USERS.length === 0) {
  console.error(
    "ERROR: TELEGRAM_ALLOWED_USERS environment variable is required"
  );
  process.exit(1);
}

console.log(
  `Config loaded: ${ALLOWED_USERS.length} allowed user(s), working dir: ${WORKING_DIR}`
);
