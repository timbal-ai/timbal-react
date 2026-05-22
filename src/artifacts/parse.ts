// Helpers for extracting artifact payloads from two channels:
//
// 1. Tool results — the agent returns a structured object (or JSON string)
//    from a tool, and we hand the parsed value to a renderer keyed on
//    `type`. Use this for anything interactive or sized.
// 2. Markdown fenced blocks — the agent embeds a ```timbal-artifact``` code
//    fence in regular text. The block is parsed as JSON and rendered inline.
//    Use this for one-off charts, tables, or simple HTML inside prose.
//
// Both channels go through the same `ArtifactRendererRegistry`, so a single
// renderer for `type: "chart"` works for both.

import { isArtifact, type AnyArtifact } from "./types";

/**
 * Markdown fence languages we treat as artifact payloads. `timbal-artifact`
 * is the canonical form; `timbal` is accepted as an alias because most
 * frontier models drop the suffix when generating fenced blocks.
 */
export const ARTIFACT_FENCE_LANGUAGES: ReadonlySet<string> = new Set([
  "timbal-artifact",
  "timbal",
]);

/**
 * Returns true if the given fenced-code-block language should be rendered
 * as an artifact instead of as a code block.
 */
export function isArtifactFenceLanguage(
  language: string | undefined | null,
): boolean {
  return typeof language === "string" && ARTIFACT_FENCE_LANGUAGES.has(language);
}

/**
 * Parse JSON or Python dict repr strings (single quotes, True/False/None).
 * Timbal often stringifies Python tool return values with `repr()` before
 * they reach the frontend.
 */
export function tryParseStructuredText(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through — try Python repr normalization
  }

  try {
    const asJson = trimmed
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null")
      .replace(/'/g, '"');
    return JSON.parse(asJson);
  } catch {
    return null;
  }
}

/**
 * Parse a tool result into an artifact, if possible. Strings are tried as
 * JSON first. Timbal often wraps tool return values as
 * `{ type: "text", text: "<json>" }` — we unwrap those before checking
 * `type`. Returns `null` for results that don't look like artifacts.
 */
export function parseArtifactFromToolResult(result: unknown): AnyArtifact | null {
  if (result === undefined || result === null) return null;

  if (typeof result === "string") {
    const parsed = tryParseStructuredText(result);
    if (parsed === null) return null;
    return parseArtifactFromToolResult(parsed);
  }

  if (Array.isArray(result)) {
    // Some agents wrap a single artifact in [{type: "text", text: "{...}"}].
    for (const item of result) {
      if (typeof item === "object" && item !== null && "text" in item) {
        const text = (item as { text?: unknown }).text;
        if (typeof text === "string") {
          const fromText = parseArtifactFromToolResult(text);
          if (fromText) return fromText;
        }
      }
    }
    return null;
  }

  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      return parseArtifactFromToolResult(obj.text);
    }
    if (obj.type === "thinking" && typeof obj.thinking === "string") {
      return parseArtifactFromToolResult(obj.thinking);
    }
  }

  return isArtifact(result) ? result : null;
}

export interface MarkdownArtifactMatch {
  /** The artifact payload. */
  artifact: AnyArtifact;
  /** The raw fenced block, including its ``` fences. */
  raw: string;
  /** Start offset in the source string. */
  start: number;
  /** End offset (exclusive). */
  end: number;
}

const FENCE_RE = /```(?:timbal-artifact|timbal)\s*\n([\s\S]*?)\n```/g;

/**
 * Find every `timbal-artifact` fenced block in a markdown string and return
 * each parsed payload along with its source offset. Use the offsets to splice
 * a renderer in place of the fence — see `splitMarkdownByArtifacts`.
 */
export function findMarkdownArtifacts(markdown: string): MarkdownArtifactMatch[] {
  const matches: MarkdownArtifactMatch[] = [];
  FENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FENCE_RE.exec(markdown)) !== null) {
    const raw = m[0];
    const body = m[1];
    try {
      const parsed = JSON.parse(body);
      if (isArtifact(parsed)) {
        matches.push({
          artifact: parsed,
          raw,
          start: m.index,
          end: m.index + raw.length,
        });
      }
    } catch {
      // Not valid JSON — leave it as a regular code block by ignoring it here.
    }
  }
  return matches;
}

export type MarkdownSegment =
  | { kind: "text"; text: string }
  | { kind: "artifact"; artifact: AnyArtifact };

/**
 * Split a markdown string into alternating text/artifact segments, preserving
 * order. Useful when rendering markdown with inline artifact placeholders —
 * render each segment with the appropriate component.
 */
export function splitMarkdownByArtifacts(markdown: string): MarkdownSegment[] {
  const matches = findMarkdownArtifacts(markdown);
  if (matches.length === 0) return [{ kind: "text", text: markdown }];

  const segments: MarkdownSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ kind: "text", text: markdown.slice(cursor, match.start) });
    }
    segments.push({ kind: "artifact", artifact: match.artifact });
    cursor = match.end;
  }
  if (cursor < markdown.length) {
    segments.push({ kind: "text", text: markdown.slice(cursor) });
  }
  return segments;
}
