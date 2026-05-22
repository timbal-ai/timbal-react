import { describe, it, expect } from "bun:test";
import {
  ARTIFACT_FENCE_LANGUAGES,
  findMarkdownArtifacts,
  isArtifactFenceLanguage,
  parseArtifactFromToolResult,
  splitMarkdownByArtifacts,
} from "./parse";

describe("parseArtifactFromToolResult", () => {
  it("returns null for nullish results", () => {
    expect(parseArtifactFromToolResult(null)).toBeNull();
    expect(parseArtifactFromToolResult(undefined)).toBeNull();
  });

  it("passes through artifact-shaped objects", () => {
    const a = { type: "chart", data: [{ x: 1 }] };
    expect(parseArtifactFromToolResult(a)).toEqual(a);
  });

  it("rejects objects without a string type", () => {
    expect(parseArtifactFromToolResult({ data: [] })).toBeNull();
  });

  it("parses JSON strings", () => {
    const a = { type: "question", options: [{ id: "a", label: "A" }] };
    expect(parseArtifactFromToolResult(JSON.stringify(a))).toEqual(a);
  });

  it("unwraps a single { type: text, text } tool-result block", () => {
    const a = { type: "ui", root: { kind: "text", value: "hi" } };
    expect(
      parseArtifactFromToolResult({
        type: "text",
        text: JSON.stringify(a),
      }),
    ).toEqual(a);
  });

  it("parses Python repr strings from Timbal tool results", () => {
    const pyRepr =
      "{'type': 'ui', 'title': 'Demo', 'initialState': {'qty': 3, 'premium': False}, 'root': {'kind': 'text', 'value': 'hi'}}";
    expect(parseArtifactFromToolResult(pyRepr)).toEqual({
      type: "ui",
      title: "Demo",
      initialState: { qty: 3, premium: false },
      root: { kind: "text", value: "hi" },
    });
  });

  it("parses Python repr inside wrapped tool_result blocks", () => {
    const pyRepr = "{'type': 'chart', 'data': [{'x': 1}]}";
    expect(
      parseArtifactFromToolResult([{ type: "text", text: pyRepr }]),
    ).toEqual({ type: "chart", data: [{ x: 1 }] });
  });

  it("ignores non-JSON strings", () => {
    expect(parseArtifactFromToolResult("Tool ran successfully.")).toBeNull();
  });

  it("digs into wrapped tool_result text blocks", () => {
    const inner = { type: "html", content: "<b>hi</b>" };
    const wrapped = [
      { type: "text", text: "Result:" },
      { type: "text", text: JSON.stringify(inner) },
    ];
    expect(parseArtifactFromToolResult(wrapped)).toEqual(inner);
  });
});

describe("findMarkdownArtifacts", () => {
  it("finds a single fenced artifact", () => {
    const md = `intro\n\`\`\`timbal-artifact\n{"type":"chart","data":[{"x":1}]}\n\`\`\`\nouttro`;
    const matches = findMarkdownArtifacts(md);
    expect(matches).toHaveLength(1);
    expect(matches[0].artifact).toEqual({
      type: "chart",
      data: [{ x: 1 }],
    });
  });

  it("finds multiple fenced artifacts in order", () => {
    const md =
      "a\n```timbal-artifact\n" +
      JSON.stringify({ type: "table", rows: [] }) +
      "\n```\nb\n```timbal-artifact\n" +
      JSON.stringify({ type: "json", data: 1 }) +
      "\n```\nc";
    const matches = findMarkdownArtifacts(md);
    expect(matches.map((m) => m.artifact.type)).toEqual(["table", "json"]);
  });

  it("ignores fenced blocks with invalid JSON", () => {
    const md = "```timbal-artifact\nnot json\n```";
    expect(findMarkdownArtifacts(md)).toHaveLength(0);
  });

  it("ignores other fence languages", () => {
    const md = "```json\n{\"type\":\"chart\",\"data\":[]}\n```";
    expect(findMarkdownArtifacts(md)).toHaveLength(0);
  });

  it("accepts the shorter `timbal` alias as well as `timbal-artifact`", () => {
    const md =
      "```timbal\n" +
      JSON.stringify({ type: "chart", data: [{ x: 1 }] }) +
      "\n```";
    const matches = findMarkdownArtifacts(md);
    expect(matches).toHaveLength(1);
    expect(matches[0].artifact.type).toBe("chart");
  });
});

describe("isArtifactFenceLanguage", () => {
  it("matches both canonical and alias", () => {
    expect(isArtifactFenceLanguage("timbal-artifact")).toBe(true);
    expect(isArtifactFenceLanguage("timbal")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isArtifactFenceLanguage("json")).toBe(false);
    expect(isArtifactFenceLanguage(undefined)).toBe(false);
    expect(isArtifactFenceLanguage(null)).toBe(false);
    expect(isArtifactFenceLanguage("")).toBe(false);
  });

  it("exposes the alias set publicly", () => {
    expect(ARTIFACT_FENCE_LANGUAGES.has("timbal-artifact")).toBe(true);
    expect(ARTIFACT_FENCE_LANGUAGES.has("timbal")).toBe(true);
  });
});

describe("splitMarkdownByArtifacts", () => {
  it("returns a single text segment when no fences", () => {
    expect(splitMarkdownByArtifacts("hello")).toEqual([
      { kind: "text", text: "hello" },
    ]);
  });

  it("alternates text and artifact segments", () => {
    const md =
      "before\n```timbal-artifact\n" +
      JSON.stringify({ type: "chart", data: [] }) +
      "\n```\nafter";
    const segments = splitMarkdownByArtifacts(md);
    expect(segments.map((s) => s.kind)).toEqual(["text", "artifact", "text"]);
    expect((segments[0] as { text: string }).text).toBe("before\n");
    expect((segments[2] as { text: string }).text).toBe("\nafter");
  });

  it("handles a leading artifact (no preceding text)", () => {
    const md =
      "```timbal-artifact\n" +
      JSON.stringify({ type: "chart", data: [] }) +
      "\n```\ntail";
    const segments = splitMarkdownByArtifacts(md);
    expect(segments.map((s) => s.kind)).toEqual(["artifact", "text"]);
  });
});
