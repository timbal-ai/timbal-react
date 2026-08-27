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

  it("renders whole-block `text` items with no deltas at all", () => {
    const state = run([
      { type: "DELTA", item: { type: "text", id: "b0", text: "Whole block." } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Whole block." }]);
  });

  it("concatenates a whole-block `text` followed by its `text_delta`s", () => {
    // The head-loss bug: providers open a block with `text` and continue with
    // `text_delta`. Dropping the opener rendered only the tail — and mid-number
    // at that ("410,400" out of "$1,410,400").
    const state = run([
      {
        type: "DELTA",
        path: "sales",
        item: { type: "text", id: "b0", text: "Total open ARR: $1," },
      },
      {
        type: "DELTA",
        path: "sales",
        item: { type: "text_delta", id: "b0", text_delta: "410,400" },
      },
      {
        type: "OUTPUT",
        path: "sales",
        output: { content: [{ type: "text", text: "Total open ARR: $1,410,400" }] },
      },
    ]);
    expect(state.parts).toEqual([
      { type: "text", text: "Total open ARR: $1,410,400" },
    ]);
  });

  it("lets a disagreeing OUTPUT overwrite the accumulated deltas", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "410,400" } },
      {
        type: "OUTPUT",
        output: { content: [{ type: "text", text: "Total open ARR: $1,410,400" }] },
      },
    ]);
    expect(state.parts).toEqual([
      { type: "text", text: "Total open ARR: $1,410,400" },
    ]);
  });

  it("repairs the message when the stream carried an unknown item type", () => {
    // The invariant that keeps this whole class of bug non-fatal: whatever the
    // delta stream does or fails to do, OUTPUT settles the truth.
    const state = run([
      { type: "DELTA", item: { type: "text_v2", text_v2: "dropped" } },
      { type: "OUTPUT", output: { content: [{ type: "text", text: "Complete." }] } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Complete." }]);
  });

  it("merges consecutive OUTPUT text blocks into one part", () => {
    // Matches the hydration path (`appendText`), so live and reloaded renders
    // produce the same part shape.
    const state = run([
      {
        type: "OUTPUT",
        output: {
          content: [
            { type: "text", text: "one " },
            { type: "text", text: "two" },
          ],
        },
      },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "one two" }]);
  });
});

