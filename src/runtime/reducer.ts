// Pure reducer that turns Timbal SSE events into the in-memory `ContentPart[]`
// for an assistant message. Extracted from `provider.tsx` so it can be
// unit-tested without React.
//
// Wire format:
//
//   - `DELTA` events with `item.type === "text_delta"` append to the current
//     text part.
//   - `DELTA` events with `item.type === "thinking_delta"` append to the
//     current thinking part.
//   - `DELTA` events with `item.type === "tool_use"` open a new tool-call part
//     (status: "running").
//   - `DELTA` events with `item.type === "tool_use_delta"` accumulate
//     `argsText` for an open tool-call.
//   - `OUTPUT` events flush the final assistant turn. We walk
//     `output.content[]` and for each `tool_result` block we attach `result`
//     and `resultText` to the matching tool-call (status: "complete"). For
//     `tool_use` blocks we ensure the call is recorded (in case we missed the
//     opening DELTA). Trailing `text` blocks fall through to the last text
//     part if it's empty (avoids duplicating already-streamed content).

import { isArtifact } from "../artifacts/types";
import type {
  ContentPart,
  TextContentPart,
  ThinkingContentPart,
  ToolCallContentPart,
} from "./types";

export interface ReducerState {
  parts: ContentPart[];
  toolIndexById: Map<string, number>;
}

export function createReducerState(): ReducerState {
  return { parts: [], toolIndexById: new Map() };
}

export function reduceSseEvent(
  state: ReducerState,
  event: Record<string, unknown>,
): boolean {
  switch (event.type) {
    case "DELTA":
      return reduceDelta(state, event.item as Record<string, unknown> | undefined);
    case "OUTPUT": {
      // Timbal workforces emit OUTPUTs at multiple nesting levels (the leaf
      // agent's path === "agent", the workforce's path === ""). Sub-step
      // OUTPUTs echo the same content blocks but may re-issue tool ids,
      // which orphans tool_results and creates duplicate tool-call parts.
      // Top-level OUTPUT settles text/thinking; nested OUTPUTs may still
      // carry the only copy of a tool_result (or a raw tool return value).
      const path = event.path;
      const isNested = typeof path === "string" && path.includes(".");

      if (!isNested) {
        // Agents that fail (LLM error, tool exception, etc.) emit a top-level
        // OUTPUT with `status.code === "error"`. Without surfacing it, the UI
        // hangs on "Thinking…" forever. Render it as an error text part so
        // the user actually sees what went wrong.
        const errorMessage = readErrorMessage(event);
        if (errorMessage) {
          state.parts.push({ type: "text", text: `**Error:** ${errorMessage}` });
          return true;
        }
      }

      if (isNested) {
        return reduceNestedOutput(
          state,
          path as string,
          event.output as Record<string, unknown> | string | undefined,
        );
      }

      return reduceOutput(
        state,
        event.output as Record<string, unknown> | string | undefined,
      );
    }
    default:
      return false;
  }
}

function reduceDelta(
  state: ReducerState,
  item: Record<string, unknown> | undefined,
): boolean {
  if (!item) return false;

  if (item.type === "text_delta" && typeof item.text_delta === "string") {
    lastTextPart(state).text += item.text_delta;
    return true;
  }

  if (item.type === "thinking_delta" && typeof item.thinking_delta === "string") {
    lastThinkingPart(state).text += item.thinking_delta;
    return true;
  }

  if (item.type === "tool_use") {
    const toolCallId = (item.id as string) || `tool-${crypto.randomUUID()}`;
    const inputStr = stringifyInput(item.input);
    const part: ToolCallContentPart = {
      type: "tool-call",
      toolCallId,
      toolName: (item.name as string) || "unknown",
      argsText: inputStr,
      status: "running",
    };
    state.parts.push(part);
    state.toolIndexById.set(toolCallId, state.parts.length - 1);
    return true;
  }

  if (item.type === "tool_use_delta") {
    const idx = state.toolIndexById.get(item.id as string);
    if (idx !== undefined && typeof item.input_delta === "string") {
      (state.parts[idx] as ToolCallContentPart).argsText += item.input_delta;
      return true;
    }
  }

  return false;
}

