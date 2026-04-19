// ===================
// © AngelaMos | 2026
// video.ts
// ===================

import type { Context } from "grammy";
import { unlinkSync, mkdirSync, writeFileSync } from "fs";
import { ALLOWED_USERS, TEMP_DIR, WHISPER_SERVICE_URL, TRANSCRIPTION_DIR } from "../config";
import { isAuthorized, startTypingIndicator } from "../utils";

const TELEGRAM_FILE_LIMIT = 20 * 1024 * 1024;

const VIDEO_URL_PATTERNS = [
  /https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|p|tv)\//i,
  /https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i,
  /https?:\/\/(www\.|vm\.)?tiktok\.com\//i,
  /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\//i,
  /https?:\/\/(www\.)?facebook\.com\/.*\/videos\//i,
  /https?:\/\/(www\.)?reddit\.com\/.*\/(comments|s)\//i,
  /https?:\/\/(www\.)?threads\.net\//i,
];

export function isVideoUrl(text: string): string | null {
  const trimmed = text.trim();
  const urlMatch = trimmed.match(/https?:\/\/\S+/);
  if (!urlMatch) return null;

  const url = urlMatch[0];
  for (const pattern of VIDEO_URL_PATTERNS) {
    if (pattern.test(url)) return url;
  }
  return null;
}

async function transcribeWavAndReply(
  ctx: Context,
  chatId: number,
  wavPath: string,
  statusMsg: Awaited<ReturnType<typeof ctx.reply>>,
  durationLabel: string
): Promise<void> {
  await ctx.api.editMessageText(
    chatId,
    statusMsg.message_id,
    `Transcribing${durationLabel}...`
  );

  const wavBuffer = await Bun.file(wavPath).arrayBuffer();
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([wavBuffer], { type: "audio/wav" }),
    "audio.wav"
  );

  const response = await fetch(`${WHISPER_SERVICE_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper service error: ${response.status} ${errText}`);
  }

  const result = (await response.json()) as {
    text: string;
    language: string;
    duration: number;
  };

  if (!result.text || result.text.trim().length === 0) {
    await ctx.api.editMessageText(
      chatId,
      statusMsg.message_id,
      "No speech detected."
    );
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const preview = result.text
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = `${dateStr}_${preview || "transcription"}.txt`;
  const savePath = `${TRANSCRIPTION_DIR}/${filename}`;

  mkdirSync(TRANSCRIPTION_DIR, { recursive: true });
  writeFileSync(savePath, result.text);

  try {
    await ctx.api.deleteMessage(chatId, statusMsg.message_id);
  } catch {
    //
  }

  const LIMIT = 4000;
  const text = result.text;
  const mins = Math.floor(result.duration / 60);
  const secs = Math.round(result.duration % 60);
  const footer = `\n\nSaved: ${filename}\nAudio: ${mins}m${secs}s | Lang: ${result.language}`;

  if (text.length + footer.length <= LIMIT) {
    await ctx.reply(text + footer);
  } else {
    for (let i = 0; i < text.length; i += LIMIT) {
      await ctx.reply(text.slice(i, i + LIMIT));
    }
    await ctx.reply(footer.trim());
  }

  console.log(`Transcribed: ${result.text.length} chars, saved to ${savePath}`);
}