describe("reducer — timbal 2.x delta protocol", () => {
  // The `DELTA` item union is unchanged across every `timbal` 2.x release
  // (v2.0.0 → v2.7.3): the same eight discriminators with the same payload
  // fields. Only the Python declaration style changed (pydantic → slots in
  // 2.4.0), which is invisible on the wire. These tests pin that contract.
  const ALL_ITEMS: Record<string, unknown>[] = [
    { type: "tool_use", id: "t0", name: "q", input: "" },
    { type: "tool_use_delta", id: "t0", input_delta: "{}" },
    { type: "text", id: "b0", text: "a" },
    { type: "text_delta", id: "b0", text_delta: "b" },
    { type: "thinking", id: "k0", thinking: "c" },
    { type: "thinking_delta", id: "k0", thinking_delta: "d" },
    { type: "custom", id: "c0", data: { any: "thing" } },
    { type: "content_block_stop", id: "b0" },
  ];

  function captureWarnings(events: Record<string, unknown>[]): unknown[] {
    const warn = console.warn;
    const seen: unknown[] = [];
    console.warn = (...args: unknown[]) => seen.push(args);
    try {
      run(events);
    } finally {
      console.warn = warn;
    }
    return seen;
  }

  it("never warns for any item type in the 2.x union", () => {
    const seen = captureWarnings(
      ALL_ITEMS.map((item) => ({ type: "DELTA", item })),
    );
    expect(seen).toEqual([]);
  });

  it("stays silent when a known item type arrives with a missing payload", () => {
    // A producer-side bug, not an unrecognized item — reporting it as an
    // unhandled *type* would send readers hunting for a protocol change.
    const seen = captureWarnings(
      ALL_ITEMS.map((item) => ({ type: "DELTA", item: { type: item.type, id: "x" } })),
    );
    expect(seen).toEqual([]);
  });

  it("warns once for a genuinely unrecognized item type", () => {
    const seen = captureWarnings([
      { type: "DELTA", item: { type: "audio_delta", id: "a0", audio_delta: "…" } },
      { type: "DELTA", item: { type: "audio_delta", id: "a0", audio_delta: "…" } },
    ]);
    expect(seen).toHaveLength(1);
    expect(String(seen[0])).toContain("audio_delta");
  });

  it("ignores `content_block_stop` without splitting the text part", () => {
    // A block boundary must not start a second text part: consecutive text
    // blocks merge, matching hydration's `appendText`.
    const state = run([
      { type: "DELTA", item: { type: "text", id: "b0", text: "first" } },
      { type: "DELTA", item: { type: "content_block_stop", id: "b0" } },
      { type: "DELTA", item: { type: "text", id: "b1", text: " second" } },
      { type: "DELTA", item: { type: "content_block_stop", id: "b1" } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "first second" }]);
  });

  it("ignores `custom` items without disturbing surrounding text", () => {
    const state = run([
      { type: "DELTA", item: { type: "text", id: "b0", text: "before" } },
      { type: "DELTA", item: { type: "custom", id: "c0", data: { any: "thing" } } },
      { type: "DELTA", item: { type: "text_delta", id: "b0", text_delta: " after" } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "before after" }]);
  });

  it("appends rather than replaces, since `Text` opens a block mid-content", () => {
    // Every 2.x collector emits `Text` only behind a `not _text_block_started`
    // guard, carrying the *first* chunk — never a closing consolidation of the
    // whole block. So append is correct and cannot double the content.
    const state = run([
      { type: "DELTA", item: { type: "text", id: "text_0", text: "Hello" } },
      { type: "DELTA", item: { type: "text_delta", id: "text_0", text_delta: " there" } },
      { type: "DELTA", item: { type: "content_block_stop", id: "text_0" } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Hello there" }]);
  });

  it("handles an Anthropic-style empty text opener", () => {
    // Anthropic's `content_block_start` carries `text: ""`, which is why the
    // head-loss bug was invisible on Claude and obvious on OpenAI-compatible
    // providers (whose opener carries the first real chunk).
    const state = run([
      { type: "DELTA", item: { type: "text", id: "b-0", text: "" } },
      { type: "DELTA", item: { type: "text_delta", id: "b-0", text_delta: "Hi" } },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "Hi" }]);
  });

  it("accumulates a tool_use whose input starts empty (2.x default)", () => {
    // `ToolUse.input` defaults to `""` in every 2.x release; Anthropic and the
    // OpenAI Responses API both open the call that way and stream the args.
    const state = run([
      { type: "DELTA", item: { type: "tool_use", id: "t1", name: "q", input: "" } },
      { type: "DELTA", item: { type: "tool_use_delta", id: "t1", input_delta: '{"a":1}' } },
    ]);
    const tool = state.parts[0] as ToolCallContentPart;
    expect(tool.argsText).toBe('{"a":1}');
  });
});

describe("reducer — OUTPUT reconciliation across a tool loop", () => {
  it("settles the trailing text part without clobbering the leading one", () => {
    // The top-level OUTPUT describes the tail of the turn, so its lone text
    // block is the *last* text part. Aligning from the front would overwrite
    // "Let me check" with "Done.".
    const state = run([
      { type: "DELTA", item: { type: "text", text: "Let me check" } },
      { type: "DELTA", item: { type: "tool_use", id: "t1", name: "q", input: {} } },
      { type: "DELTA", item: { type: "text_delta", text_delta: "Done" } },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [
            { type: "tool_result", id: "t1", content: "42" },
            { type: "text", text: "Done." },
          ],
        },
      },
    ]);
    expect(state.parts.map((p) => p.type)).toEqual(["text", "tool-call", "text"]);
    expect((state.parts[0] as { text: string }).text).toBe("Let me check");
    expect((state.parts[2] as { text: string }).text).toBe("Done.");
  });

  it("does not duplicate leading text when OUTPUT ends on a tool_use block", () => {
    const state = run([
      { type: "DELTA", item: { type: "text", text: "Calling out" } },
      { type: "DELTA", item: { type: "tool_use", id: "t1", name: "q", input: {} } },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [
            { type: "text", text: "Calling out." },
            { type: "tool_use", id: "t1", name: "q", input: {} },
          ],
        },
      },
    ]);
    expect(state.parts.map((p) => p.type)).toEqual(["text", "tool-call"]);
    expect((state.parts[0] as { text: string }).text).toBe("Calling out.");
  });

  it("aligns two OUTPUT text runs onto two streamed text parts", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "A" } },
      { type: "DELTA", item: { type: "tool_use", id: "t1", name: "q", input: {} } },
      { type: "DELTA", item: { type: "text_delta", text_delta: "B" } },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [
            { type: "text", text: "A!" },
            { type: "tool_use", id: "t1", name: "q", input: {} },
            { type: "text", text: "B!" },
          ],
        },
      },
    ]);
    expect((state.parts[0] as { text: string }).text).toBe("A!");
    expect((state.parts[2] as { text: string }).text).toBe("B!");
  });

  it("appends a trailing run that never streamed instead of rotating the parts", () => {
    // OUTPUT carries two text runs but only the leading one streamed (the
    // trailing text arrived as an item type we dropped, or the provider never
    // streamed it). End-aligning would map the *last* run onto the *first*
    // existing part and append the first run after everything else, swapping
    // the message into "B … A". Surplus runs are content we never saw, so the
    // streamed parts stay put and the extra is appended in block order.
    const state = run([
      { type: "DELTA", item: { type: "text", text: "Calling out" } },
      { type: "DELTA", item: { type: "tool_use", id: "t1", name: "q", input: {} } },
      {
        type: "OUTPUT",
        path: "agent",
        output: {
          content: [
            { type: "text", text: "Calling out." },
            { type: "tool_use", id: "t1", name: "q", input: {} },
            { type: "text", text: "All done." },
          ],
        },
      },
    ]);
    expect(state.parts.map((p) => p.type)).toEqual(["text", "tool-call", "text"]);
    expect((state.parts[0] as { text: string }).text).toBe("Calling out.");
    expect((state.parts[2] as { text: string }).text).toBe("All done.");
  });

  it("keeps thinking ahead of text when only the text streamed", () => {
    const state = run([
      { type: "DELTA", item: { type: "text_delta", text_delta: "Answer" } },
      {
        type: "OUTPUT",
        output: {
          content: [
            { type: "thinking", thinking: "reasoned" },
            { type: "text", text: "Answer." },
          ],
        },
      },
    ]);
    expect(state.parts).toEqual([
      { type: "text", text: "Answer." },
      { type: "thinking", text: "reasoned" },
    ]);
  });

  it("leaves text alone on nested OUTPUTs", () => {
    const state = run([
      { type: "DELTA", item: { type: "text", text: "streamed" } },
      {
        type: "OUTPUT",
        path: "agent.llm",
        output: { content: [{ type: "text", text: "nested echo" }] },
      },
    ]);
    expect(state.parts).toEqual([{ type: "text", text: "streamed" }]);
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

  it("concatenates a whole-block `thinking` followed by its deltas", () => {
    const state = run([
      { type: "DELTA", item: { type: "thinking", id: "k0", thinking: "step 1 " } },
      { type: "DELTA", item: { type: "thinking_delta", thinking_delta: "step 2" } },
    ]);
    expect(state.parts).toEqual([{ type: "thinking", text: "step 1 step 2" }]);
  });

  it("lets OUTPUT thinking overwrite a partial stream", () => {
    const state = run([
      { type: "DELTA", item: { type: "thinking_delta", thinking_delta: "step 2" } },
      {
        type: "OUTPUT",
        output: {
          content: [
            { type: "thinking", thinking: "step 1 step 2" },
            { type: "text", text: "Answer." },
          ],
        },
      },
    ]);
    expect(state.parts).toEqual([
      { type: "thinking", text: "step 1 step 2" },
      { type: "text", text: "Answer." },
    ]);
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
