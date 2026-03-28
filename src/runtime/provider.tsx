import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { parseSSELine } from "@timbal-ai/timbal-sdk";
import { authFetch } from "../auth/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TextContentPart = { type: "text"; text: string };

type ToolCallContentPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  argsText: string;
  result?: unknown;
};

type ContentPart = TextContentPart | ToolCallContentPart;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: ContentPart[];
  runId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const convertMessage = (message: ChatMessage): ThreadMessageLike => ({
  role: message.role,
  content: message.content,
  id: message.id,
});

function findParentId(messages: ChatMessage[], beforeIndex?: number): string | null {
  const slice = beforeIndex !== undefined ? messages.slice(0, beforeIndex) : messages;
  for (let i = slice.length - 1; i >= 0; i--) {
    if (slice[i].role === "assistant" && slice[i].runId) return slice[i].runId!;
  }
  return null;
}

function isTopLevelStart(event: Record<string, unknown>): boolean {
  return (
    event.type === "START" &&
    typeof event.run_id === "string" &&
    typeof event.path === "string" &&
    !(event.path as string).includes(".")
  );
}

function getTextFromMessage(message: ChatMessage): string | null {
  const part = message.content.find((c) => c.type === "text");
  return part?.type === "text" ? part.text : null;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

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
}

export function TimbalRuntimeProvider({
  workforceId,
  children,
  baseUrl = "/api",
  fetch: fetchFn,
}: TimbalRuntimeProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const fetchFnRef = useRef<FetchFn>(fetchFn ?? authFetch);
  useEffect(() => {
    fetchFnRef.current = fetchFn ?? authFetch;
  }, [fetchFn]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ---- streaming core ----------------------------------------------------

  const streamAssistantResponse = useCallback(
    async (
      input: string,
      userId: string,
      assistantId: string,
      parentId: string | null,
      signal: AbortSignal,
    ) => {
      const parts: ContentPart[] = [];
      const toolIndexById = new Map<string, number>();

      const lastTextPart = (): TextContentPart => {
        const last = parts[parts.length - 1];
        if (last?.type === "text") return last;
        const next: TextContentPart = { type: "text", text: "" };
        parts.push(next);
        return next;
      };

      const flush = () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: [...parts] } : m)),
        );
      };

      const stampRunId = (runId: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === userId || m.id === assistantId ? { ...m, runId } : m)),
        );
      };

      try {
        const res = await fetchFnRef.current(`${baseUrl}/workforce/${workforceId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: input,
            context: { parent_id: parentId },
          }),
          signal,
        });

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

            if (!capturedRunId && isTopLevelStart(event)) {
              capturedRunId = event.run_id as string;
              stampRunId(capturedRunId);
            }

            switch (event.type) {
              case "DELTA": {
                const item = event.item as Record<string, unknown> | undefined;
                if (!item) break;

                if (item.type === "text_delta" && typeof item.text_delta === "string") {
                  lastTextPart().text += item.text_delta;
                  flush();
                } else if (item.type === "tool_use") {
                  const toolCallId = (item.id as string) || `tool-${crypto.randomUUID()}`;
                  const inputStr = typeof item.input === "string" ? item.input : JSON.stringify(item.input ?? {});
                  parts.push({
                    type: "tool-call",
                    toolCallId,
                    toolName: (item.name as string) || "unknown",
                    argsText: inputStr,
                  });
                  toolIndexById.set(toolCallId, parts.length - 1);
                  flush();
                } else if (item.type === "tool_use_delta") {
                  const idx = toolIndexById.get(item.id as string);
                  if (idx !== undefined && typeof item.input_delta === "string") {
                    (parts[idx] as ToolCallContentPart).argsText += item.input_delta;
                    flush();
                  }
                }
                break;
              }

              case "OUTPUT": {
                const output = event.output as Record<string, unknown> | string | undefined;
                if (!output) break;

                if (typeof output === "object" && Array.isArray(output.content)) {
                  for (const block of output.content as Record<string, unknown>[]) {
                    if (block.type === "tool_use") {
                      const id = (block.id as string) || `tool-${crypto.randomUUID()}`;
                      const idx = toolIndexById.get(id);
                      if (idx !== undefined) {
                        (parts[idx] as ToolCallContentPart).result = "Tool executed";
                      } else {
                        const inputStr = typeof block.input === "string" ? block.input : JSON.stringify(block.input ?? {});
                        parts.push({
                          type: "tool-call",
                          toolCallId: id,
                          toolName: (block.name as string) || "unknown",
                          argsText: inputStr,
                          result: "Tool executed",
                        });
                        toolIndexById.set(id, parts.length - 1);
                      }
                    } else if (block.type === "text" && typeof block.text === "string" && !lastTextPart().text) {
                      lastTextPart().text = block.text;
                    }
                  }
                  flush();
                } else if (parts.length === 0) {
                  const text = typeof output === "string" ? output : JSON.stringify(output);
                  parts.push({ type: "text", text });
                  flush();
                }
                break;
              }
            }
          }
        }

        if (buffer.trim()) {
          const event = parseSSELine(buffer);
          if (event?.type === "OUTPUT" && parts.length === 0 && event.output) {
            const text = typeof event.output === "string" ? event.output : JSON.stringify(event.output);
            parts.push({ type: "text", text });
            flush();
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          if (parts.length === 0) parts.push({ type: "text", text: "Something went wrong." });
          flush();
        }
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [workforceId, baseUrl],
  );

  // ---- runtime callbacks -------------------------------------------------

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const textPart = message.content.find((c) => c.type === "text");
      if (!textPart || textPart.type !== "text") return;

      const input = textPart.text;
      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      let base = messagesRef.current;
      if (message.parentId !== null) {
        const parentIdx = base.findIndex((m) => m.id === message.parentId);
        if (parentIdx >= 0) {
          base = base.slice(0, parentIdx + 1);
        }
      }

      const parentId = findParentId(base);

      setMessages([
        ...base,
        { id: userId, role: "user", content: [{ type: "text", text: input }] },
      ]);
      setIsRunning(true);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant" as const, content: [] },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      await streamAssistantResponse(input, userId, assistantId, parentId, controller.signal);
    },
    [streamAssistantResponse],
  );

  const onReload = useCallback(
    async (messageId: string | null) => {
      const current = messagesRef.current;
      const idx = messageId
        ? current.findIndex((m) => m.id === messageId)
        : current.length - 2;

      const userMessage = idx >= 0 ? current[idx] : null;
      if (!userMessage || userMessage.role !== "user") return;

      const input = getTextFromMessage(userMessage);
      if (!input) return;

      const assistantId = crypto.randomUUID();
      const parentId = findParentId(current, idx);

      setMessages((prev) => [
        ...prev.slice(0, idx + 1),
        { id: assistantId, role: "assistant" as const, content: [] },
      ]);
      setIsRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;
      await streamAssistantResponse(input, userMessage.id, assistantId, parentId, controller.signal);
    },
    [streamAssistantResponse],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  // ---- render ------------------------------------------------------------

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    convertMessage,
    onNew,
    onEdit: onNew,
    onReload,
    onCancel,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
