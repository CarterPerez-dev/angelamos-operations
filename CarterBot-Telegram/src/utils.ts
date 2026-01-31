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
  const { unlinkSync } = await import("fs");
  const timestamp = Date.now();
  const wavFile = `${TEMP_DIR}/voice_${timestamp}.wav`;

  try {
    const startTime = Date.now();

    const ffmpeg = Bun.spawn([
      "ffmpeg",
      "-i", filePath,
      "-ar", "16000",
      "-ac", "1",
      "-c:a", "pcm_s16le",
      "-y",
      wavFile,
    ], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await ffmpeg.exited;

    if (!(await Bun.file(wavFile).exists())) {
      console.error("ffmpeg failed to convert audio");
      return null;
    }

    const outputFile = `${TEMP_DIR}/whisper_output_${timestamp}`;

    const proc = Bun.spawn([
      WHISPER_CLI_PATH,
      "-m", WHISPER_MODEL_PATH,
      "-f", wavFile,
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
        unlinkSync(txtFile);
        unlinkSync(wavFile);
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
  } finally {
    try {
      unlinkSync(wavFile);
    } catch {
      // Ignore
    }
  }
}
