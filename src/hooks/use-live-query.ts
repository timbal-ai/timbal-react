"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Run `callback` every `delayMs`. Pass `null` to pause (the timer is torn down
 * and restarted when the delay changes). The latest `callback` is always used,
 * so you can pass an inline function without resetting the interval.
 */
export function useInterval(
  callback: () => void,
  delayMs: number | null,
): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => saved.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

export interface UseLiveQueryOptions {
  /** Poll interval in ms. Omit / `null` for a one-shot fetch (no polling). */
  intervalMs?: number | null;
  /** Pause fetching + polling entirely. Default: `true`. */
  enabled?: boolean;
  /** Fetch immediately on mount (vs. waiting one interval). Default: `true`. */
  immediate?: boolean;
  /**
   * Pause polling while the tab is hidden and refetch on focus — avoids
   * burning requests on a backgrounded dashboard. Default: `true`.
   */
  refetchOnFocus?: boolean;
}

export interface UseLiveQueryResult<T> {
  data: T | undefined;
  error: unknown;
  /** True until the first response settles. */
  loading: boolean;
  /** True during background refreshes (data already present). */
  refreshing: boolean;
  /** Timestamp (ms) of the last successful fetch, or null. */
  lastUpdated: number | null;
  /** Manually trigger a refetch (e.g. a "Refresh" button). */
  refetch: () => void;
  /**
   * Alias for `refetch`, matching the `refresh` naming used by the other data
   * hooks (`useWorkforces`, `useConversations`, `useConversation`).
   */
  refresh: () => void;
}

/**
 * Poll an async source on an interval for live dashboards (alerts, metrics,
 * logs). Handles loading/refreshing/error state, ignores out-of-order and
 * post-unmount responses, pauses while the tab is hidden, and exposes a manual
 * `refetch`. Pair with `authFetch` for `/api/*` calls.
 *
 * ```ts
 * const { data, loading, refetch } = useLiveQuery(
 *   () => authFetch("/api/alerts").then((r) => r.json()),
 *   { intervalMs: 15_000 },
 * );
 * ```
 *
 * `fetcher` is read through a ref, so an inline arrow doesn't reset polling;
 * change `intervalMs` / `enabled` to control the cadence.
 */
export function useLiveQuery<T>(
  fetcher: () => Promise<T>,
  options: UseLiveQueryOptions = {},
): UseLiveQueryResult<T> {
  const {
    intervalMs = null,
    enabled = true,
    immediate = true,
    refetchOnFocus = true,
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const mounted = useRef(true);
  const requestId = useRef(0);
  const hasData = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(() => {
    const id = ++requestId.current;
    if (hasData.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    fetcherRef
      .current()
      .then((result) => {
        // Drop stale (superseded) and post-unmount responses.
        if (!mounted.current || id !== requestId.current) return;
        setData(result);
        setError(undefined);
        setLastUpdated(Date.now());
        hasData.current = true;
      })
      .catch((err) => {
        if (!mounted.current || id !== requestId.current) return;
        setError(err);
      })
      .finally(() => {
        if (!mounted.current || id !== requestId.current) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  const refetch = useCallback(() => {
    if (!enabled) return;
    run();
  }, [enabled, run]);

  // Initial / enablement-driven fetch.
  useEffect(() => {
    if (!enabled) return;
    if (immediate) run();
  }, [enabled, immediate, run]);

  // Interval polling.
  useEffect(() => {
    if (!enabled || intervalMs === null) return;
    const tick = () => {
      if (
        refetchOnFocus &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      run();
    };
    const handle = setInterval(tick, intervalMs);
    return () => clearInterval(handle);
  }, [enabled, intervalMs, refetchOnFocus, run]);

  // Refetch when the tab regains focus.
  useEffect(() => {
    if (!enabled || !refetchOnFocus || typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, refetchOnFocus, run]);

  return {
    data,
    error,
    loading,
    refreshing,
    lastUpdated,
    refetch,
    refresh: refetch,
  };
}
