import { describe, it, expect } from "bun:test";
import {
  runTraceToMessages,
  conversationRunsToMessages,
  normalizeContentToText,
} from "./trace-to-messages";
import type { RunDetail, RunPreview, TraceSpan } from "./conversations";
import type { ToolCallContentPart } from "./types";

function llm(
  start: number,
  input: unknown,
  output: unknown,
  extra: Partial<TraceSpan> = {},
): TraceSpan {
  return { path: "agent.llm", start_time: start, input, output, ...extra };
}

describe("normalizeContentToText", () => {
  it("handles strings, block arrays and objects", () => {
    expect(normalizeContentToText("  hi  ")).toBe("hi");
    expect(
      normalizeContentToText([
        { type: "text", text: "a" },
        { type: "text", text: "b" },
      ]),
    ).toBe("a\nb");
    expect(normalizeContentToText({ foo: 1 })).toBe('{"foo":1}');
  });
});

describe("runTraceToMessages — simple turn", () => {
  it("reconstructs a user + assistant pair and stamps runId", () => {
    const trace: TraceSpan[] = [
      llm(
        1,
        { messages: [{ role: "user", content: "What is 2+2?" }] },
        { role: "assistant", content: [{ type: "text", text: "4" }] },
      ),
    ];
    const msgs = runTraceToMessages(trace, { runId: "run-1" });
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({
      role: "user",
      content: [{ type: "text", text: "What is 2+2?" }],
    });
    expect(msgs[1]).toMatchObject({
      role: "assistant",
      content: [{ type: "text", text: "4" }],
      runId: "run-1",
    });
  });

  it("returns [] for an empty trace", () => {
    expect(runTraceToMessages([], { runId: "x" })).toEqual([]);
    expect(runTraceToMessages(null)).toEqual([]);
  });
});

describe("runTraceToMessages — tool loop", () => {
  it("merges tool_use across steps and attaches results", () => {
    const trace: TraceSpan[] = [
      // Step 1: assistant asks for a tool
      llm(
        1,
        { messages: [{ role: "user", content: "weather in NYC?" }] },
        {
          role: "assistant",
          content: [
            { type: "text", text: "Let me check." },
            { type: "tool_use", id: "t1", name: "get_weather", input: { city: "NYC" } },
          ],
        },
      ),
      // Step 2: replayed history includes the tool_result; final answer
      llm(
        2,
        {
          messages: [
            { role: "user", content: "weather in NYC?" },
            {
              role: "assistant",
              content: [
                { type: "tool_use", id: "t1", name: "get_weather", input: { city: "NYC" } },
              ],
            },
            {
              role: "tool",
              content: [
                { type: "tool_result", id: "t1", content: [{ type: "text", text: "72F sunny" }] },
              ],
            },
          ],
        },
        { role: "assistant", content: [{ type: "text", text: "It's 72F and sunny." }] },
      ),
    ];

    const msgs = runTraceToMessages(trace, { runId: "run-2" });
    expect(msgs[0]).toMatchObject({ role: "user" });

    const assistant = msgs[1];
    expect(assistant.role).toBe("assistant");
    const tool = assistant.content.find(
      (p): p is ToolCallContentPart => p.type === "tool-call",
    );
    expect(tool).toBeDefined();
    expect(tool!.toolName).toBe("get_weather");
    expect(tool!.status).toBe("complete");
    expect(tool!.resultText).toBe("72F sunny");

    const texts = assistant.content
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text);
    expect(texts).toContain("Let me check.");
    expect(texts).toContain("It's 72F and sunny.");
  });

  it("attaches results from standalone tool spans by name", () => {
    const trace: TraceSpan[] = [
      llm(
        1,
        { messages: [{ role: "user", content: "search" }] },
        {
          role: "assistant",
          content: [{ type: "tool_use", id: "a1", name: "search_db", input: {} }],
        },
      ),
      {
        path: "agent.search_db",
        metadata: { type: "tool" },
        start_time: 1.5,
        input: {},
        output: { content: [{ type: "text", text: "row found" }] },
      },
      llm(
        2,
        { messages: [{ role: "user", content: "search" }] },
        { role: "assistant", content: [{ type: "text", text: "done" }] },
      ),
    ];
    const msgs = runTraceToMessages(trace, { runId: "r" });
    const tool = msgs[1].content.find(
      (p): p is ToolCallContentPart => p.type === "tool-call",
    );
    expect(tool!.status).toBe("complete");
    expect(tool!.resultText).toBe("row found");
  });
});

describe("runTraceToMessages — attachments", () => {
  it("extracts file/image blocks from the user message", () => {
    const trace: TraceSpan[] = [
      llm(
        1,
        {
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "look at this" },
                { type: "image", image: "https://x/img.png", filename: "img.png" },
              ],
            },
          ],
        },
        { role: "assistant", content: [{ type: "text", text: "nice" }] },
      ),
    ];
    const msgs = runTraceToMessages(trace, { runId: "r" });
    expect(msgs[0].attachments).toHaveLength(1);
    expect(msgs[0].attachments![0]).toMatchObject({
      type: "image",
      dataUrl: "https://x/img.png",
      name: "img.png",
    });
  });
});

describe("conversationRunsToMessages", () => {
  it("stitches multiple turns in thread order", () => {
    const runs: RunPreview[] = [
      { id: "r1", created_at: "2024-01-01T00:00:00Z" },
      { id: "r2", created_at: "2024-01-01T00:01:00Z", parent_id: "r1" },
    ];
    const detail = new Map<string, RunDetail>([
      [
        "r1",
        {
          id: "r1",
          trace: [
            llm(
              1,
              { messages: [{ role: "user", content: "hi" }] },
              { role: "assistant", content: [{ type: "text", text: "hello" }] },
            ),
          ],
        },
      ],
      [
        "r2",
        {
          id: "r2",
          trace: [
            llm(
              1,
              {
                messages: [
                  { role: "user", content: "hi" },
                  { role: "assistant", content: [{ type: "text", text: "hello" }] },
                  { role: "user", content: "bye" },
                ],
              },
              { role: "assistant", content: [{ type: "text", text: "goodbye" }] },
            ),
          ],
        },
      ],
    ]);

    const msgs = conversationRunsToMessages(runs, detail);
    expect(msgs.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect((msgs[0].content[0] as { text: string }).text).toBe("hi");
    expect((msgs[2].content[0] as { text: string }).text).toBe("bye");
    // Last assistant carries the latest runId for thread continuation.
    expect(msgs[3].runId).toBe("r2");
  });
});
