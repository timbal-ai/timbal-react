import { describe, it, expect } from "bun:test";
import type { AttachmentAdapter } from "@assistant-ui/react";
import { resolveAttachmentAdapter } from "./resolve-attachments";
import { DEFAULT_UPLOAD_ACCEPT } from "./upload-adapter";

const customAdapter: AttachmentAdapter = {
  accept: "image/*",
  add: async ({ file }) => ({
    id: "x",
    type: "image",
    name: file.name,
    contentType: file.type,
    file,
    status: { type: "requires-action", reason: "composer-send" },
  }),
  send: async (a) => ({
    ...a,
    status: { type: "complete" },
    content: [{ type: "image", image: "https://custom/", filename: a.name }],
  }),
  remove: async () => {},
};

describe("resolveAttachmentAdapter", () => {
  it("returns the default adapter when attachments is omitted (ON by default)", () => {
    const adapter = resolveAttachmentAdapter(undefined, { baseUrl: "/api" });
    expect(adapter?.accept).toBe(DEFAULT_UPLOAD_ACCEPT);
  });

  it("returns the default adapter when attachments is true", () => {
    const adapter = resolveAttachmentAdapter(true, { baseUrl: "/api" });
    expect(adapter?.accept).toBe(DEFAULT_UPLOAD_ACCEPT);
  });

  it("honours config.uploadUrl and config.accept", () => {
    const adapter = resolveAttachmentAdapter(
      { uploadUrl: "/custom/upload", accept: "image/*" },
      { baseUrl: "/api" },
    );
    expect(adapter?.accept).toBe("image/*");
  });

  it("returns a custom adapter unchanged", () => {
    expect(resolveAttachmentAdapter(customAdapter, { baseUrl: "/api" })).toBe(
      customAdapter,
    );
  });

  it("returns undefined for null (disabled)", () => {
    expect(resolveAttachmentAdapter(null, { baseUrl: "/api" })).toBeUndefined();
  });

  it("enables the default adapter when legacy uploadUrl is set without attachments prop", () => {
    const adapter = resolveAttachmentAdapter(undefined, {
      baseUrl: "/api",
      uploadUrl: "/api/files/upload",
    });
    expect(adapter?.accept).toBe(DEFAULT_UPLOAD_ACCEPT);
  });
});
