/**
 * CarterOS Telegram Bot - Document Handler
 *
 * Handles PDFs and text files with media group support.
 */

import type { Context } from "grammy";
import { session } from "../session";
import { ALLOWED_USERS, TEMP_DIR } from "../config";
import { isAuthorized, startTypingIndicator } from "../utils";
import { StreamingState, createStatusCallback } from "./streaming";
import { createMediaGroupBuffer, handleProcessingError } from "./media-group";

const TEXT_EXTENSIONS = [
  ".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".xml",
  ".html", ".css", ".js", ".ts", ".py", ".sh", ".env",
  ".log", ".cfg", ".ini", ".toml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const documentBuffer = createMediaGroupBuffer({
  itemLabel: "document",
  itemLabelPlural: "documents",
});

async function downloadDocument(ctx: Context): Promise<string> {
  const doc = ctx.message?.document;
  if (!doc) {
    throw new Error("No document in message");
  }

  const file = await ctx.getFile();
  const fileName = doc.file_name || `doc_${Date.now()}`;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const docPath = `${TEMP_DIR}/${safeName}`;

  const response = await fetch(
    `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`
  );
  const buffer = await response.arrayBuffer();
  await Bun.write(docPath, buffer);

  return docPath;
}

async function extractText(filePath: string, mimeType?: string): Promise<string> {
  const fileName = filePath.split("/").pop() || "";
  const extension = "." + (fileName.split(".").pop() || "").toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    try {
      const result = await Bun.$`pdftotext -layout ${filePath} -`.quiet();
      return result.text();
    } catch (error) {
      console.error("PDF parsing failed:", error);
      return "[PDF parsing failed - ensure pdftotext is installed]";
    }
  }

  if (TEXT_EXTENSIONS.includes(extension) || mimeType?.startsWith("text/")) {
    const text = await Bun.file(filePath).text();
    return text.slice(0, 100000);
  }

  throw new Error(`Unsupported file type: ${extension || mimeType}`);
}

async function processDocuments(
  ctx: Context,
  documents: Array<{ path: string; name: string; content: string }>,
  caption: string | undefined,
  userId: number,
  username: string,
  chatId: number
): Promise<void> {
  const stopProcessing = session.startProcessing();

  let prompt: string;
  if (documents.length === 1) {
    const doc = documents[0]!;
    prompt = caption
      ? `Document: ${doc.name}\n\nContent:\n${doc.content}\n\n---\n\n${caption}`
      : `Please analyze this document (${doc.name}):\n\n${doc.content}`;
  } else {
    const docList = documents
      .map((d, i) => `--- Document ${i + 1}: ${d.name} ---\n${d.content}`)
      .join("\n\n");
    prompt = caption
      ? `${documents.length} Documents:\n\n${docList}\n\n---\n\n${caption}`
      : `Please analyze these ${documents.length} documents:\n\n${docList}`;
  }

  const typing = startTypingIndicator(ctx);
  const state = new StreamingState();
  const statusCallback = createStatusCallback(ctx, state);

  try {
    await session.sendMessageStreaming(
      prompt,
      username,
      userId,
      statusCallback,
      chatId,
      ctx
    );
  } catch (error) {
    await handleProcessingError(ctx, error, state.toolMessages);
  } finally {
    stopProcessing();
    typing.stop();
  }
}

async function processDocumentPaths(
  ctx: Context,
  paths: string[],
  caption: string | undefined,
  userId: number,
  username: string,
  chatId: number
): Promise<void> {
  const documents: Array<{ path: string; name: string; content: string }> = [];

  for (const path of paths) {
    try {
      const name = path.split("/").pop() || "document";
      const content = await extractText(path);
      documents.push({ path, name, content });
    } catch (error) {
      console.error(`Failed to extract ${path}:`, error);
    }
  }

  if (documents.length === 0) {
    await ctx.reply("Failed to extract any documents.");
    return;
  }

  await processDocuments(ctx, documents, caption, userId, username, chatId);
}

export async function handleDocument(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";
  const chatId = ctx.chat?.id;
  const doc = ctx.message?.document;
  const mediaGroupId = ctx.message?.media_group_id;

  if (!userId || !chatId || !doc) {
    return;
  }

  if (!isAuthorized(userId, ALLOWED_USERS)) {
    await ctx.reply("Unauthorized. Contact the bot owner for access.");
    return;
  }

  if (doc.file_size && doc.file_size > MAX_FILE_SIZE) {
    await ctx.reply("File too large. Maximum size is 10MB.");
    return;
  }

  const fileName = doc.file_name || "";
  const extension = "." + (fileName.split(".").pop() || "").toLowerCase();
  const isPdf = doc.mime_type === "application/pdf" || extension === ".pdf";
  const isText = TEXT_EXTENSIONS.includes(extension) || doc.mime_type?.startsWith("text/");

  if (!isPdf && !isText) {
    await ctx.reply(
      `Unsupported file type: ${extension || doc.mime_type}\n\n` +
        `Supported: PDF, ${TEXT_EXTENSIONS.join(", ")}`
    );
    return;
  }

  let docPath: string;
  try {
    docPath = await downloadDocument(ctx);
  } catch (error) {
    console.error("Failed to download document:", error);
    await ctx.reply("Failed to download document.");
    return;
  }

  if (!mediaGroupId) {
    console.log(`Received document: ${fileName} from @${username}`);

    try {
      const content = await extractText(docPath, doc.mime_type);
      await processDocuments(
        ctx,
        [{ path: docPath, name: fileName, content }],
        ctx.message?.caption,
        userId,
        username,
        chatId
      );
    } catch (error) {
      console.error("Failed to extract document:", error);
      await ctx.reply(`Failed to process document: ${String(error).slice(0, 100)}`);
    }
    return;
  }

  await documentBuffer.addToGroup(
    mediaGroupId,
    docPath,
    ctx,
    userId,
    username,
    processDocumentPaths
  );
}
