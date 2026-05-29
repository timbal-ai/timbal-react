import type {
  AttachmentAdapter,
  CompleteAttachment,
  PendingAttachment,
} from "@assistant-ui/react";
import { authFetch } from "../auth/tokens";

export type UploadFetchFn = (
  url: string,
  options?: RequestInit,
) => Promise<Response>;

export interface CreateDefaultAttachmentAdapterOptions {
  /**
   * API base path used to derive the upload URL when {@link uploadUrl} is
   * omitted. Trailing slashes are stripped. Defaults to `""` (relative
   * `/files/upload`).
   */
  baseUrl?: string;
  /**
   * Absolute or relative URL the adapter `POST`s the multipart upload to.
   * Defaults to `${baseUrl}/files/upload`.
   */
  uploadUrl?: string;
  /**
   * Custom fetch used for the upload. Defaults to {@link authFetch}. Do not
   * set `Content-Type` on multipart uploads — the boundary must be automatic.
   */
  fetch?: UploadFetchFn;
  /**
   * MIME / extension `accept` string for the file picker.
   */
  accept?: string;
}

/** @deprecated Use {@link CreateDefaultAttachmentAdapterOptions}. */
export type CreateUploadAttachmentAdapterOptions =
  CreateDefaultAttachmentAdapterOptions;

export const DEFAULT_UPLOAD_ACCEPT =
  "image/*,application/pdf,text/*,.md,.json,.csv,.tsv,.xlsx,.docx";

/**
 * Build an `AttachmentAdapter` that uploads each file to a Timbal-style
 * `/files/upload` endpoint and returns a `CompleteAttachment` whose
 * `content[]` references the returned URL.
 */
export function createDefaultAttachmentAdapter({
  baseUrl = "",
  uploadUrl,
  fetch: fetchFn = authFetch,
  accept = DEFAULT_UPLOAD_ACCEPT,
}: CreateDefaultAttachmentAdapterOptions = {}): AttachmentAdapter {
  const base = baseUrl.replace(/\/$/, "");
  const resolvedUploadUrl = uploadUrl ?? `${base}/files/upload`;

  return {
    accept,

    async add({ file }) {
      const isImage = file.type.startsWith("image/");
      const pending: PendingAttachment = {
        id: crypto.randomUUID(),
        type: isImage ? "image" : "file",
        name: file.name,
        contentType: file.type || "application/octet-stream",
        file,
        status: { type: "requires-action", reason: "composer-send" },
      };
      return pending;
    },

    async send(attachment) {
      const fd = new FormData();
      fd.append("file", attachment.file);

      const res = await fetchFn(resolvedUploadUrl, { method: "POST", body: fd });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `Attachment upload failed (${res.status}): ${detail || res.statusText}`,
        );
      }

      const remoteUrl = await readUploadedUrl(res);
      const mime = attachment.contentType ?? "application/octet-stream";
      const filename = attachment.name;

      const complete: CompleteAttachment = {
        ...attachment,
        status: { type: "complete" },
        content: mime.startsWith("image/")
          ? [{ type: "image", image: remoteUrl, filename }]
          : [{ type: "file", data: remoteUrl, mimeType: mime, filename }],
      };
      return complete;
    },

    async remove() {
      // Uploaded blobs are addressed by opaque URLs; no server delete today.
    },
  };
}

/** @deprecated Alias of {@link createDefaultAttachmentAdapter}. */
export const createUploadAttachmentAdapter = createDefaultAttachmentAdapter;

async function readUploadedUrl(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as Record<string, unknown>;
    const raw = data.url ?? data.signed_url ?? data.id;
    const candidate =
      typeof raw === "string"
        ? raw
        : typeof raw === "number"
          ? String(raw)
          : "";
    if (candidate.length > 0) {
      return candidate;
    }
    throw new Error(
      "Attachment upload response did not include a `url`, `signed_url`, or `id` field.",
    );
  }

  const text = (await res.text()).trim();
  if (!text) {
    throw new Error("Attachment upload response was empty.");
  }
  return text;
}
