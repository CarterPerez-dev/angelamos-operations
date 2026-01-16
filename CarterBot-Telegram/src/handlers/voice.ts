/**
 * CarterOS Telegram Bot - Voice Handler
 *
 * Transcribes voice messages with local whisper.cpp.
 */

import type { Context } from "grammy";
import { unlinkSync } from "fs";
import { session } from "../session";
import { ALLOWED_USERS, TEMP_DIR, WHISPER_CLI_PATH } from "../config";
import { isAuthorized, transcribeVoice, startTypingIndicator } from "../utils";
import { StreamingState, createStatusCallback } from "./streaming";

export async function handleVoice(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";
  const chatId = ctx.chat?.id;
  const voice = ctx.message?.voice;

  if (!userId || !voice || !chatId) {
    return;
  }

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized. Contact the bot owner for access.");
    return;
  }

  const whisperExists = await Bun.file(WHISPER_CLI_PATH).exists();
  if (!whisperExists) {
    await ctx.reply("Voice transcription not configured. whisper-cli not found.");
    return;
  }

  const stopProcessing = session.startProcessing();
  const typing = startTypingIndicator(ctx);

  let voicePath: string | null = null;

  try {
    const file = await ctx.getFile();
    const timestamp = Date.now();
    voicePath = `${TEMP_DIR}/voice_${timestamp}.ogg`;

    const downloadRes = await fetch(
      `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`
    );
    const buffer = await downloadRes.arrayBuffer();
    await Bun.write(voicePath, buffer);

    const statusMsg = await ctx.reply("Transcribing...");

    const result = await transcribeVoice(voicePath);
    if (!result) {
      await ctx.api.editMessageText(
        chatId,
        statusMsg.message_id,
        "Transcription failed."
      );
      stopProcessing();
      typing.stop();
      return;
    }

    await ctx.api.editMessageText(
      chatId,
      statusMsg.message_id,
      `"${result.text}"`
    );

    const state = new StreamingState();
    const statusCallback = createStatusCallback(ctx, state);

    await session.sendMessageStreaming(
      result.text,
      username,
      userId,
      statusCallback,
      chatId,
      ctx
    );
  } catch (error) {
    console.error("Error processing voice:", error);

    if (String(error).includes("abort") || String(error).includes("cancel")) {
      const wasInterrupt = session.consumeInterruptFlag();
      if (!wasInterrupt) {
        await ctx.reply("Query stopped.");
      }
    } else {
      await ctx.reply(`Error: ${String(error).slice(0, 200)}`);
    }
  } finally {
    stopProcessing();
    typing.stop();

    if (voicePath) {
      try {
        unlinkSync(voicePath);
      } catch {
        // Ignore
      }
    }
  }
}
