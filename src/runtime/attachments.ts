import type { AppendMessage } from "@assistant-ui/react";
import type { ChatAttachment } from "./types";

export type AuiAttachment = NonNullable<AppendMessage["attachments"]>[number];

/**
 * Read a file off an assistant-ui `AppendMessage` attachment and convert it
 * into the {@link ChatAttachment} shape the runtime stores on user messages.
 *
 * Prefers `attachment.file` (the raw `File` object exposed by adapters such as
 * `SimpleImageAttachmentAdapter`) and falls back to walking the adapter's
 * already-encoded `content[]` (e.g. `SimpleTextAttachmentAdapter` which
 * returns a `text` part rather than a `File`).
 */
export async function extractAttachment(
  attachment: AuiAttachment,
): Promise<ChatAttachment | null> {
  const file = (attachment as { file?: File }).file;
  let src: string | null = null;
  let contentType: string | undefined;
  let name: string | undefined =
    (attachment as { name?: string }).name ?? file?.name;

  // Prefer the adapter's already-resolved content[] when it carries a
  // non-data URL. The upload adapter populates `content[]` with the remote
  // file URL, so honouring it here is what makes uploads flow end-to-end —
  // otherwise we would re-encode the file as a base64 data URL and ignore
  // the upload entirely.
  const content = attachment.content as
    | ReadonlyArray<Record<string, unknown>>
    | undefined;
  if (content) {
    for (const block of content) {
      if (block.type === "image" && typeof block.image === "string") {
        src = block.image;
        if (typeof (block as { mimeType?: unknown }).mimeType === "string") {
          contentType = (block as { mimeType?: string }).mimeType;
        }
        break;
      }
      if (block.type === "file" && typeof block.data === "string") {
        src = block.data;
        if (typeof block.mimeType === "string") contentType = block.mimeType;
        break;
      }
    }
  }

  // Fall back to reading the raw file only when the adapter didn't already
  // hand us a usable URL via `content[]`.
  if (src === null && file) {
    src = await fileToDataUrl(file);
    if (!contentType) contentType = file.type || undefined;
    if (!name) name = file.name;
  }

  if (!src) return null;

  if (!contentType) contentType = mimeFromDataUrl(src);

  const rawType = String(attachment.type ?? "file");
  const type: ChatAttachment["type"] =
    rawType === "image" || rawType === "document" ? rawType : "file";

  return {
    id: (attachment as { id?: string }).id ?? crypto.randomUUID(),
    type,
    ...(name !== undefined ? { name } : {}),
    ...(contentType !== undefined ? { contentType } : {}),
    dataUrl: src,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function mimeFromDataUrl(dataUrl: string): string | undefined {
  const match = /^data:([^;,]+)[;,]/.exec(dataUrl);
  return match?.[1];
}

export interface PromptBodyOptions {
  input: string;
  attachments?: ChatAttachment[];
  parentId: string | null;
}

/**
 * Build the JSON body posted to `/workforce/{id}/stream`.
 *
 * The Timbal Python framework's `Message.validate()` walks each item in
 * `prompt` through `content_factory()`:
 *
 *   - Strings become `TextContent`.
 *   - Dicts of shape `{type:"file", file:"<url-or-data-url>"}` become
 *     `FileContent`, which the LLM bridge then forwards as `input_image`
 *     (OpenAI) or `image` (Anthropic). Both real HTTP(S) URLs and base64
 *     data URLs are accepted in the `file` field.
 *
 * We therefore must NOT send attachments as bare strings — that route
 * makes the model see "data:image/png;base64,..." (or the URL string) as
 * ordinary text instead of an actual file.
 */
export function buildPromptBody({
  input,
  attachments,
  parentId,
}: PromptBodyOptions): Record<string, unknown> {
  const context = { parent_id: parentId };
  const files = attachments ?? [];

  if (files.length === 0) {
    return { prompt: input, context };
  }

  const parts: Array<Record<string, unknown>> = [];
  if (input) parts.push({ type: "text", text: input });
  for (const attachment of files) {
    parts.push({ type: "file", file: attachment.dataUrl });
  }
  return { prompt: parts, context };
}
