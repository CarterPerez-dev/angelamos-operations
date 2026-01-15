/**
 * CarterOS Telegram Bot - Utilities
 *
 * Typing indicators, transcription, and helper functions.
 */

import type { Context } from "grammy";
import { session } from "./session";
import { WHISPER_CLI_PATH, WHISPER_MODEL_PATH, TEMP_DIR } from "./config";
import type { WhisperResult } from "./types";

export function startTypingIndicator(ctx: Context): { stop: () => void } {
  const chatId = ctx.chat?.id;
  if (!chatId) return { stop: () => {} };

  let running = true;

  const sendTyping = async () => {
    while (running) {
      try {
        await ctx.api.sendChatAction(chatId, "typing");
      } catch {
        // Ignore errors
      }
      await Bun.sleep(4000);
    }
  };

  sendTyping();

  return {
    stop: () => {
      running = false;
    },
  };
}

export async function checkInterrupt(message: string): Promise<string> {
  if (message.startsWith("!")) {
    if (session.isRunning) {
      session.markInterrupt();
      const result = await session.stop();
      if (result) {
        await Bun.sleep(100);
        session.clearStopRequested();
      }
    }
    return message.slice(1).trim();
  }
  return message;
}

export function isAuthorized(userId: number | undefined, allowedUsers: number[]): boolean {
  if (!userId) return false;
  return allowedUsers.includes(userId);
}

export async function transcribeVoice(filePath: string): Promise<WhisperResult | null> {
  try {
    const startTime = Date.now();

    const outputFile = `${TEMP_DIR}/whisper_output_${Date.now()}`;

    const proc = Bun.spawn([
      WHISPER_CLI_PATH,
      "-m", WHISPER_MODEL_PATH,
      "-f", filePath,
      "-of", outputFile,
      "-otxt",
      "--no-timestamps",
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await proc.exited;

    const txtFile = `${outputFile}.txt`;
    const file = Bun.file(txtFile);

    if (await file.exists()) {
      const text = await file.text();
      const duration_ms = Date.now() - startTime;

      try {
        await Bun.write(txtFile, "");
        const { unlinkSync } = await import("fs");
        unlinkSync(txtFile);
      } catch {
        // Ignore cleanup errors
      }

      return {
        text: text.trim(),
        duration_ms,
      };
    }

    console.error("Whisper did not produce output file");
    return null;
  } catch (error) {
    console.error("Transcription error:", error);
    return null;
  }
}
