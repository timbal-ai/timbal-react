"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";
import { authFetch } from "../auth/tokens";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface UseWorkforcesOptions {
  /** Base URL for API calls. Default: `/api`. */
  baseUrl?: string;
  /** Custom fetch (defaults to `authFetch` for token-auth flows). */
  fetch?: FetchFn;
  /**
   * Pick the initial selected workforce. By default we prefer the first
   * `type === "agent"` entry, falling back to the first item. Pass a custom
   * resolver to override (e.g. remember the user's last choice).
   */
  pickInitial?: (items: WorkforceItem[]) => WorkforceItem | undefined;
  /** When false, the hook returns an empty list and skips the network fetch. */
  enabled?: boolean;
}

export interface UseWorkforcesResult {
  workforces: WorkforceItem[];
  /** Currently selected workforce identifier (id ?? uid ?? name). */
  selectedId: string;
  setSelectedId: (id: string) => void;
  /** The full `WorkforceItem` for `selectedId`, if any. */
  selected: WorkforceItem | undefined;
  isLoading: boolean;
  error: Error | null;
  /** Re-fetch the list. Resets `error`. */
  refresh: () => Promise<void>;
}

/**
 * Fetch the list of workforces exposed by the blueprint API and track a
 * selection. Used to power `<WorkforceSelector />` but exported separately
 * so apps can drive their own UI (e.g. a sidebar tree).
 */
export function useWorkforces(
  options: UseWorkforcesOptions = {},
): UseWorkforcesResult {
  const { baseUrl = "/api", fetch: fetchFn, pickInitial, enabled = true } = options;

  const [workforces, setWorkforces] = useState<WorkforceItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchFnRef = useRef<FetchFn>(fetchFn ?? authFetch);
  useEffect(() => {
    fetchFnRef.current = fetchFn ?? authFetch;
  }, [fetchFn]);

  const pickInitialRef = useRef(pickInitial);
  useEffect(() => {
    pickInitialRef.current = pickInitial;
  }, [pickInitial]);

  const load = useMemo(() => {
    return async () => {
      if (!enabled) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchFnRef.current(`${baseUrl}/workforce`);
        if (!res.ok) throw new Error(`Failed to load workforces (${res.status})`);
        const data: WorkforceItem[] = await res.json();
        setWorkforces(data);
        setSelectedId((current) => {
          if (current && data.some((w) => idOf(w) === current)) return current;
          const initial =
            pickInitialRef.current?.(data) ??
            data.find((w) => w.type === "agent") ??
            data[0];
          return initial ? idOf(initial) : "";
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
  }, [baseUrl, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => workforces.find((w) => idOf(w) === selectedId),
    [workforces, selectedId],
  );

  return {
    workforces,
    selectedId,
    setSelectedId,
    selected,
    isLoading,
    error,
    refresh: load,
  };
}

function idOf(item: WorkforceItem): string {
  return item.id ?? item.uid ?? item.name ?? "";
}
