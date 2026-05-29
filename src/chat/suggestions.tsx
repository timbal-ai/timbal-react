"use client";

import {
  type ComponentType,
  type FC,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useThreadRuntime } from "@assistant-ui/react";
import { ArrowUpIcon } from "lucide-react";

import { studioListRowButtonClass } from "../design/classes";
import { cn } from "../utils";

export interface ThreadSuggestion {
  /** Title shown on the row. Also sent verbatim as the user message. */
  title: string;
  /** Optional secondary line. */
  description?: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /**
   * Override the prompt sent when the row is clicked. Useful when the row
   * label is short ("Weekly recap") but the prompt should be longer.
   */
  prompt?: string;
}

/**
 * Suggestions can be passed as a static array, a thunk that returns an
 * array, or an async function for dynamic / per-user suggestions.
 */
export type SuggestionsSource =
  | ThreadSuggestion[]
  | (() => ThreadSuggestion[] | Promise<ThreadSuggestion[]>);

export interface ThreadSuggestionsProps {
  suggestions?: SuggestionsSource;
  className?: string;
}

/**
 * Render suggestions as a stacked column of full-width rows. Each row reads
 * like a list item rather than a chip, matching the Studio playground.
 *
 * On click the row's `prompt` (or `title` if no prompt) is appended as a
 * user message via the thread runtime.
 */
export const Suggestions: FC<ThreadSuggestionsProps> = ({
  suggestions,
  className,
}) => {
  const items = useResolvedSuggestions(suggestions);

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "aui-thread-suggestions flex w-full flex-col gap-2 pb-2.5",
        className,
      )}
      role="list"
      aria-label="Suggested prompts"
    >
      {items.map((suggestion, i) => (
        <SuggestionRow key={(suggestion.prompt ?? suggestion.title) + i} suggestion={suggestion} />
      ))}
    </div>
  );
};

const SuggestionRow: FC<{ suggestion: ThreadSuggestion }> = ({ suggestion }) => {
  const runtime = useThreadRuntime();
  const onClick = () => {
    const text = suggestion.prompt ?? suggestion.title;
    runtime.append({ role: "user", content: [{ type: "text", text }] });
  };

  return (
    <button
      type="button"
      role="listitem"
      onClick={onClick}
      className={cn("aui-thread-suggestion", studioListRowButtonClass)}
    >
      <span className="aui-thread-suggestion-icon shrink-0 text-muted-foreground">
        {suggestion.icon ?? (
          <ArrowUpIcon className="size-4" strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <span className="aui-thread-suggestion-text min-w-0 flex-1 text-left">
        <span className="aui-thread-suggestion-text-1 block truncate text-sm font-normal text-foreground">
          {suggestion.title}
        </span>
        {suggestion.description && (
          <span className="aui-thread-suggestion-text-2 mt-0.5 block truncate text-xs text-muted-foreground">
            {suggestion.description}
          </span>
        )}
      </span>
    </button>
  );
};

/**
 * Resolve a `SuggestionsSource` to an array. Re-runs when the source
 * identity changes. Sync arrays / sync functions resolve immediately;
 * async functions stream in once the promise settles.
 */
export function useResolvedSuggestions(
  source?: SuggestionsSource,
): ThreadSuggestion[] | undefined {
  const [resolved, setResolved] = useState<ThreadSuggestion[] | undefined>(() =>
    Array.isArray(source) ? source : undefined,
  );

  useEffect(() => {
    if (!source) {
      setResolved(undefined);
      return;
    }
    if (Array.isArray(source)) {
      setResolved(source);
      return;
    }

    let cancelled = false;
    Promise.resolve()
      .then(() => source())
      .then((value) => {
        if (!cancelled) setResolved(value);
      })
      .catch(() => {
        if (!cancelled) setResolved([]);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return useMemo(() => resolved, [resolved]);
}

// ---------------------------------------------------------------------------
// Slot prop type — used by `<Thread components={{ Suggestions }} />`
// ---------------------------------------------------------------------------

export interface SuggestionsSlotProps {
  suggestions?: SuggestionsSource;
  className?: string;
}

export type SuggestionsComponent = ComponentType<SuggestionsSlotProps>;
