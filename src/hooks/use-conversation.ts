"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getRun,
  listRuns,
  orderRunsForThread,
  type FetchFn,
  type RunDetail,
  type RunPreview,
} from "../runtime/conversations";
import { conversationRunsToMessages } from "../runtime/trace-to-messages";
import type { ChatMessage } from "../runtime/types";

/** Safety cap on how many turns we hydrate traces for in one conversation. */
const DEFAULT_MAX_TURNS = 60;

export interface UseConversationOptions {
  /** Root run id (the conversation handle). `null` clears the result. */
  conversationId?: string | number | null;
  baseUrl?: string;
  fetch?: FetchFn;
  runsPath?: string;
  /** Scope to a single workforce component (matches the conversation list). */
  workforceId?: string | null;
  /** Max turns to hydrate traces for. Default: 60. Extra turns set `truncated`. */
  maxTurns?: number;
  /** When false, skips fetching. */
  enabled?: boolean;
}

export interface UseConversationResult {
  /** Every turn (run) in the thread, ordered oldest → newest. */
  runs: RunPreview[];
  /** `<Thread>`-ready messages reconstructed from the per-turn traces. */
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  /** True when the thread has more turns than `maxTurns`. */
  truncated: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_RUNS: RunPreview[] = [];
const EMPTY_MESSAGES: ChatMessage[] = [];

/**
 * Load a single conversation thread and reconstruct it as `ChatMessage[]`.
 *
 * Fetches every turn sharing the conversation's `group_id`, pulls each turn's
 * trace, and stitches them into ordered messages (see
 * `conversationRunsToMessages`). Feed `messages` into a `<Thread>` via
 * `useTimbalRuntime().loadMessages(messages)` to reopen the conversation; the
 * last assistant `runId` lets the next send continue the same thread.
 */
export function useConversation(
  options: UseConversationOptions = {},
): UseConversationResult {
  const {
    conversationId = null,
    baseUrl = "/api",
    fetch: fetchFn,
    runsPath = "runs",
    workforceId = null,
    maxTurns = DEFAULT_MAX_TURNS,
    enabled = true,
  } = options;

  const [runs, setRuns] = useState<RunPreview[]>(EMPTY_RUNS);
  const [messages, setMessages] = useState<ChatMessage[]>(EMPTY_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [truncated, setTruncated] = useState(false);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const idStr =
    conversationId != null && String(conversationId).trim() !== ""
      ? String(conversationId)
      : null;

  const load = useMemo(() => {
    return async (signal?: AbortSignal) => {
      if (!enabled || !idStr) {
        setRuns(EMPTY_RUNS);
        setMessages(EMPTY_MESSAGES);
        setError(null);
        setIsLoading(false);
        setTruncated(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setTruncated(false);

      const fetchOpt = fetchFnRef.current ? { fetch: fetchFnRef.current } : {};

      try {
        const { runs: pageRuns, next_page_token } = await listRuns({
          baseUrl,
          runsPath,
          groupId: idStr,
          workforceId,
          sortBy: "created_at",
          sortOrder: "asc",
          ...fetchOpt,
          ...(signal ? { signal } : {}),
        });
        if (signal?.aborted) return;

        const ordered = orderRunsForThread(pageRuns);
        setRuns(ordered);

        const capped = ordered.slice(0, maxTurns);
        setTruncated(Boolean(next_page_token) || ordered.length > capped.length);

        const detailByRunId = new Map<string, RunDetail>();
        for (const run of capped) {
          if (signal?.aborted) return;
          const id = run?.id != null ? String(run.id) : "";
          if (!id) continue;
          try {
            const detail = await getRun({
              runId: id,
              baseUrl,
              runsPath,
              ...fetchOpt,
              ...(signal ? { signal } : {}),
            });
            if (detail?.trace) detailByRunId.set(id, detail);
          } catch {
            // Skip a single unreadable turn rather than failing the thread.
          }
        }
        if (signal?.aborted) return;

        setMessages(conversationRunsToMessages(capped, detailByRunId));
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setRuns(EMPTY_RUNS);
        setMessages(EMPTY_MESSAGES);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    };
  }, [enabled, idStr, baseUrl, runsPath, workforceId, maxTurns]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  return { runs, messages, isLoading, error, truncated, refresh };
}