function reduceNestedOutput(
  state: ReducerState,
  path: string,
  output: Record<string, unknown> | string | undefined,
): boolean {
  if (!output || typeof output !== "object") return false;

  // Tool steps often emit their return value directly as `{ type: "chart", ... }`
  // rather than an assistant `{ role, content: [...] }` envelope.
  if (!Array.isArray(output.content) && isArtifact(output)) {
    const toolName = toolNameFromPath(path);
    if (toolName && attachToolResult(state, { toolName, result: output })) {
      return true;
    }
  }

  // Still accept tool_result blocks, but ignore nested tool_use echoes.
  return reduceOutput(state, output, { toolResultsOnly: true, allowOrphan: false });
}

function reduceOutput(
  state: ReducerState,
  output: Record<string, unknown> | string | undefined,
  options?: { toolResultsOnly?: boolean; allowOrphan?: boolean },
): boolean {
  if (!output) return false;

  if (typeof output === "string") {
    if (state.parts.length === 0) {
      state.parts.push({ type: "text", text: output });
      return true;
    }
    return false;
  }

  if (Array.isArray((output as Record<string, unknown>).content)) {
    let changed = false;
    const blocks = (output as Record<string, unknown>).content as Record<
      string,
      unknown
    >[];

    for (const block of blocks) {
      if (block.type === "tool_use") {
        if (!options?.toolResultsOnly && recordToolUse(state, block)) {
          changed = true;
        }
      } else if (block.type === "tool_result") {
        if (recordToolResult(state, block, options)) changed = true;
      } else if (!options?.toolResultsOnly) {
        if (
          block.type === "text" &&
          typeof block.text === "string" &&
          !lastTextPart(state).text
        ) {
          lastTextPart(state).text = block.text;
          changed = true;
        } else if (
          block.type === "thinking" &&
          typeof block.thinking === "string" &&
          !lastThinkingPart(state).text
        ) {
          lastThinkingPart(state).text = block.thinking;
          changed = true;
        }
      }
    }

    return changed;
  }

  if (state.parts.length === 0) {
    state.parts.push({ type: "text", text: JSON.stringify(output) });
    return true;
  }
  return false;
}

function recordToolUse(
  state: ReducerState,
  block: Record<string, unknown>,
): boolean {
  const id = (block.id as string) || `tool-${crypto.randomUUID()}`;
  if (state.toolIndexById.has(id)) return false;
  const inputStr = stringifyInput(block.input);
  const part: ToolCallContentPart = {
    type: "tool-call",
    toolCallId: id,
    toolName: (block.name as string) || "unknown",
    argsText: inputStr,
    status: "running",
  };
  state.parts.push(part);
  state.toolIndexById.set(id, state.parts.length - 1);
  return true;
}

function recordToolResult(
  state: ReducerState,
  block: Record<string, unknown>,
  options?: { allowOrphan?: boolean },
): boolean {
  const allowOrphan = options?.allowOrphan !== false;
  const id = (block.id as string) || (block.tool_use_id as string) || "";
  const { result, resultText } = parseToolResultContent(block.content);
  const toolName = (block.name as string) || undefined;

  if (id) {
    const idx = state.toolIndexById.get(id);
    if (idx !== undefined) {
      const part = state.parts[idx] as ToolCallContentPart;
      part.result = result;
      if (resultText) part.resultText = resultText;
      part.status = "complete";
      return true;
    }
    if (!allowOrphan) return false;
  }

  if (
    !id &&
    toolName &&
    attachToolResult(state, {
      toolName,
      result,
      resultText,
    })
  ) {
    return true;
  }

  if (!id || !allowOrphan) return false;

  // Result arrived without a matching open call — record both at once.
  const part: ToolCallContentPart = {
    type: "tool-call",
    toolCallId: id,
    toolName: toolName || "unknown",
    argsText: "",
    result,
    resultText,
    status: "complete",
  };
  state.parts.push(part);
  state.toolIndexById.set(id, state.parts.length - 1);
  return true;
}

function toolNameFromPath(path: string): string | null {
  const segment = path.split(".").pop();
  return segment && segment !== "agent" && segment !== "llm" ? segment : null;
}

