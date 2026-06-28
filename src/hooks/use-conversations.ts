"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listRuns,
  type FetchFn,
  type ListRunsResult,
  type RunPreview,
  type RunSortBy,
  type RunSortOrder,
} from "../runtime/conversations";

export interface UseConversationsOptions {
  /** Base URL for API calls. Default: `/api`. */
  baseUrl?: string;
  /** Custom fetch (defaults to `authFetch`). */
  fetch?: FetchFn;
  /** Path segment for the runs collection under `baseUrl`. Default: `runs`. */
  runsPath?: string;
  /** Scope to a single workforce component. Strongly recommended. */
  workforceId?: string | null;
  /** Restrict to one user (requires `projects.runs.list`). */
  userId?: string | null;
  /** Default `created_at`. */
  sortBy?: RunSortBy | null;
  /** Default `desc` (newest first). */
  sortOrder?: RunSortOrder | null;
  /** When false, skips fetching and returns an empty list. */
  enabled?: boolean;
}

export interface UseConversationsResult {
  /** Thread roots — one row per conversation. */
  conversations: RunPreview[];
  isLoading: boolean;
  /** True while a `loadMore()` page is in flight. */
  isLoadingMore: boolean;
  error: Error | null;
  /** True when another page is available. */
  hasMore: boolean;
  /** Fetch the next page and append to `conversations`. */
  loadMore: () => Promise<void>;
  /** Reload from the first page. Resets pagination + error. */
  refresh: () => Promise<void>;
}

const EMPTY: RunPreview[] = [];

/**
 * List conversation entry points (thread roots) for a workforce, with offset
 * pagination. Each item is a root `RunPreview` whose `id` is the thread handle
 * to pass to {@link useConversation}.
 *
 * Roots are ordered by thread creation time (the API caveat: not last
 * activity), and root rows don't carry thread aggregates — fetch the trace via
 * `useConversation` / `getRun` for a title or message preview.
 */
export function useConversations(
  options: UseConversationsOptions = {},
): UseConversationsResult {
  const {
    baseUrl = "/api",
    fetch: fetchFn,
    runsPath = "runs",
    workforceId = null,
    userId = null,
    sortBy = "created_at",
    sortOrder = "desc",
    enabled = true,
  } = options;

  const [conversations, setConversations] = useState<RunPreview[]>(EMPTY);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = nextPageToken;

  const baseParams = useMemo(
    () => ({
      baseUrl,
      runsPath,
      roots: true as const,
      workforceId,
      userId,
      sortBy,
      sortOrder,
    }),
    [baseUrl, runsPath, workforceId, userId, sortBy, sortOrder],
  );

  const fetchPage = useCallback(
    (pageToken: string | null, signal?: AbortSignal): Promise<ListRunsResult> =>
      listRuns({
        ...baseParams,
        pageToken,
        ...(fetchFnRef.current ? { fetch: fetchFnRef.current } : {}),
        ...(signal ? { signal } : {}),
      }),
    [baseParams],
  );

  const load = useMemo(() => {
    return async (signal?: AbortSignal) => {
      if (!enabled) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchPage(null, signal);
        if (signal?.aborted) return;
        setConversations(res.runs);
        setNextPageToken(res.next_page_token ?? null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    };
  }, [enabled, fetchPage]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const loadMore = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchPage(token);
      setConversations((prev) => {
        const seen = new Set(prev.map((r) => String(r.id)));
        const merged = res.runs.filter((r) => !seen.has(String(r.id)));
        return [...prev, ...merged];
      });
      setNextPageToken(res.next_page_token ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage]);

  const refresh = useCallback(() => load(), [load]);

  return {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore: Boolean(nextPageToken),
    loadMore,
    refresh,
  };
}