export async function handleVideo(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const video = ctx.message?.video || ctx.message?.video_note;

  if (!userId || !video || !chatId) return;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  if (video.file_size && video.file_size > TELEGRAM_FILE_LIMIT) {
    await ctx.reply(
      "Video too large (max 20MB via Telegram).\nTip: send the link instead and I'll download it directly."
    );
    return;
  }

  const typing = startTypingIndicator(ctx);
  const statusMsg = await ctx.reply("Downloading video...");

  let videoPath: string | null = null;
  let wavPath: string | null = null;

  try {
    const file = await ctx.getFile();
    const timestamp = Date.now();
    const ext = file.file_path?.split(".").pop() || "mp4";
    videoPath = `${TEMP_DIR}/video_${timestamp}.${ext}`;

    const downloadRes = await fetch(
      `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`
    );
    const buffer = await downloadRes.arrayBuffer();
    await Bun.write(videoPath, buffer);

    await ctx.api.editMessageText(chatId, statusMsg.message_id, "Extracting audio...");

    wavPath = `${TEMP_DIR}/audio_${timestamp}.wav`;
    const ffmpeg = Bun.spawn(
      ["ffmpeg", "-i", videoPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wavPath],
      { stdout: "pipe", stderr: "pipe" }
    );
    await ffmpeg.exited;

    if (!(await Bun.file(wavPath).exists())) {
      await ctx.api.editMessageText(chatId, statusMsg.message_id, "Failed to extract audio from video.");
      return;
    }

    const durationLabel = video.duration
      ? ` (${Math.floor(video.duration / 60)}m${video.duration % 60}s)`
      : "";

    await transcribeWavAndReply(ctx, chatId, wavPath, statusMsg, durationLabel);
  } catch (error) {
    console.error("Error processing video:", error);
    try {
      await ctx.api.editMessageText(chatId, statusMsg.message_id, `Error: ${String(error).slice(0, 200)}`);
    } catch {
      await ctx.reply(`Error: ${String(error).slice(0, 200)}`);
    }
  } finally {
    typing.stop();
    if (videoPath) try { unlinkSync(videoPath); } catch { /* */ }
    if (wavPath) try { unlinkSync(wavPath); } catch { /* */ }
  }
}

export async function handleTranscribeUrl(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;

  if (!userId || !chatId) return;

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized.");
    return;
  }

  const text = ctx.message?.text || "";
  const url = text.replace(/^\/transcribe\s*/i, "").trim() || isVideoUrl(text);

  if (!url) {
    await ctx.reply("Send a video URL to transcribe.\nSupports: Instagram, YouTube, TikTok, X/Twitter, Reddit, Threads");
    return;
  }

  const typing = startTypingIndicator(ctx);
  const statusMsg = await ctx.reply("Downloading from URL...");

  let wavPath: string | null = null;
  const timestamp = Date.now();
  const tmpDir = `${TEMP_DIR}/ytdl_${timestamp}`;

  try {
    await Bun.write(`${tmpDir}/.keep`, "");

    const ytdlp = Bun.spawn(
      [
        "yt-dlp", "-x",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--no-playlist",
        "-o", `${tmpDir}/download.%(ext)s`,
        url,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );
    await ytdlp.exited;

    const { readdirSync } = await import("fs");
    const files = readdirSync(tmpDir).filter((f: string) => !f.startsWith("."));

    if (files.length === 0) {
      await ctx.api.editMessageText(chatId, statusMsg.message_id, "Failed to download video from URL.");
      return;
    }

    const downloadedFile = `${tmpDir}/${files[0]}`;

    await ctx.api.editMessageText(chatId, statusMsg.message_id, "Extracting audio...");

    wavPath = `${TEMP_DIR}/audio_url_${timestamp}.wav`;
    const ffmpeg = Bun.spawn(
      ["ffmpeg", "-i", downloadedFile, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wavPath],
      { stdout: "pipe", stderr: "pipe" }
    );
    await ffmpeg.exited;

    if (!(await Bun.file(wavPath).exists())) {
      await ctx.api.editMessageText(chatId, statusMsg.message_id, "Failed to extract audio.");
      return;
    }

    await transcribeWavAndReply(ctx, chatId, wavPath, statusMsg, "");
  } catch (error) {
    console.error("Error processing URL:", error);
    try {
      await ctx.api.editMessageText(chatId, statusMsg.message_id, `Error: ${String(error).slice(0, 200)}`);
    } catch {
      await ctx.reply(`Error: ${String(error).slice(0, 200)}`);
    }
  } finally {
    typing.stop();
    if (wavPath) try { unlinkSync(wavPath); } catch { /* */ }
    try {
      const { rmSync } = await import("fs");
      rmSync(tmpDir, { recursive: true, force: true });
    } catch { /* */ }
  }
}
