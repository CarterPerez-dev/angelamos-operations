/**
 * CarterOS Telegram Bot - MCP Server Configuration
 *
 * Connects Claude to CarterOS backend via MCP.
 */

import type { McpServerConfig } from "./src/types";

export const MCP_SERVERS: Record<string, McpServerConfig> = {
  carteros: {
    type: "http",
    url: "http://localhost:5420/mcp",
  },
};
