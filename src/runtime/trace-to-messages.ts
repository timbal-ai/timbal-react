// Reconstruct `<Thread>`-ready `ChatMessage[]` from stored run traces.
//
// A Timbal **app run** trace is a flat array of spans. Each LLM span carries
// the replayed conversation as `input.messages` and the model reply as
// `output` (a `{ role, content[] }` message). Tool executions appear either as
// `tool_result` blocks in a later step's input or as standalone `tool` spans.
//
// One run row = one conversation *turn* (one user message + the assistant's
// response, including any tool loops). `runTraceToMessages` rebuilds that turn
// as `[userMessage, assistantMessage]`; `conversationRunsToMessages` stitches a
// whole `group_id` thread together in order. Assistant messages are stamped
// with `runId` so the runtime can continue the thread (parent resolution).

import type { TraceSpan, RunDetail, RunPreview } from "./conversations";
import { orderRunsForThread } from "./conversations";
import type {
  ChatAttachment,
  ChatMessage,
  ContentPart,
  TextContentPart,
  ToolCallContentPart,
} from "./types";

// ---------------------------------------------------------------------------
// Content normalization (shared with the platform's trace utilities)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Flatten Anthropic-style content (string | block[] | nested) to plain text. */
export function normalizeContentToText(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const block of content) {
      if (!isRecord(block)) continue;
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      } else if (block.type === "thinking" && typeof block.thinking === "string") {
        parts.push(block.thinking);
      } else if (typeof block.text === "string") {
        parts.push(block.text);
      }
    }
    return parts.join("\n").trim();
  }
  if (isRecord(content)) {
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  return String(content);
}

function spanTimeMs(span: TraceSpan): number {
  const raw = span.start_time ?? span.t0 ?? 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return n < 1e12 ? n * 1000 : n;
}

function spanLeafName(span: TraceSpan): string {
  if (!span.path) return "";
  return String(span.path).split(".").pop() ?? "";
}

function isLlmSpan(span: TraceSpan): boolean {
  if (spanLeafName(span).toLowerCase() === "llm") return true;
  return String(span.metadata?.type ?? "").toLowerCase() === "llm";
}

function isToolSpan(span: TraceSpan): boolean {
  return String(span.metadata?.type ?? "").toLowerCase() === "tool";
}

function sortedTrace(trace: TraceSpan[]): TraceSpan[] {
  return [...trace].sort((a, b) => spanTimeMs(a) - spanTimeMs(b));
}

// ---------------------------------------------------------------------------
// Message extraction from a span's input/output envelope
// ---------------------------------------------------------------------------

interface RawMessage {
  role: string;
  content: unknown;
}

/** Pull the `messages` array out of a step input envelope, if any. */
function messagesFromInput(input: unknown): RawMessage[] {
  if (Array.isArray(input)) {
    return input
      .filter((m): m is Record<string, unknown> => isRecord(m) && ("role" in m || "type" in m))
      .map((m) => ({
        role: String(m.role ?? m.type ?? ""),
        content: m.content ?? m.text ?? m,
      }));
  }
  if (isRecord(input) && Array.isArray(input.messages)) {
    return (input.messages as unknown[])
      .filter((m): m is Record<string, unknown> => isRecord(m) && ("role" in m || "type" in m))
      .map((m) => ({
        role: String(m.role ?? m.type ?? ""),
        content: m.content ?? m.text ?? m,
      }));
  }
  return [];
}

function isUserRole(role: string): boolean {
  const r = role.toLowerCase();
  return r === "user" || r === "human";
}

function isAssistantRole(role: string): boolean {
  const r = role.toLowerCase();
  return r === "assistant" || r === "ai";
}

let attachmentSeq = 0;
function nextAttachmentId(): string {
  attachmentSeq += 1;
  return `trace-att-${attachmentSeq}`;
}

function guessAttachmentType(
  url: string,
  mime?: string,
): ChatAttachment["type"] {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("application/") || m.startsWith("text/")) return "document";
  if (/^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) {
    return "image";
  }
  return "file";
}

