/**
 * CarterOS Telegram Bot - Type Definitions
 */

export type StatusCallback = (
  type: "thinking" | "tool" | "text" | "segment_end" | "done",
  content: string,
  segmentId?: number
) => Promise<void>;

export interface SessionData {
  session_id: string;
  saved_at: string;
  working_dir: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export type McpServerConfig = McpStdioConfig | McpHttpConfig;

export interface McpStdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpHttpConfig {
  type: "http";
  url: string;
  headers?: Record<string, string>;
}

export interface StreamingMessage {
  chat_id: number;
  message_id: number;
}

export interface WhisperResult {
  text: string;
  duration_ms: number;
}
