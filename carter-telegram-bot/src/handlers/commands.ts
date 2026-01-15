/**
 * CarterOS Telegram Bot - Command Handlers
 *
 * /start, /new, /stop, /status, /resume, /restart, /retry
 */

import type { Context } from "grammy";
import { session } from "../session";
import { WORKING_DIR, ALLOWED_USERS, RESTART_FILE } from "../config";
import { isAuthorized } from "../utils";

export async function handleStart(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized. Contact the bot owner for access.");
    return;
  }

  const status = session.isActive ? "Active session" : "No active session";

  await ctx.reply(
    `<b>CarterOS Telegram Bot</b>\n\n` +
      `Status: ${status}\n` +
      `Working directory: <code>${WORKING_DIR}</code>\n\n` +
      `<b>Commands:</b>\n` +
      `/new - Start fresh session\n` +
      `/stop - Stop current query\n` +
      `/status - Show detailed status\n` +
      `/resume - Resume last session\n` +
      `/retry - Retry last message\n` +
      `/restart - Restart the bot\n\n` +
      `<b>Tips:</b>\n` +
      `Prefix with <code>!</code> to interrupt current query\n` +
      `Use "think" or "ultrathink" for extended reasoning\n` +
      `Send photos, voice, or documents`,
    { parse_mode: "HTML" }
  );
}

export async function handleNew(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  if (session.isRunning) {
    const result = await session.stop();
    if (result) {
      await Bun.sleep(100);
      session.clearStopRequested();
    }
  }

  await session.kill();

  await ctx.reply("Session cleared. Next message starts fresh.");
}

export async function handleStop(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  if (session.isRunning) {
    const result = await session.stop();
    if (result) {
      await Bun.sleep(100);
      session.clearStopRequested();
    }
  }
}

export async function handleStatus(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  const lines: string[] = ["<b>Bot Status</b>\n"];

  if (session.isActive) {
    lines.push(`Session: Active (${session.sessionId?.slice(0, 8)}...)`);
  } else {
    lines.push("Session: None");
  }

  if (session.isRunning) {
    const elapsed = session.queryStarted
      ? Math.floor((Date.now() - session.queryStarted.getTime()) / 1000)
      : 0;
    lines.push(`Query: Running (${elapsed}s)`);
    if (session.currentTool) {
      lines.push(`   ${session.currentTool}`);
    }
  } else {
    lines.push("Query: Idle");
    if (session.lastTool) {
      lines.push(`   Last: ${session.lastTool}`);
    }
  }

  if (session.lastActivity) {
    const ago = Math.floor(
      (Date.now() - session.lastActivity.getTime()) / 1000
    );
    lines.push(`\nLast activity: ${ago}s ago`);
  }

  if (session.lastUsage) {
    const usage = session.lastUsage;
    lines.push(
      `\nLast query usage:`,
      `   Input: ${usage.input_tokens?.toLocaleString() || "?"} tokens`,
      `   Output: ${usage.output_tokens?.toLocaleString() || "?"} tokens`
    );
    if (usage.cache_read_input_tokens) {
      lines.push(
        `   Cache read: ${usage.cache_read_input_tokens.toLocaleString()}`
      );
    }
  }

  if (session.lastError) {
    const ago = session.lastErrorTime
      ? Math.floor((Date.now() - session.lastErrorTime.getTime()) / 1000)
      : "?";
    lines.push(`\nLast error (${ago}s ago):`, `   ${session.lastError}`);
  }

  lines.push(`\nWorking dir: <code>${WORKING_DIR}</code>`);

  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}

export async function handleResume(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  if (session.isActive) {
    await ctx.reply("Session already active. Use /new to start fresh first.");
    return;
  }

  const [success, message] = session.resumeLast();
  if (success) {
    await ctx.reply(message);
  } else {
    await ctx.reply(message);
  }
}

export async function handleRestart(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  const msg = await ctx.reply("Restarting bot...");

  if (chatId && msg.message_id) {
    try {
      await Bun.write(
        RESTART_FILE,
        JSON.stringify({
          chat_id: chatId,
          message_id: msg.message_id,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn("Failed to save restart info:", e);
    }
  }

  await Bun.sleep(500);

  process.exit(0);
}

export async function handleRetry(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  if (!session.lastMessage) {
    await ctx.reply("No message to retry.");
    return;
  }

  if (session.isRunning) {
    await ctx.reply("A query is already running. Use /stop first.");
    return;
  }

  const message = session.lastMessage;
  await ctx.reply(`Retrying: "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}"`);

  const { handleText } = await import("./text");

  const fakeCtx = {
    ...ctx,
    message: {
      ...ctx.message,
      text: message,
    },
  } as Context;

  await handleText(fakeCtx);
}