/** Extract any file/image blocks from a user message's content as attachments. */
function attachmentsFromContent(content: unknown): ChatAttachment[] {
  if (!Array.isArray(content)) return [];
  const out: ChatAttachment[] = [];
  for (const block of content) {
    if (!isRecord(block)) continue;
    if (block.type === "file" || block.type === "image") {
      const url =
        (typeof block.file === "string" && block.file) ||
        (typeof block.image === "string" && block.image) ||
        (typeof block.url === "string" && block.url) ||
        (typeof block.data === "string" && block.data) ||
        "";
      if (!url) continue;
      const mime =
        (typeof block.mimeType === "string" && block.mimeType) ||
        (typeof block.content_type === "string" && block.content_type) ||
        undefined;
      out.push({
        id: nextAttachmentId(),
        type: block.type === "image" ? "image" : guessAttachmentType(url, mime),
        dataUrl: url,
        ...(typeof block.filename === "string" ? { name: block.filename } : {}),
        ...(mime ? { contentType: mime } : {}),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tool result parsing (mirrors runtime/reducer.ts)
// ---------------------------------------------------------------------------

function parseToolResultContent(content: unknown): {
  result: unknown;
  resultText?: string;
} {
  if (typeof content === "string") return { result: content, resultText: content };
  if (!Array.isArray(content)) return { result: content };

  const chunks: string[] = [];
  for (const item of content) {
    if (typeof item === "string") chunks.push(item);
    else if (isRecord(item)) {
      if (item.type === "text" && typeof item.text === "string") chunks.push(item.text);
      else if (item.type === "thinking" && typeof item.thinking === "string")
        chunks.push(item.thinking);
    }
  }
  return { result: content, resultText: chunks.length ? chunks.join("\n") : undefined };
}

interface ToolResultInfo {
  result: unknown;
  resultText?: string;
}

/** Collect every tool_result (by id) seen across step inputs + tool spans. */
function collectToolResults(
  llmSteps: TraceSpan[],
  toolSpans: TraceSpan[],
): { byId: Map<string, ToolResultInfo>; byName: Map<string, ToolResultInfo[]> } {
  const byId = new Map<string, ToolResultInfo>();
  const byName = new Map<string, ToolResultInfo[]>();

  for (const step of llmSteps) {
    for (const msg of messagesFromInput(step.input)) {
      if (!Array.isArray(msg.content)) continue;
      for (const block of msg.content) {
        if (!isRecord(block) || block.type !== "tool_result") continue;
        const id =
          (typeof block.id === "string" && block.id) ||
          (typeof block.tool_use_id === "string" && block.tool_use_id) ||
          "";
        const info = parseToolResultContent(block.content);
        if (id && !byId.has(id)) byId.set(id, info);
      }
    }
  }

  for (const span of toolSpans) {
    const name = spanLeafName(span);
    if (!name) continue;
    const info = parseToolResultContent(
      isRecord(span.output) && "content" in span.output
        ? (span.output as Record<string, unknown>).content
        : span.output,
    );
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push(info);
  }

  return { byId, byName };
}

// ---------------------------------------------------------------------------
// Assistant message reconstruction
// ---------------------------------------------------------------------------

function appendText(parts: ContentPart[], text: string): void {
  const last = parts[parts.length - 1];
  if (last && last.type === "text") {
    (last as TextContentPart).text += text;
  } else {
    parts.push({ type: "text", text });
  }
}

/** Turn one assistant message's content blocks into runtime parts. */
function assistantBlocksToParts(content: unknown): {
  parts: ContentPart[];
  toolIds: string[];
} {
  const parts: ContentPart[] = [];
  const toolIds: string[] = [];

  if (typeof content === "string") {
    if (content.trim()) parts.push({ type: "text", text: content });
    return { parts, toolIds };
  }
  if (!Array.isArray(content)) return { parts, toolIds };

  for (const block of content) {
    if (!isRecord(block)) continue;
    if (block.type === "text" && typeof block.text === "string") {
      if (block.text) appendText(parts, block.text);
    } else if (block.type === "thinking") {
      const text =
        (typeof block.thinking === "string" && block.thinking) ||
        (typeof block.text === "string" && block.text) ||
        "";
      if (text) parts.push({ type: "thinking", text });
    } else if (block.type === "tool_use") {
      const id =
        (typeof block.id === "string" && block.id) || `tool-${parts.length}`;
      const input = block.input;
      const argsText =
        input == null
          ? "{}"
          : typeof input === "string"
            ? input
            : JSON.stringify(input);
      parts.push({
        type: "tool-call",
        toolCallId: id,
        toolName: (typeof block.name === "string" && block.name) || "unknown",
        argsText,
        status: "running",
      });
      toolIds.push(id);
    }
  }

  return { parts, toolIds };
}

function attachResults(
  parts: ContentPart[],
  results: ReturnType<typeof collectToolResults>,
): void {
  const usedByName = new Map<string, number>();
  for (const part of parts) {
    if (part.type !== "tool-call") continue;
    const tc = part as ToolCallContentPart;
    const byId = results.byId.get(tc.toolCallId);
    if (byId) {
      tc.result = byId.result;
      if (byId.resultText) tc.resultText = byId.resultText;
      tc.status = "complete";
      continue;
    }
    const candidates = results.byName.get(tc.toolName);
    if (candidates && candidates.length) {
      const used = usedByName.get(tc.toolName) ?? 0;
      const info = candidates[used] ?? candidates[candidates.length - 1];
      usedByName.set(tc.toolName, used + 1);
      tc.result = info.result;
      if (info.resultText) tc.resultText = info.resultText;
      tc.status = "complete";
    }
  }
}

// ---------------------------------------------------------------------------
// Public converters
// ---------------------------------------------------------------------------

export interface RunTraceToMessagesOptions {
  /** Stamp this run id onto produced messages (enables thread continuation). */
  runId?: string | number | null;
  /** Drop the user message (e.g. when the run carries only system output). */
  includeUser?: boolean;
}

/**
 * Convert a single run's `trace` into `[userMessage?, assistantMessage]`.
 * Returns `[]` when the trace yields no usable content.
 */
export function runTraceToMessages(
  trace: TraceSpan[] | null | undefined,
  options: RunTraceToMessagesOptions = {},
): ChatMessage[] {
  const { runId = null, includeUser = true } = options;
  if (!Array.isArray(trace) || trace.length === 0) return [];

  const sorted = sortedTrace(trace);
  const llmSteps = sorted.filter(isLlmSpan);
  const toolSpans = sorted.filter(isToolSpan);

  const messages: ChatMessage[] = [];
  const idStr = runId != null ? String(runId) : undefined;

  // ---- User message (the new turn input) --------------------------------
  if (includeUser) {
    let userText = "";
    let userAttachments: ChatAttachment[] = [];
    const firstStep = llmSteps[0];
    if (firstStep) {
      const msgs = messagesFromInput(firstStep.input);
      const lastUser = [...msgs].reverse().find((m) => isUserRole(m.role));
      if (lastUser) {
        userText = normalizeContentToText(lastUser.content);
        userAttachments = attachmentsFromContent(lastUser.content);
      }
    }
    if (!userText && !llmSteps.length) {
      // Fallback for traces without LLM spans: use the natural root input.
      const root = sorted.find((s) => !s.parent_call_id) ?? sorted[0];
      const msgs = messagesFromInput(root?.input);
      const lastUser = [...msgs].reverse().find((m) => isUserRole(m.role));
      userText = lastUser
        ? normalizeContentToText(lastUser.content)
        : normalizeContentToText(root?.input);
      userAttachments = lastUser ? attachmentsFromContent(lastUser.content) : [];
    }
    if (userText || userAttachments.length) {
      messages.push({
        id: idStr ? `${idStr}-user` : `user-${crypto.randomUUID()}`,
        role: "user",
        content: userText ? [{ type: "text", text: userText }] : [],
        ...(userAttachments.length ? { attachments: userAttachments } : {}),
      });
    }
  }

  // ---- Assistant message (model output + tool calls) --------------------
  const parts: ContentPart[] = [];
  if (llmSteps.length) {
    for (const step of llmSteps) {
      const output = step.error ?? step.output;
      const content =
        isRecord(output) && "content" in output
          ? (output as Record<string, unknown>).content
          : output;
      const { parts: stepParts } = assistantBlocksToParts(content);
      parts.push(...stepParts);
    }
    attachResults(parts, collectToolResults(llmSteps, toolSpans));
  } else {
    // No LLM spans — fall back to the root span output as plain text.
    const root = sorted.find((s) => !s.parent_call_id) ?? sorted[0];
    const output = root?.error ?? root?.output;
    const msgs = messagesFromInput(output);
    const lastAsst = [...msgs].reverse().find((m) => isAssistantRole(m.role));
    const text = lastAsst
      ? normalizeContentToText(lastAsst.content)
      : normalizeContentToText(output);
    if (text) parts.push({ type: "text", text });
  }

  if (parts.length) {
    messages.push({
      id: idStr ? `${idStr}-assistant` : `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: parts,
      ...(idStr ? { runId: idStr } : {}),
    });
  } else if (idStr && messages.length) {
    // Always give the turn an assistant anchor so continuation has a parent.
    messages.push({
      id: `${idStr}-assistant`,
      role: "assistant",
      content: [],
      runId: idStr,
    });
  }

  return messages;
}

/**
 * Stitch a whole conversation (all runs sharing a `group_id`) into one ordered
 * `ChatMessage[]`. Pass the run list from `listRuns({ groupId })` plus a map of
 * run id → `RunDetail` (with `trace`) from {@link getRun}.
 */
export function conversationRunsToMessages(
  runs: RunPreview[],
  detailByRunId: Map<string, RunDetail> | Record<string, RunDetail>,
): ChatMessage[] {
  const ordered = orderRunsForThread(runs);
  const getDetail = (id: string): RunDetail | undefined =>
    detailByRunId instanceof Map ? detailByRunId.get(id) : detailByRunId[id];

  const out: ChatMessage[] = [];
  for (const run of ordered) {
    const id = run?.id != null ? String(run.id) : "";
    if (!id) continue;
    const detail = getDetail(id);
    const trace = detail?.trace;
    if (!Array.isArray(trace)) continue;
    out.push(...runTraceToMessages(trace, { runId: id }));
  }
  return out;
}
