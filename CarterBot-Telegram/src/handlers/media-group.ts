/**
 * CarterOS Telegram Bot - Media Group Handler
 *
 * Buffers media groups (albums) for batch processing.
 */

import type { Context } from "grammy";
import type { Message } from "grammy/types";
import type { PendingMediaGroup } from "../types";
import { MEDIA_GROUP_TIMEOUT } from "../config";
import { session } from "../session";

export interface MediaGroupConfig {
  itemLabel: string;
  itemLabelPlural: string;
}

export type ProcessGroupCallback = (
  ctx: Context,
  items: string[],
  caption: string | undefined,
  userId: number,
  username: string,
  chatId: number
) => Promise<void>;

export function createMediaGroupBuffer(config: MediaGroupConfig) {
  const pendingGroups = new Map<string, PendingMediaGroup>();

  async function processGroup(
    groupId: string,
    processCallback: ProcessGroupCallback
  ): Promise<void> {
    const group = pendingGroups.get(groupId);
    if (!group) return;

    pendingGroups.delete(groupId);

    const userId = group.ctx.from?.id;
    const username = group.ctx.from?.username || "unknown";
    const chatId = group.ctx.chat?.id;

    if (!userId || !chatId) return;

    console.log(
      `Processing ${group.items.length} ${config.itemLabelPlural} from @${username}`
    );

    if (group.statusMsg) {
      try {
        await group.ctx.api.editMessageText(
          group.statusMsg.chat.id,
          group.statusMsg.message_id,
          `Processing ${group.items.length} ${config.itemLabelPlural}...`
        );
      } catch {
        // Ignore
      }
    }

    await processCallback(
      group.ctx,
      group.items,
      group.caption,
      userId,
      username,
      chatId
    );

    if (group.statusMsg) {
      try {
        await group.ctx.api.deleteMessage(
          group.statusMsg.chat.id,
          group.statusMsg.message_id
        );
      } catch {
        // Ignore
      }
    }
  }

  async function addToGroup(
    mediaGroupId: string,
    itemPath: string,
    ctx: Context,
    userId: number,
    username: string,
    processCallback: ProcessGroupCallback
  ): Promise<boolean> {
    if (!pendingGroups.has(mediaGroupId)) {
      console.log(`Receiving ${config.itemLabel} album from @${username}`);
      const statusMsg = await ctx.reply(`Receiving ${config.itemLabelPlural}...`);

      pendingGroups.set(mediaGroupId, {
        items: [itemPath],
        ctx,
        caption: ctx.message?.caption,
        statusMsg,
        timeout: setTimeout(
          () => processGroup(mediaGroupId, processCallback),
          MEDIA_GROUP_TIMEOUT
        ),
      });
    } else {
      const group = pendingGroups.get(mediaGroupId)!;
      group.items.push(itemPath);

      if (ctx.message?.caption && !group.caption) {
        group.caption = ctx.message.caption;
      }

      clearTimeout(group.timeout);
      group.timeout = setTimeout(
        () => processGroup(mediaGroupId, processCallback),
        MEDIA_GROUP_TIMEOUT
      );
    }

    return true;
  }

  return {
    addToGroup,
    processGroup,
    pendingGroups,
  };
}

export async function handleProcessingError(
  ctx: Context,
  error: unknown,
  toolMessages: Message[]
): Promise<void> {
  console.error("Error processing media:", error);

  for (const toolMsg of toolMessages) {
    try {
      await ctx.api.deleteMessage(toolMsg.chat.id, toolMsg.message_id);
    } catch {
      // Ignore
    }
  }

  const errorStr = String(error);
  if (errorStr.includes("abort") || errorStr.includes("cancel")) {
    const wasInterrupt = session.consumeInterruptFlag();
    if (!wasInterrupt) {
      await ctx.reply("Query stopped.");
    }
  } else {
    await ctx.reply(`Error: ${errorStr.slice(0, 200)}`);
  }
}