function attachToolResult(
  state: ReducerState,
  {
    toolCallId,
    toolName,
    result,
    resultText,
  }: {
    toolCallId?: string;
    toolName?: string;
    result: unknown;
    resultText?: string;
  },
): boolean {
  if (toolCallId) {
    const idx = state.toolIndexById.get(toolCallId);
    if (idx !== undefined) {
      const part = state.parts[idx] as ToolCallContentPart;
      part.result = result;
      if (resultText) part.resultText = resultText;
      part.status = "complete";
      return true;
    }
  }

  if (toolName) {
    for (let i = state.parts.length - 1; i >= 0; i--) {
      const part = state.parts[i];
      if (
        part.type === "tool-call" &&
        part.toolName === toolName &&
        part.result === undefined
      ) {
        part.result = result;
        if (resultText) part.resultText = resultText;
        part.status = "complete";
        return true;
      }
    }
  }

  return false;
}

/**
 * `tool_result.content` may be a string, an object, or an array of blocks
 * shaped like `{ type: "text" | "thinking" | "file", ... }`. We preserve the
 * raw structure in `result` and produce a flat `resultText` for renderers
 * that just want a string.
 */
function parseToolResultContent(content: unknown): {
  result: unknown;
  resultText?: string;
} {
  if (typeof content === "string") {
    return { result: content, resultText: content };
  }
  if (!Array.isArray(content)) {
    return { result: content };
  }

  const textChunks: string[] = [];
  for (const item of content) {
    if (typeof item === "string") {
      textChunks.push(item);
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (obj.type === "text" && typeof obj.text === "string") {
        textChunks.push(obj.text);
      } else if (obj.type === "thinking" && typeof obj.thinking === "string") {
        textChunks.push(obj.thinking);
      }
    }
  }
  return {
    result: content,
    resultText: textChunks.length > 0 ? textChunks.join("\n") : undefined,
  };
}

/**
 * Read an error message from a Timbal `OUTPUT` event.
 *
 * Timbal emits errors in two correlated places: `status.code === "error"`
 * (with `status.message` often `null`) and the richer `event.error` object
 * carrying `{ type, message, traceback }`. We probe both, prefer the most
 * descriptive available string, prefix it with the error type when present,
 * and truncate the long Python tracebacks the SDK sometimes inlines so the
 * UI gets a readable headline rather than 5 KB of stack frames.
 */
function readErrorMessage(event: Record<string, unknown>): string | null {
  const status = event.status as Record<string, unknown> | undefined;
  const isErrorStatus = status?.code === "error";
  const error = event.error;

  let type: string | null = null;
  let message: string | null = null;

  if (
    isErrorStatus &&
    typeof status?.message === "string" &&
    (status!.message as string).length > 0
  ) {
    message = status!.message as string;
  }

  if (!message && typeof error === "string" && error.length > 0) {
    message = error;
  } else if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.type === "string" && obj.type.length > 0) {
      type = obj.type;
    }
    if (
      !message &&
      typeof obj.message === "string" &&
      (obj.message as string).length > 0
    ) {
      message = obj.message;
    }
  }

  if (!message && !isErrorStatus) return null;
  if (!message) return "The agent failed to generate a response.";

  const compact = compactError(message);
  return type ? `${type}: ${compact}` : compact;
}

const ERROR_MAX_CHARS = 480;

function compactError(message: string): string {
  // Strip the noisy "Traceback (most recent call last)" tail that Python
  // tools sometimes inline into the message body — it duplicates the
  // dedicated `traceback` field and crowds out the actual cause.
  const trimmed = message
    .split(/\n\s*Traceback \(most recent call last\):/u)[0]
    .trim();
  if (trimmed.length <= ERROR_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, ERROR_MAX_CHARS).trimEnd()}…`;
}

function stringifyInput(input: unknown): string {
  if (input === undefined || input === null) return "{}";
  return typeof input === "string" ? input : JSON.stringify(input);
}

function lastTextPart(state: ReducerState): TextContentPart {
  const last = state.parts[state.parts.length - 1];
  if (last?.type === "text") return last;
  const next: TextContentPart = { type: "text", text: "" };
  state.parts.push(next);
  return next;
}

function lastThinkingPart(state: ReducerState): ThinkingContentPart {
  const last = state.parts[state.parts.length - 1];
  if (last?.type === "thinking") return last;
  const next: ThinkingContentPart = { type: "thinking", text: "" };
  state.parts.push(next);
  return next;
}
