import { describe, it, expect } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTimbalStream } from "./provider";
import type { ChatAttachment } from "./types";

function emptyStreamResponse(): Response {
  const body = new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

describe("useTimbalStream attachments", () => {
  it("posts a plain string prompt for text-only messages", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchFn = async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(init!.body as string) as Record<string, unknown>);
      return emptyStreamResponse();
    };

    const { result } = renderHook(() =>
      useTimbalStream({ workforceId: "wf-1", baseUrl: "/api", fetch: fetchFn }),
    );

    await act(async () => {
      await result.current.send("hello");
    });

    await waitFor(() => expect(result.current.isRunning).toBe(false));

    expect(bodies[0]?.prompt).toBe("hello");
  });

  it("posts multimodal prompt with text before file parts", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchFn = async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(init!.body as string) as Record<string, unknown>);
      return emptyStreamResponse();
    };

    const attachment: ChatAttachment = {
      id: "att-1",
      type: "image",
      name: "photo.jpg",
      contentType: "image/jpeg",
      dataUrl: "https://cdn.example.com/photo.jpg",
    };

    const { result } = renderHook(() =>
      useTimbalStream({ workforceId: "wf-1", baseUrl: "/api", fetch: fetchFn }),
    );

    await act(async () => {
      await result.current.send("describe this", { attachments: [attachment] });
    });

    await waitFor(() => expect(result.current.isRunning).toBe(false));

    expect(bodies[0]?.prompt).toEqual([
      { type: "text", text: "describe this" },
      { type: "file", file: "https://cdn.example.com/photo.jpg" },
    ]);
  });

  it("reload replays stored attachments (not text-only)", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchFn = async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(init!.body as string) as Record<string, unknown>);
      return emptyStreamResponse();
    };

    const attachment: ChatAttachment = {
      id: "att-1",
      type: "file",
      name: "doc.pdf",
      contentType: "application/pdf",
      dataUrl: "https://cdn.example.com/doc.pdf",
    };

    const { result } = renderHook(() =>
      useTimbalStream({ workforceId: "wf-1", baseUrl: "/api", fetch: fetchFn }),
    );

    await act(async () => {
      await result.current.send("", { attachments: [attachment] });
    });

    await waitFor(() => expect(result.current.isRunning).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => expect(bodies.length).toBe(2));

    expect(bodies[1]?.prompt).toEqual([
      { type: "file", file: "https://cdn.example.com/doc.pdf" },
    ]);
  });
});
