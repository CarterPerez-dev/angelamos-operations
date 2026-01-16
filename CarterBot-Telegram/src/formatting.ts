/**
 * CarterOS Telegram Bot - Formatting
 *
 * Markdown to Telegram HTML conversion and tool status display.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function convertMarkdownToHtml(text: string): string {
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  text = text.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
  });

  text = text.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `\x00INLINECODE${inlineCodes.length - 1}\x00`;
  });

  text = escapeHtml(text);

  text = text.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>\n");
  text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  text = text.replace(/(?<!\*)\*(.+?)\*(?!\*)/g, "<b>$1</b>");
  text = text.replace(/__([^_]+)__/g, "<b>$1</b>");
  text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, "<i>$1</i>");
  text = text.replace(/^[-*] /gm, "• ");
  text = text.replace(/^[-*]{3,}$/gm, "");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  for (let i = 0; i < codeBlocks.length; i++) {
    const escapedCode = escapeHtml(codeBlocks[i]!);
    text = text.replace(`\x00CODEBLOCK${i}\x00`, `<pre>${escapedCode}</pre>`);
  }

  for (let i = 0; i < inlineCodes.length; i++) {
    const escapedCode = escapeHtml(inlineCodes[i]!);
    text = text.replace(
      `\x00INLINECODE${i}\x00`,
      `<code>${escapedCode}</code>`
    );
  }

  text = text.replace(/\n{3,}/g, "\n\n");

  return text;
}

function shortenPath(path: string): string {
  if (!path) return "file";
  const parts = path.split("/");
  if (parts.length >= 2) {
    return parts.slice(-2).join("/");
  }
  return parts[parts.length - 1] || path;
}

function truncate(text: string, maxLen = 60): string {
  if (!text) return "";
  const cleaned = text.replace(/\n/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + "...";
}

function code(text: string): string {
  return `<code>${escapeHtml(text)}</code>`;
}

export function formatToolStatus(
  toolName: string,
  toolInput: Record<string, unknown>
): string {
  const emojiMap: Record<string, string> = {
    Read: "📖",
    Write: "📝",
    Edit: "✏️",
    Bash: "▶️",
    Glob: "🔍",
    Grep: "🔎",
    WebSearch: "🔍",
    WebFetch: "🌐",
    Task: "🎯",
    mcp__carteros: "🗄️",
    mcp__: "🔧",
  };

  let emoji = "🔧";
  for (const [key, val] of Object.entries(emojiMap)) {
    if (toolName.includes(key)) {
      emoji = val;
      break;
    }
  }

  if (toolName === "Read") {
    const filePath = String(toolInput.file_path || "file");
    return `${emoji} Reading ${code(shortenPath(filePath))}`;
  }

  if (toolName === "Write") {
    const filePath = String(toolInput.file_path || "file");
    return `${emoji} Writing ${code(shortenPath(filePath))}`;
  }

  if (toolName === "Edit") {
    const filePath = String(toolInput.file_path || "file");
    return `${emoji} Editing ${code(shortenPath(filePath))}`;
  }

  if (toolName === "Bash") {
    const cmd = String(toolInput.command || "");
    const desc = String(toolInput.description || "");
    if (desc) {
      return `${emoji} ${escapeHtml(desc)}`;
    }
    return `${emoji} ${code(truncate(cmd, 50))}`;
  }

  if (toolName === "Grep") {
    const pattern = String(toolInput.pattern || "");
    return `${emoji} Searching ${code(truncate(pattern, 40))}`;
  }

  if (toolName === "Glob") {
    const pattern = String(toolInput.pattern || "");
    return `${emoji} Finding ${code(truncate(pattern, 50))}`;
  }

  if (toolName === "WebSearch") {
    const query = String(toolInput.query || "");
    return `${emoji} Searching: ${escapeHtml(truncate(query, 50))}`;
  }

  if (toolName === "WebFetch") {
    const url = String(toolInput.url || "");
    return `${emoji} Fetching ${code(truncate(url, 50))}`;
  }

  if (toolName === "Task") {
    const desc = String(toolInput.description || "");
    if (desc) {
      return `${emoji} Agent: ${escapeHtml(desc)}`;
    }
    return `${emoji} Running agent...`;
  }

  if (toolName.startsWith("mcp__carteros")) {
    const parts = toolName.split("__");
    if (parts.length >= 3) {
      let action = parts[2]!;
      action = action.replace(/_/g, " ");

      const summary =
        toolInput.title ||
        toolInput.query ||
        toolInput.sql ||
        toolInput.company ||
        "";

      if (summary) {
        return `🗄️ CarterOS ${action}: ${escapeHtml(truncate(String(summary), 35))}`;
      }
      return `🗄️ CarterOS: ${action}`;
    }
  }

  if (toolName.startsWith("mcp__")) {
    const parts = toolName.split("__");
    if (parts.length >= 3) {
      const server = parts[1]!;
      let action = parts[2]!;
      action = action.replace(/_/g, " ");

      const summary =
        toolInput.title ||
        toolInput.query ||
        toolInput.content ||
        "";

      if (summary) {
        return `🔧 ${server} ${action}: ${escapeHtml(truncate(String(summary), 40))}`;
      }
      return `🔧 ${server}: ${action}`;
    }
  }

  return `${emoji} ${escapeHtml(toolName)}`;
}
