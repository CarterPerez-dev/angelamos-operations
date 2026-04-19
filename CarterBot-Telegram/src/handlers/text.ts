/**
 * CarterOS Telegram Bot - Text Handler
 *
 * Handles incoming text messages with streaming responses.
 */

import type { Context } from "grammy";
import { session } from "../session";
import { ALLOWED_USERS } from "../config";
import { isAuthorized, checkInterrupt, startTypingIndicator } from "../utils";
import { StreamingState, createStatusCallback } from "./streaming";
import { isVideoUrl, handleTranscribeUrl } from "./video";

export async function handleText(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";
  const chatId = ctx.chat?.id;
  let message = ctx.message?.text;

  if (!userId || !message || !chatId) {
    return;
  }

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized. Contact the bot owner for access.");
    return;
  }

  message = await checkInterrupt(message);
  if (!message.trim()) {
    return;
  }

  const detectedUrl = isVideoUrl(message);
  if (detectedUrl && message.trim().match(/^https?:\/\/\S+$/)) {
    await handleTranscribeUrl(ctx);
    return;
  }

  session.lastMessage = message;

  const stopProcessing = session.startProcessing();
  const typing = startTypingIndicator(ctx);

  let state = new StreamingState();
  let statusCallback = createStatusCallback(ctx, state);

  const MAX_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await session.sendMessageStreaming(
        message,
        username,
        userId,
        statusCallback,
        chatId,
        ctx
      );
      break;
    } catch (error) {
      const errorStr = String(error);
      const isClaudeCodeCrash = errorStr.includes("exited with code");

      for (const toolMsg of state.toolMessages) {
        try {
          await ctx.api.deleteMessage(toolMsg.chat.id, toolMsg.message_id);
        } catch {
          // Ignore cleanup errors
        }
      }

      if (isClaudeCodeCrash && attempt < MAX_RETRIES) {
        console.log(
          `Claude Code crashed, retrying (attempt ${attempt + 2}/${MAX_RETRIES + 1})...`
        );
        await session.kill();
        await ctx.reply("Claude crashed, retrying...");
        state = new StreamingState();
        statusCallback = createStatusCallback(ctx, state);
        continue;
      }

      console.error("Error processing message:", error);

      if (errorStr.includes("abort") || errorStr.includes("cancel")) {
        const wasInterrupt = session.consumeInterruptFlag();
        if (!wasInterrupt) {
          await ctx.reply("Query stopped.");
        }
      } else {
        await ctx.reply(`Error: ${errorStr.slice(0, 200)}`);
      }
      break;
    }
  }

  stopProcessing();
  typing.stop();
}
