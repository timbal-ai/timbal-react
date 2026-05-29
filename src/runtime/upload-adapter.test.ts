import { describe, it, expect } from "bun:test";
import { createUploadAttachmentAdapter } from "./upload-adapter";

function makeFile(name: string, type: string, body = "hello"): File {
  return new File([body], name, { type });
}

describe("createUploadAttachmentAdapter", () => {
  it("returns a PendingAttachment that requires composer-send", async () => {
    const adapter = createUploadAttachmentAdapter({
      uploadUrl: "/api/files/upload",
      fetch: async () => new Response(JSON.stringify({ url: "x" })),
    });
    const pending = await adapter.add({
      file: makeFile("photo.png", "image/png"),
    });
    if (Symbol.asyncIterator in (pending as object)) {
      throw new Error("expected non-iterable PendingAttachment");
    }
    expect(pending.type).toBe("image");
    expect(pending.name).toBe("photo.png");
    expect(pending.contentType).toBe("image/png");
    expect(pending.status).toEqual({
      type: "requires-action",
      reason: "composer-send",
    });
  });

  it("uploads via FormData and returns a CompleteAttachment with an image content block when MIME is image/*", async () => {
    let capturedInit: RequestInit | undefined;
    let capturedUrl: string | undefined;
    const adapter = createUploadAttachmentAdapter({
      uploadUrl: "https://example.com/api/files/upload",
      fetch: async (url, init) => {
        capturedUrl = url;
        capturedInit = init;
        return new Response(JSON.stringify({ url: "https://cdn/foo.png" }), {
          headers: { "content-type": "application/json" },
        });
      },
    });
    const pending = (await adapter.add({
      file: makeFile("a.png", "image/png"),
    })) as Awaited<ReturnType<typeof adapter.send>> extends never
      ? never
      : Parameters<typeof adapter.send>[0];

    const complete = await adapter.send(pending);
    expect(capturedUrl).toBe("https://example.com/api/files/upload");
    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBeInstanceOf(FormData);
    const fd = capturedInit?.body as FormData;
    const sent = fd.get("file");
    expect(sent).toBeTruthy();
    expect(complete.status).toEqual({ type: "complete" });
    expect(complete.content).toEqual([
      { type: "image", image: "https://cdn/foo.png", filename: "a.png" },
    ]);
  });

  it("returns a file content block (with mimeType) for non-image uploads", async () => {
    const adapter = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response(JSON.stringify({ url: "https://cdn/doc.pdf" }), {
          headers: { "content-type": "application/json" },
        }),
    });
    const pending = await adapter.add({
      file: makeFile("doc.pdf", "application/pdf"),
    });
    if ("next" in (pending as object)) throw new Error("unexpected generator");
    const complete = await adapter.send(pending as never);
    expect(complete.type).toBe("file");
    expect(complete.content).toEqual([
      {
        type: "file",
        data: "https://cdn/doc.pdf",
        mimeType: "application/pdf",
        filename: "doc.pdf",
      },
    ]);
  });

  it("accepts a bare URL string response body", async () => {
    const adapter = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response("https://cdn/x.png\n", {
          headers: { "content-type": "text/plain" },
        }),
    });
    const pending = await adapter.add({
      file: makeFile("x.png", "image/png"),
    });
    const complete = await adapter.send(pending as never);
    expect(complete.content).toEqual([
      { type: "image", image: "https://cdn/x.png", filename: "x.png" },
    ]);
  });

  it("falls back to `signed_url` and `id` fields when `url` is missing", async () => {
    const adapter1 = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response(JSON.stringify({ signed_url: "https://cdn/s" }), {
          headers: { "content-type": "application/json" },
        }),
    });
    const c1 = await adapter1.send(
      (await adapter1.add({ file: makeFile("a", "image/png") })) as never,
    );
    expect((c1.content[0] as { image: string }).image).toBe("https://cdn/s");

    const adapter2 = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response(JSON.stringify({ id: "file_123" }), {
          headers: { "content-type": "application/json" },
        }),
    });
    const c2 = await adapter2.send(
      (await adapter2.add({ file: makeFile("a", "image/png") })) as never,
    );
    expect((c2.content[0] as { image: string }).image).toBe("file_123");
  });

  it("coerces a numeric `id` from JSON responses (Timbal SDK File shape)", async () => {
    const adapter = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response(JSON.stringify({ id: 42 }), {
          headers: { "content-type": "application/json" },
        }),
    });
    const complete = await adapter.send(
      (await adapter.add({ file: makeFile("a", "image/png") })) as never,
    );
    expect((complete.content[0] as { image: string }).image).toBe("42");
  });

  it("derives uploadUrl from baseUrl when uploadUrl is omitted", async () => {
    let capturedUrl = "";
    const adapter = createUploadAttachmentAdapter({
      baseUrl: "/api",
      fetch: async (url) => {
        capturedUrl = url;
        return new Response(JSON.stringify({ url: "https://cdn/x" }), {
          headers: { "content-type": "application/json" },
        });
      },
    });
    const pending = await adapter.add({ file: makeFile("a.png", "image/png") });
    await adapter.send(pending as never);
    expect(capturedUrl).toBe("/api/files/upload");
  });

  it("throws a helpful error when the upload request fails", async () => {
    const adapter = createUploadAttachmentAdapter({
      fetch: async () =>
        new Response("boom", {
          status: 500,
          statusText: "Internal Server Error",
        }),
    });
    const pending = await adapter.add({
      file: makeFile("a.png", "image/png"),
    });
    await expect(adapter.send(pending as never)).rejects.toThrow(
      /Attachment upload failed \(500\): boom/,
    );
  });
});
