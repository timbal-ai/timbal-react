import { describe, it, expect } from "bun:test";
import { buildPromptBody, extractAttachment } from "./attachments";
import type { ChatAttachment } from "./types";

const imageAttachment: ChatAttachment = {
  id: "att-1",
  type: "image",
  name: "photo.jpg",
  contentType: "image/jpeg",
  dataUrl: "data:image/jpeg;base64,AAA",
};

describe("buildPromptBody", () => {
  it("sends a bare string when no attachments are present", () => {
    const body = buildPromptBody({
      input: "hello",
      parentId: null,
    });
    expect(body).toEqual({ prompt: "hello", context: { parent_id: null } });
  });

  it("propagates the parent_id into context", () => {
    const body = buildPromptBody({
      input: "hello",
      parentId: "run-7",
    });
    expect(body).toEqual({ prompt: "hello", context: { parent_id: "run-7" } });
  });

  it("serializes attachments as {type:'file', file:'data:...'} dicts so Timbal builds FileContent (not TextContent)", () => {
    // Regression: previously we sent the data URL as a bare string, which
    // Timbal's `content_factory` coerced to `TextContent`, leading the model
    // to literally see "data:image/png;base64,..." as plain text instead of
    // an actual image. Sending a dict routes through `FileContent` →
    // `input_image` (OpenAI) / `image` (Anthropic).
    const body = buildPromptBody({
      input: "describe this",
      attachments: [imageAttachment],
      parentId: null,
    });
    expect(body).toEqual({
      prompt: [
        { type: "text", text: "describe this" },
        { type: "file", file: "data:image/jpeg;base64,AAA" },
      ],
      context: { parent_id: null },
    });
  });

  it("supports attachment-only messages (no input text)", () => {
    const body = buildPromptBody({
      input: "",
      attachments: [imageAttachment],
      parentId: null,
    });
    expect(body).toEqual({
      prompt: [{ type: "file", file: "data:image/jpeg;base64,AAA" }],
      context: { parent_id: null },
    });
  });

  it("preserves the order: text first, then attachments", () => {
    const second: ChatAttachment = {
      ...imageAttachment,
      id: "att-2",
      dataUrl: "data:image/png;base64,BBB",
      contentType: "image/png",
    };
    const body = buildPromptBody({
      input: "look",
      attachments: [imageAttachment, second],
      parentId: null,
    });
    expect((body.prompt as Array<unknown>).length).toBe(3);
    expect((body.prompt as Array<unknown>)[0]).toEqual({
      type: "text",
      text: "look",
    });
    expect((body.prompt as Array<unknown>)[1]).toEqual({
      type: "file",
      file: "data:image/jpeg;base64,AAA",
    });
    expect((body.prompt as Array<unknown>)[2]).toEqual({
      type: "file",
      file: "data:image/png;base64,BBB",
    });
  });

  it("forwards a remote upload URL verbatim in the `file` field", () => {
    const uploaded: ChatAttachment = {
      id: "att-3",
      type: "file",
      name: "report.pdf",
      contentType: "application/pdf",
      dataUrl: "https://cdn.example.com/files/report.pdf",
    };
    const body = buildPromptBody({
      input: "summarise this",
      attachments: [uploaded],
      parentId: null,
    });
    expect(body).toEqual({
      prompt: [
        { type: "text", text: "summarise this" },
        { type: "file", file: "https://cdn.example.com/files/report.pdf" },
      ],
      context: { parent_id: null },
    });
  });
});

describe("extractAttachment", () => {
  it("prefers an HTTP URL inside content[] over re-reading the raw file (so upload adapters survive the round-trip)", async () => {
    const file = new File(["x"], "report.pdf", { type: "application/pdf" });
    const attachment = {
      id: "att-1",
      type: "file",
      name: "report.pdf",
      contentType: "application/pdf",
      file,
      status: { type: "complete" },
      content: [
        {
          type: "file",
          data: "https://cdn.example.com/files/report.pdf",
          mimeType: "application/pdf",
          filename: "report.pdf",
        },
      ],
    };
    const result = await extractAttachment(attachment as never);
    expect(result).not.toBeNull();
    expect(result?.dataUrl).toBe("https://cdn.example.com/files/report.pdf");
    expect(result?.type).toBe("file");
    expect(result?.contentType).toBe("application/pdf");
  });

  it("reads image content[] URLs as well", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const attachment = {
      id: "att-2",
      type: "image",
      name: "a.png",
      contentType: "image/png",
      file,
      status: { type: "complete" },
      content: [
        { type: "image", image: "https://cdn/a.png", filename: "a.png" },
      ],
    };
    const result = await extractAttachment(attachment as never);
    expect(result?.dataUrl).toBe("https://cdn/a.png");
    expect(result?.type).toBe("image");
  });

  it("falls back to reading the raw file when content[] is missing", async () => {
    const file = new File(["hello"], "a.txt", { type: "text/plain" });
    const attachment = {
      id: "att-3",
      type: "file",
      name: "a.txt",
      file,
      status: { type: "complete" },
    };
    const result = await extractAttachment(attachment as never);
    expect(result?.dataUrl?.startsWith("data:text/plain")).toBe(true);
    expect(result?.contentType).toBe("text/plain");
  });
});
