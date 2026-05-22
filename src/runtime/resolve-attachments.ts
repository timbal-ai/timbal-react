import type { AttachmentAdapter } from "@assistant-ui/react";
import {
  createDefaultAttachmentAdapter,
  type CreateDefaultAttachmentAdapterOptions,
} from "./upload-adapter";

/** Tweaks for the built-in upload adapter (see {@link createDefaultAttachmentAdapter}). */
export type TimbalAttachmentsConfig = {
  uploadUrl?: string;
  accept?: string;
};

/**
 * Enable or customise composer attachments.
 *
 * - `true` — built-in adapter posting to `${baseUrl}/files/upload`
 * - `{ uploadUrl?, accept? }` — same adapter with overrides
 * - `AttachmentAdapter` — fully custom (e.g. presigned S3)
 * - `null` — disable attachments (no `+` button / dropzone wiring)
 * - `undefined` — off unless legacy `attachmentsUploadUrl` / `attachmentsAccept` are set
 */
export type TimbalAttachmentsProp =
  | boolean
  | TimbalAttachmentsConfig
  | AttachmentAdapter
  | null;

export interface ResolveAttachmentAdapterOptions {
  baseUrl?: string;
  fetch?: CreateDefaultAttachmentAdapterOptions["fetch"];
  /** @deprecated Prefer `attachments={{ uploadUrl }}` */
  uploadUrl?: string;
  /** @deprecated Prefer `attachments={{ accept }}` */
  accept?: string;
}

function isAttachmentAdapter(value: unknown): value is AttachmentAdapter {
  return (
    typeof value === "object" &&
    value !== null &&
    "accept" in value &&
    typeof (value as AttachmentAdapter).add === "function" &&
    typeof (value as AttachmentAdapter).send === "function" &&
    typeof (value as AttachmentAdapter).remove === "function"
  );
}

/**
 * Resolve the `AttachmentAdapter` (if any) for {@link TimbalRuntimeProvider}.
 */
export function resolveAttachmentAdapter(
  attachments: TimbalAttachmentsProp | undefined,
  options: ResolveAttachmentAdapterOptions = {},
): AttachmentAdapter | undefined {
  const baseUrl = options.baseUrl ?? "/api";
  const legacyUploadUrl = options.uploadUrl;
  const legacyAccept = options.accept;

  if (attachments === null) return undefined;

  const legacyEnables =
    legacyUploadUrl !== undefined || legacyAccept !== undefined;

  if (attachments === undefined) {
    if (!legacyEnables) return undefined;
    return createDefaultAttachmentAdapter({
      baseUrl,
      fetch: options.fetch,
      uploadUrl: legacyUploadUrl,
      accept: legacyAccept,
    });
  }

  if (attachments === true) {
    return createDefaultAttachmentAdapter({
      baseUrl,
      fetch: options.fetch,
      uploadUrl: legacyUploadUrl,
      accept: legacyAccept,
    });
  }

  if (isAttachmentAdapter(attachments)) return attachments;

  const config = attachments as TimbalAttachmentsConfig;
  return createDefaultAttachmentAdapter({
    baseUrl,
    fetch: options.fetch,
    uploadUrl: config.uploadUrl ?? legacyUploadUrl,
    accept: config.accept ?? legacyAccept,
  });
}
