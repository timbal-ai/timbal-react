import { describe, it, expect } from "bun:test";
import { createReducerState, reduceSseEvent } from "./reducer";
import type { ToolCallContentPart } from "./types";

function run(events: Record<string, unknown>[]) {
  const state = createReducerState();
  for (const ev of events) reduceSseEvent(state, ev);
  return state;
}

describe("reducer — text streaming", () => {
  it("appends text deltas into a single text part", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "Hello" } },
      { type: "DELTA", item: { type: "text_delta", text_delta: ", world" } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Hello, world" }]);
  });

  it("ignores OUTPUT text when the same content already streamed", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "Hi" } },
      { type: "OUTPUT", output: { content: [{ type: "text", text: "Hi" }] } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Hi" }]);
  });

  it("falls back to OUTPUT text when no text streamed", () => {
    const state = run([
      { type: "OUTPUT", output: { content: [{ type: "text", text: "Final" }] } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Final" }]);
  });

  it("falls back to a string OUTPUT when nothing streamed", () => {
    const state = run([{ type: "OUTPUT", output: "Plain string" }]);
    expect(state.parts).toEqual([{ type: "text", text: "Plain string" }]);
  });
});

describe("reducer — thinking blocks", () => {
  it("accumulates thinking deltas", () => {
    const state = run([
      { type: "DELTA", item: { type: "thinking_delta", thinking_delta: "step 1 " } },
      { type: "DELTA", item: { type: "thinking_delta", thinking_delta: "step 2" } },
    ]);
    expect(state.parts).toEqual([{ type: "thinking", text: "step 1 step 2" }]);
  });
});

describe("reducer — tool calls", () => {
  it("opens a tool-call on tool_use and accumulates argsText via tool_use_delta", () => {
    const state = run([
      {
        type: "DELTA",
        item: { type: "tool_use", id: "t1", name: "get_datetime", input: {} },
      },
      {
        type: "DELTA",
        item: { type: "tool_use_delta", id: "t1", input_delta: '{"tz":"' },
      },
      {
        type: "DELTA",
        item: { type: "tool_use_delta", id: "t1", input_delta: 'UTC"}' },
      },
    ]);
    expect(state.parts).toHaveLength(1);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.type).toBe("tool-call");
    expect(tool.toolCallId).toBe("t1");
    expect(tool.toolName).toBe("get_datetime");
    expect(tool.argsText).toBe('{}{"tz":"UTC"}');
    expect(tool.status).toBe("running");
  });

  it("attaches a tool_result to the matching open call (string content)", () => {
    const state = run([
      {
        type: "DELTA",
        item: { type: "tool_use", id: "t1", name: "echo", input: { msg: "hi" } },
      },
      {
        type: "OUTPUT",
        output: {
          content: [{ type: "tool_result", id: "t1", content: "hi" }],
        },
      },
    ]);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.status).toBe("complete");
    expect(tool.result).toBe("hi");
    expect(tool.resultText).toBe("hi");
  });

  it("preserves array tool_result content and extracts resultText", () => {
    const state = run([
      {
        type: "DELTA",
        item: { type: "tool_use", id: "t1", name: "lookup", input: {} },
      },
      {
        type: "OUTPUT",
        output: {
          content: [
            {
              type: "tool_result",
              id: "t1",
              content: [
                { type: "text", text: "Line A" },
                { type: "text", text: "Line B" },
              ],
            },
          ],
        },
      },
    ]);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.status).toBe("complete");
    expect(Array.isArray(tool.result)).toBe(true);
    expect(tool.resultText).toBe("Line A\nLine B");
  });

  it("preserves structured object tool_result content for artifact rendering", () => {
    const state = run([
      {
        type: "DELTA",
        item: { type: "tool_use", id: "t1", name: "make_chart", input: {} },
      },
      {
        type: "OUTPUT",
        output: {
          content: [
            {
              type: "tool_result",
              id: "t1",
              content: { type: "chart", chartType: "bar", data: [1, 2, 3] },
            },
          ],
        },
      },
    ]);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.result).toEqual({ type: "chart", chartType: "bar", data: [1, 2, 3] });
    expect(tool.resultText).toBeUndefined();
  });

  it("records a tool_result whose tool_use was missed", () => {
    const state = run([
      {
        type: "OUTPUT",
        output: {
          content: [
            {
              type: "tool_result",
              id: "t99",
              name: "ghost_tool",
              content: "after the fact",
            },
          ],
        },
      },
    ]);
    expect(state.parts).toHaveLength(1);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.toolCallId).toBe("t99");
    expect(tool.status).toBe("complete");
    expect(tool.resultText).toBe("after the fact");
  });

  it("ignores non-text OUTPUT events that don't include tool blocks", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "kept" } },
      { type: "OUTPUT", output: { content: [] } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "kept" }]);
  });
});

