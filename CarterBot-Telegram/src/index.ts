/**
 * CarterOS Telegram Bot
 *
 * Control Claude Code from your phone via Telegram.
 * Personal assistant with access to CarterOS database.
 */

import { Bot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { TELEGRAM_TOKEN, WORKING_DIR, ALLOWED_USERS, RESTART_FILE } from "./config";
import { unlinkSync, readFileSync, existsSync } from "fs";
import {
  handleStart,
  handleNew,
  handleStop,
  handleStatus,
  handleResume,
  handleRestart,
  handleRetry,
  handleText,
  handleVoice,
  handlePhoto,
  handleDocument,
} from "./handlers";

const bot = new Bot(TELEGRAM_TOKEN);

bot.use(
  sequentialize((ctx) => {
    if (ctx.message?.text?.startsWith("/")) {
      return undefined;
    }
    if (ctx.message?.text?.startsWith("!")) {
      return undefined;
    }
    if (ctx.callbackQuery) {
      return undefined;
    }
    return ctx.chat?.id.toString();
  })
);

bot.command("start", handleStart);
bot.command("new", handleNew);
bot.command("stop", handleStop);
bot.command("status", handleStatus);
bot.command("resume", handleResume);
bot.command("restart", handleRestart);
bot.command("retry", handleRetry);

bot.on("message:text", handleText);
bot.on("message:voice", handleVoice);
bot.on("message:photo", handlePhoto);
bot.on("message:document", handleDocument);

bot.catch((err) => {
  console.error("Bot error:", err);
});

console.log("=".repeat(50));
console.log("CarterOS Telegram Bot");
console.log("=".repeat(50));
console.log(`Working directory: ${WORKING_DIR}`);
console.log(`Allowed users: ${ALLOWED_USERS.length}`);
console.log("Starting bot...");

const botInfo = await bot.api.getMe();
console.log(`Bot started: @${botInfo.username}`);

if (existsSync(RESTART_FILE)) {
  try {
    const data = JSON.parse(readFileSync(RESTART_FILE, "utf-8"));
    const age = Date.now() - data.timestamp;

    if (age < 30000 && data.chat_id && data.message_id) {
      await bot.api.editMessageText(
        data.chat_id,
        data.message_id,
        "Bot restarted"
      );
    }
    unlinkSync(RESTART_FILE);
  } catch (e) {
    console.warn("Failed to update restart message:", e);
    try {
      unlinkSync(RESTART_FILE);
    } catch {
      // Ignore
    }
  }
}

const runner = run(bot);

const stopRunner = () => {
  if (runner.isRunning()) {
    console.log("Stopping bot...");
    runner.stop();
  }
};

process.on("SIGINT", () => {
  console.log("Received SIGINT");
  stopRunner();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  stopRunner();
  process.exit(0);
});
