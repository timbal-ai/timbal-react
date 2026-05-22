import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  type AttachmentAdapter,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { parseSSELine } from "@timbal-ai/timbal-sdk";
import { authFetch } from "../auth/tokens";
import {
  reduceSseEvent,
  type ReducerState,
  createReducerState,
} from "./reducer";
import {
  buildPromptBody,
  extractAttachment,
  type AuiAttachment,
} from "./attachments";
import {
  resolveAttachmentAdapter,
  type TimbalAttachmentsProp,
} from "./resolve-attachments";
import type {
  ChatAttachment,
  ChatMessage,
  ContentPart,
  TextContentPart,
  ToolCallContentPart,
} from "./types";

export type {
  ChatAttachment,
  ChatMessage,
  ContentPart,
  TextContentPart,
  ToolCallContentPart,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ThreadAttachment = NonNullable<ThreadMessageLike["attachments"]>[number];

function projectAttachment(attachment: ChatAttachment): ThreadAttachment {
  const filename = attachment.name ?? "attachment";
  const mimeType = attachment.contentType ?? "application/octet-stream";

  if (attachment.type === "image") {
    return {
      id: attachment.id,
      type: "image",
      name: filename,
      contentType: mimeType,
      status: { type: "complete" },
      content: [{ type: "image", image: attachment.dataUrl, filename }],
    };
  }

  return {
    id: attachment.id,
    type: attachment.type,
    name: filename,
    contentType: mimeType,
    status: { type: "complete" },
    content: [
      { type: "file", data: attachment.dataUrl, mimeType, filename },
    ],
  };
}

const convertMessage = (message: ChatMessage): ThreadMessageLike => {
  type AuiPart = Exclude<ThreadMessageLike["content"], string>[number];
  const content: AuiPart[] = message.content.map((part): AuiPart => {
    if (part.type === "text") return { type: "text", text: part.text };
    if (part.type === "thinking") return { type: "reasoning", text: part.text };
    return {
      type: "tool-call",
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      argsText: part.argsText,
      ...(part.result !== undefined ? { result: part.result } : {}),
    };
  });

  const attachments =
    message.attachments && message.attachments.length > 0
      ? message.attachments.map(projectAttachment)
      : undefined;

  return {
    role: message.role,
    content,
    id: message.id,
    ...(attachments ? { attachments } : {}),
  };
};

function findParentId(messages: ChatMessage[], beforeIndex?: number): string | null {
  const slice = beforeIndex !== undefined ? messages.slice(0, beforeIndex) : messages;
  for (let i = slice.length - 1; i >= 0; i--) {
    if (slice[i].role === "assistant" && slice[i].runId) return slice[i].runId!;
  }
  return null;
}

function getTextFromMessage(message: ChatMessage): string {
  const part = message.content.find((c) => c.type === "text");
  return part?.type === "text" ? part.text : "";
}

function getAttachmentsFromMessage(
  message: ChatMessage,
): ChatAttachment[] | undefined {
  return message.attachments?.length ? message.attachments : undefined;
}

// ---------------------------------------------------------------------------
// useTimbalStream — low-level streaming hook (no UI)
// ---------------------------------------------------------------------------

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface UseTimbalStreamOptions {
  workforceId: string;
  baseUrl?: string;
  fetch?: FetchFn;
  /**
   * When true, every parsed SSE event is `console.debug`-ed with a
   * `[timbal]` prefix. Useful for diagnosing tool/artifact rendering issues
   * without screen-sharing. Default: `false`.
   */
  debug?: boolean;
}

export interface SendOptions {
  attachments?: ChatAttachment[];
  /** Override the parent run id resolution. Pass `null` to start a new thread. */
  parentId?: string | null;
}

export interface TimbalStreamApi {
  messages: ChatMessage[];
  isRunning: boolean;
  send: (input: string, options?: SendOptions) => Promise<void>;
  reload: (messageId?: string | null) => Promise<void>;
  cancel: () => void;
  clear: () => void;
}

/**
 * Lower-level streaming hook for callers that don't want the full `<Thread>`
 * UI. Exposes the internal message state plus `send`, `reload`, `cancel`, and
 * `clear` actions. Use this to build custom chat surfaces while reusing the
 * Timbal SSE wire format and auth-aware fetching.
 */
export function useTimbalStream({
  workforceId,
  baseUrl = "/api",
  fetch: fetchFn,
  debug = false,
}: UseTimbalStreamOptions): TimbalStreamApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const fetchFnRef = useRef<FetchFn>(fetchFn ?? authFetch);
  useEffect(() => {
    fetchFnRef.current = fetchFn ?? authFetch;
  }, [fetchFn]);

  const debugRef = useRef(debug);
  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const streamAssistantResponse = useCallback(
    async (
      input: string,
      attachments: ChatAttachment[] | undefined,
      userId: string,
      assistantId: string,
      parentId: string | null,
      signal: AbortSignal,
    ) => {
      const state: ReducerState = createReducerState();

      const flush = () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: [...state.parts] } : m,
          ),
        );
      };

      const stampRunId = (runId: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userId || m.id === assistantId ? { ...m, runId } : m,
          ),
        );
      };

      try {
        const body = buildPromptBody({ input, attachments, parentId });

        const res = await fetchFnRef.current(
          `${baseUrl}/workforce/${workforceId}/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal,
          },
        );

        if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let capturedRunId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const event = parseSSELine(line);
            if (!event) continue;

            if (debugRef.current) {
              console.debug("[timbal]", event.type, event);
            }

            if (!capturedRunId) {
              const runId = readTopLevelStartRunId(event);
              if (runId) {
                capturedRunId = runId;
                stampRunId(runId);
              }
            }

            const changed = reduceSseEvent(state, event);
            if (changed) flush();
          }
        }

        if (buffer.trim()) {
          const event = parseSSELine(buffer);
          if (event) {
            if (debugRef.current) {
              console.debug("[timbal]", event.type, event);
            }
            if (reduceSseEvent(state, event)) flush();
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          if (state.parts.length === 0) {
            state.parts.push({ type: "text", text: "Something went wrong." });
          }
          flush();
        }
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [workforceId, baseUrl],
  );

  const send = useCallback<TimbalStreamApi["send"]>(
    async (input, options) => {
      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      const base = messagesRef.current;
      const parentId =
        options?.parentId !== undefined ? options.parentId : findParentId(base);

      const userMessage: ChatMessage = {
        id: userId,
        role: "user",
        content: input ? [{ type: "text", text: input }] : [],
        ...(options?.attachments && options.attachments.length > 0
          ? { attachments: options.attachments }
          : {}),
      };

      setMessages([
        ...base,
        userMessage,
        { id: assistantId, role: "assistant", content: [] },
      ]);
      setIsRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;
      await streamAssistantResponse(
        input,
        options?.attachments,
        userId,
        assistantId,
        parentId,
        controller.signal,
      );
    },
    [streamAssistantResponse],
  );

  const reload = useCallback<TimbalStreamApi["reload"]>(
    async (messageId) => {
      const current = messagesRef.current;
      const idx = messageId
        ? current.findIndex((m) => m.id === messageId)
        : current.length - 2;

      const userMessage = idx >= 0 ? current[idx] : null;
      if (!userMessage || userMessage.role !== "user") return;

      const input = getTextFromMessage(userMessage);
      const messageAttachments = getAttachmentsFromMessage(userMessage);
      if (!input && !messageAttachments?.length) return;

      const assistantId = crypto.randomUUID();
      const parentId = findParentId(current, idx);

      setMessages((prev) => [
        ...prev.slice(0, idx + 1),
        { id: assistantId, role: "assistant" as const, content: [] },
      ]);
      setIsRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;
      await streamAssistantResponse(
        input,
        messageAttachments,
        userMessage.id,
        assistantId,
        parentId,
        controller.signal,
      );
    },
    [streamAssistantResponse],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return useMemo(
    () => ({ messages, isRunning, send, reload, cancel, clear }),
    [messages, isRunning, send, reload, cancel, clear],
  );
}

function readTopLevelStartRunId(event: Record<string, unknown>): string | null {
  if (
    event.type === "START" &&
    typeof event.run_id === "string" &&
    typeof event.path === "string" &&
    !(event.path as string).includes(".")
  ) {
    return event.run_id as string;
  }
  return null;
}

// ---------------------------------------------------------------------------
// TimbalRuntimeProvider — wires useTimbalStream into @assistant-ui/react
// ---------------------------------------------------------------------------

const TimbalStreamContext = createContext<TimbalStreamApi | null>(null);

/**
 * Access the underlying `useTimbalStream` API from inside a component tree
 * wrapped by `<TimbalRuntimeProvider>` (or `<TimbalChat>`). Useful for custom
 * UIs that need direct access to messages, send, or cancel without going
 * through the assistant-ui runtime.
 */
export function useTimbalRuntime(): TimbalStreamApi {
  const ctx = useContext(TimbalStreamContext);
  if (!ctx) {
    throw new Error(
      "useTimbalRuntime must be used inside a <TimbalRuntimeProvider>.",
    );
  }
  return ctx;
}

export interface TimbalRuntimeProviderProps {
  workforceId: string;
  children: ReactNode;
  /**
   * Base URL for API calls. Defaults to `/api`.
   * The provider will POST to `{baseUrl}/workforce/{workforceId}/stream`.
   */
  baseUrl?: string;
  /**
   * Custom fetch function for API calls. Defaults to `authFetch` which
   * attaches Bearer tokens from localStorage and auto-refreshes on 401.
   */
  fetch?: FetchFn;
  /**
   * Enable composer attachments. `true` or `{ uploadUrl?, accept? }` uses
   * the built-in upload adapter (`POST` to `${baseUrl}/files/upload` by
   * default). Pass a custom {@link AttachmentAdapter} for full control, or
   * `null` to disable. Omitted = off (back-compat with pre-attachment chats).
   */
  attachments?: TimbalAttachmentsProp;
  /**
   * Shorthand to enable the default upload adapter with a custom endpoint.
   * Equivalent to `attachments={{ uploadUrl }}` when `attachments` is omitted.
   */
  attachmentsUploadUrl?: string;
  /**
   * Shorthand MIME `accept` for the default upload adapter when `attachments`
   * is omitted or `true`.
   */
  attachmentsAccept?: string;
  /**
   * Forwarded to {@link useTimbalStream}. When `true`, every parsed SSE
   * event is logged via `console.debug` with a `[timbal]` prefix.
   */
  debug?: boolean;
}

export function TimbalRuntimeProvider({
  workforceId,
  children,
  baseUrl = "/api",
  fetch: fetchFn,
  attachments,
  attachmentsUploadUrl,
  attachmentsAccept,
  debug,
}: TimbalRuntimeProviderProps) {
  const stream = useTimbalStream({
    workforceId,
    baseUrl,
    fetch: fetchFn,
    debug,
  });

  const attachmentAdapter = useMemo(
    () =>
      resolveAttachmentAdapter(attachments, {
        baseUrl,
        fetch: fetchFn,
        uploadUrl: attachmentsUploadUrl,
        accept: attachmentsAccept,
      }),
    [attachments, attachmentsUploadUrl, attachmentsAccept, baseUrl, fetchFn],
  );

  // ---- assistant-ui adapter ---------------------------------------------

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const textPart = message.content.find((c) => c.type === "text");
      const input =
        textPart && textPart.type === "text" ? textPart.text : "";

      const auiAttachments = message.attachments as
        | readonly AuiAttachment[]
        | undefined;
      const attachments = auiAttachments
        ? (
            await Promise.all(auiAttachments.map(extractAttachment))
          ).filter((a): a is ChatAttachment => a !== null)
        : [];

      if (!input && attachments.length === 0) return;

      const parentId =
        message.parentId !== null && message.parentId !== undefined
          ? findParentIdFromAuiParent(stream.messages, message.parentId)
          : undefined;

      await stream.send(input, {
        attachments: attachments.length > 0 ? attachments : undefined,
        ...(parentId !== undefined ? { parentId } : {}),
      });
    },
    [stream],
  );

  const onReload = useCallback(
    async (messageId: string | null) => {
      await stream.reload(messageId);
    },
    [stream],
  );

  const onCancel = useCallback(async () => {
    stream.cancel();
  }, [stream]);

  const runtime = useExternalStoreRuntime({
    isRunning: stream.isRunning,
    messages: stream.messages,
    convertMessage,
    onNew,
    onEdit: onNew,
    onReload,
    onCancel,
    ...(attachmentAdapter
      ? { adapters: { attachments: attachmentAdapter } }
      : {}),
  });

  return (
    <TimbalStreamContext.Provider value={stream}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </TimbalStreamContext.Provider>
  );
}

/**
 * Resolve the `parentId` to pass to the agent based on the assistant-ui
 * `message.parentId` (which references a UI message id). We look up the
 * referenced message and walk back to find the most recent assistant `runId`,
 * which is what the Timbal API expects.
 */
function findParentIdFromAuiParent(
  messages: ChatMessage[],
  auiParentId: string,
): string | null {
  const idx = messages.findIndex((m) => m.id === auiParentId);
  if (idx < 0) return null;
  return findParentId(messages.slice(0, idx + 1));
}