describe("reducer — sub-step OUTPUT echoes", () => {
  it("ignores OUTPUTs whose path is nested (contains '.')", () => {
    // Sub-step OUTPUT (e.g. agent.make_chart) re-issues a different tool
    // id for the same call. Without the path filter, this would create a
    // second orphan tool-call part. With the filter, only the top-level
    // OUTPUT settles state.
    const state = run([
      {
        type: "DELTA",
        item: { type: "tool_use", id: "t-real", name: "make_chart", input: {} },
      },
      {
        type: "OUTPUT",
        path: "agent.make_chart",
        output: {
          content: [
            { type: "tool_use", id: "t-echo", name: "make_chart", input: {} },
            {
              type: "tool_result",
              id: "t-echo",
              content: [{ type: "text", text: '{"type":"chart"}' }],
            },
          ],
        },
      },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [
            {
              type: "tool_result",
              id: "t-real",
              content: { type: "chart", chartType: "bar", data: [] },
            },
          ],
        },
      },
    ]);

    expect(state.parts).toHaveLength(1);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.toolCallId).toBe("t-real");
    expect(tool.status).toBe("complete");
    expect(tool.result).toEqual({ type: "chart", chartType: "bar", data: [] });
  });

  it("attaches a raw artifact dict from nested tool OUTPUT to the open call", () => {
    const artifact = { type: "ui", root: { kind: "text", value: "hi" } };
    const state = run([
      {
        type: "DELTA",
        item: {
          type: "tool_use",
          id: "t-ui",
          name: "make_ui_demo",
          input: { title: "Demo" },
        },
      },
      {
        type: "OUTPUT",
        path: "agent.make_ui_demo",
        output: artifact,
      },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [{ type: "text", text: "Done." }],
        },
      },
    ]);

    expect(state.parts).toHaveLength(2);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.toolName).toBe("make_ui_demo");
    expect(tool.result).toEqual(artifact);
    expect(tool.status).toBe("complete");
  });

  it("processes OUTPUTs with no path or empty path as top-level", () => {
    const state = run([
      { type: "OUTPUT", output: { content: [{ type: "text", text: "no-path" }] } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "no-path" }]);

    const state2 = run([
      {
        type: "OUTPUT",
        path: "",
        output: { content: [{ type: "text", text: "empty-path" }] },
      },
    ]);
    expect(state2.parts).toEqual([{ type: "text", text: "empty-path" }]);
  });
});

describe("reducer — error surfacing", () => {
  it("surfaces top-level OUTPUTs with status.code === 'error' as a text part", () => {
    const state = run([
      {
        type: "OUTPUT",
        path: "agent",
        status: { code: "error", message: "LLM context window exceeded" },
        output: null,
      },
    ]);
    expect(state.parts).toHaveLength(1);
    const part = state.parts[0] as { type: "text"; text: string };
    expect(part.type).toBe("text");
    expect(part.text).toContain("Error");
    expect(part.text).toContain("context window exceeded");
  });

  it("surfaces a string `error` field as a text part", () => {
    const state = run([
      { type: "OUTPUT", error: "boom", output: null },
    ]);
    expect((state.parts[0] as { text: string }).text).toContain("boom");
  });

  it("falls back to event.error.{type,message} when status.message is null", () => {
    // Real-world shape from Timbal when the file persistence endpoint
    // returns a malformed UploadFileResponse: status carries `code:"error"`
    // with a null message, and the actionable info is in `event.error`.
    const state = run([
      {
        type: "OUTPUT",
        path: "agent",
        status: { code: "error", reason: null, message: null },
        error: {
          type: "RuntimeError",
          message: "1 validation error for UploadFileResponse",
        },
        output: null,
      },
    ]);
    const text = (state.parts[0] as { text: string }).text;
    expect(text).toContain("RuntimeError");
    expect(text).toContain("UploadFileResponse");
  });

  it("strips inline Python tracebacks from error.message", () => {
    const state = run([
      {
        type: "OUTPUT",
        path: "agent",
        status: { code: "error", message: null },
        error: {
          type: "RuntimeError",
          message:
            'short headline\nTraceback (most recent call last):\n  File "...", line 1\n    boom',
        },
      },
    ]);
    const text = (state.parts[0] as { text: string }).text;
    expect(text).toContain("short headline");
    expect(text).not.toContain("Traceback");
  });

  it("ignores errors on nested OUTPUTs (sub-step echoes)", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "hi" } },
      {
        type: "OUTPUT",
        path: "agent.llm",
        status: { code: "error", message: "should not surface" },
      },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "hi" }]);
  });
});

describe("reducer — interleaving", () => {
  it("preserves order: text → tool → text → tool", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "before" } },
      {
        type: "DELTA",
        item: { type: "tool_use", id: "a", name: "x", input: {} },
      },
      { type: "DELTA", item: { type: "text_delta", text_delta: "between" } },
      {
        type: "DELTA",
        item: { type: "tool_use", id: "b", name: "y", input: {} },
      },
      { type: "DELTA", item: { type: "text_delta", text_delta: "after" } },
    ]);
    expect(state.parts.map((p) => p.type)).toEqual([
      "text",
      "tool-call",
      "text",
      "tool-call",
      "text",
    ]);
    expect((state.parts[0] as { text: string }).text).toBe("before");
    expect((state.parts[2] as { text: string }).text).toBe("between");
    expect((state.parts[4] as { text: string }).text).toBe("after");
  });
});
