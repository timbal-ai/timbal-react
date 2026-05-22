// Shared runtime types for Timbal streaming, tool calls, and artifacts.
//
// These types describe the in-memory shape of messages held by
// `TimbalRuntimeProvider`. They are consumed by `useTimbalStream` and by
// custom `MessagePrimitive.Parts` renderers.

export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ThinkingContentPart {
  type: "thinking";
  text: string;
}

/**
 * A tool invocation. `argsText` accumulates from streaming `tool_use_delta`
 * events; `result` is set once the matching `tool_result` arrives in the
 * `OUTPUT` event.
 *
 * `result` is always a JSON-serializable value (string, number, object, array)
 * — the runtime preserves whatever the agent returns. `resultText` is the
 * text representation of the result blocks from `tool_result.content`, useful
 * as a quick fallback when callers don't want to walk the structured result.
 */
export interface ToolCallContentPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  argsText: string;
  result?: unknown;
  resultText?: string;
  status?: "running" | "complete" | "error";
}

export type ContentPart = TextContentPart | ThinkingContentPart | ToolCallContentPart;

export type MessageRole = "user" | "assistant";

/**
 * A file attached to a user message. We carry a single `dataUrl` field
 * (despite the name, it may be either a `data:<mime>;base64,<bytes>` URL
 * or a real `https://...` URL returned by an upload adapter) and project
 * it both onto the wire (`{type:"file", file: dataUrl}`) and onto the
 * assistant-ui display layer (`ImageMessagePart` / `FileMessagePart`
 * inside `attachments[].content`).
 *
 * Both forms are accepted by Timbal's `FileContent` factory, so the same
 * field works whether the attachment was inlined as base64 or uploaded
 * to object storage.
 */
export interface ChatAttachment {
  id: string;
  type: "image" | "document" | "file";
  name?: string;
  contentType?: string;
  /**
   * Either a `data:<mime>;base64,<bytes>` URL (inline) or a remote
   * `https://...` URL produced by an upload-style {@link AttachmentAdapter}.
   */
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: ContentPart[];
  /** Files attached to a user message. Empty/undefined for assistant messages. */
  attachments?: ChatAttachment[];
  /** Run id stamped from the top-level `START` SSE event. */
  runId?: string;
}
