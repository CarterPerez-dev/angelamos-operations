/**
 * CarterOS Telegram Bot - Streaming Handler
 *
 * Manages streaming message state and status callbacks.
 */

import type { Context } from "grammy";
import type { Message } from "grammy/types";
import type { StatusCallback } from "../types";
import { convertMarkdownToHtml, escapeHtml } from "../formatting";
import {
  TELEGRAM_MESSAGE_LIMIT,
  TELEGRAM_SAFE_LIMIT,
  STREAMING_THROTTLE_MS,
} from "../config";

export class StreamingState {
  textMessages = new Map<number, Message>();
  toolMessages: Message[] = [];
  lastEditTimes = new Map<number, number>();
  lastContent = new Map<number, string>();
}

export function createStatusCallback(
  ctx: Context,
  state: StreamingState
): StatusCallback {
  return async (statusType: string, content: string, segmentId?: number) => {
    try {
      if (statusType === "thinking") {
        const preview =
          content.length > 500 ? content.slice(0, 500) + "..." : content;
        const escaped = escapeHtml(preview);
        const thinkingMsg = await ctx.reply(`🧠 <i>${escaped}</i>`, {
          parse_mode: "HTML",
        });
        state.toolMessages.push(thinkingMsg);
      } else if (statusType === "tool") {
        const toolMsg = await ctx.reply(content, { parse_mode: "HTML" });
        state.toolMessages.push(toolMsg);
      } else if (statusType === "text" && segmentId !== undefined) {
        const now = Date.now();
        const lastEdit = state.lastEditTimes.get(segmentId) || 0;

        if (!state.textMessages.has(segmentId)) {
          const display =
            content.length > TELEGRAM_SAFE_LIMIT
              ? content.slice(0, TELEGRAM_SAFE_LIMIT) + "..."
              : content;
          const formatted = convertMarkdownToHtml(display);
          try {
            const msg = await ctx.reply(formatted, { parse_mode: "HTML" });
            state.textMessages.set(segmentId, msg);
            state.lastContent.set(segmentId, formatted);
          } catch {
            const msg = await ctx.reply(formatted);
            state.textMessages.set(segmentId, msg);
            state.lastContent.set(segmentId, formatted);
          }
          state.lastEditTimes.set(segmentId, now);
        } else if (now - lastEdit > STREAMING_THROTTLE_MS) {
          const msg = state.textMessages.get(segmentId)!;
          const display =
            content.length > TELEGRAM_SAFE_LIMIT
              ? content.slice(0, TELEGRAM_SAFE_LIMIT) + "..."
              : content;
          const formatted = convertMarkdownToHtml(display);

          if (formatted === state.lastContent.get(segmentId)) {
            return;
          }

          try {
            await ctx.api.editMessageText(
              msg.chat.id,
              msg.message_id,
              formatted,
              { parse_mode: "HTML" }
            );
            state.lastContent.set(segmentId, formatted);
          } catch {
            try {
              await ctx.api.editMessageText(
                msg.chat.id,
                msg.message_id,
                formatted
              );
              state.lastContent.set(segmentId, formatted);
            } catch {
              // Ignore edit errors
            }
          }
          state.lastEditTimes.set(segmentId, now);
        }
      } else if (statusType === "segment_end" && segmentId !== undefined) {
        if (state.textMessages.has(segmentId) && content) {
          const msg = state.textMessages.get(segmentId)!;
          const formatted = convertMarkdownToHtml(content);

          if (formatted === state.lastContent.get(segmentId)) {
            return;
          }

          if (formatted.length <= TELEGRAM_MESSAGE_LIMIT) {
            try {
              await ctx.api.editMessageText(
                msg.chat.id,
                msg.message_id,
                formatted,
                { parse_mode: "HTML" }
              );
            } catch {
              // Ignore
            }
          } else {
            try {
              await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
            } catch {
              // Ignore
            }
            for (let i = 0; i < formatted.length; i += TELEGRAM_SAFE_LIMIT) {
              const chunk = formatted.slice(i, i + TELEGRAM_SAFE_LIMIT);
              try {
                await ctx.reply(chunk, { parse_mode: "HTML" });
              } catch {
                await ctx.reply(chunk);
              }
            }
          }
        }
      } else if (statusType === "done") {
        for (const toolMsg of state.toolMessages) {
          try {
            await ctx.api.deleteMessage(toolMsg.chat.id, toolMsg.message_id);
          } catch {
            // Ignore
          }
        }
      }
    } catch (error) {
      console.error("Status callback error:", error);
    }
  };
}
