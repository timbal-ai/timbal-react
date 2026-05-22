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
import { Button } from "../ui/button";
import { cn } from "../utils";

export interface ThreadSuggestion {
  /** Title shown on the chip. Also sent verbatim as the user message. */
  title: string;
  /** Optional secondary line. */
  description?: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /**
   * Override the prompt sent when the chip is clicked. Useful when the chip
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
  /**
   * Compact layout: single row, horizontally scrollable, smaller chips. Use
   * inline (e.g. above the composer or after a message) where vertical
   * space is tight.
   */
  layout?: "grid" | "row";
  className?: string;
}

/**
 * Render suggestion chips. Resolves both static arrays and async sources.
 * On click, appends the suggestion's `prompt` (or `title` if no prompt) as
 * a user message via the thread runtime.
 */
export const Suggestions: FC<ThreadSuggestionsProps> = ({
  suggestions,
  layout = "grid",
  className,
}) => {
  const items = useResolvedSuggestions(suggestions);

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "aui-thread-suggestions w-full pb-4",
        layout === "grid"
          ? "grid gap-2 @md:grid-cols-2"
          : "flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((s, i) => (
        <SuggestionChip key={s.title + i} suggestion={s} compact={layout === "row"} />
      ))}
    </div>
  );
};

const SuggestionChip: FC<{ suggestion: ThreadSuggestion; compact?: boolean }> = ({
  suggestion,
  compact,
}) => {
  const runtime = useThreadRuntime();
  const onClick = () => {
    const text = suggestion.prompt ?? suggestion.title;
    runtime.append({ role: "user", content: [{ type: "text", text }] });
  };

  return (
    <div className="aui-thread-suggestion-display fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-200">
      <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
          "aui-thread-suggestion h-auto rounded-2xl border text-left text-sm transition-colors hover:bg-muted",
          compact
            ? "shrink-0 flex-row items-center gap-2 whitespace-nowrap px-3 py-2"
            : "w-full flex-wrap items-start justify-start gap-1 px-4 py-3 @md:flex-col",
        )}
      >
        {suggestion.icon && (
          <span className="aui-thread-suggestion-icon shrink-0 text-muted-foreground">
            {suggestion.icon}
          </span>
        )}
        <span className="aui-thread-suggestion-text-1 font-medium">
          {suggestion.title}
        </span>
        {suggestion.description && !compact && (
          <span className="aui-thread-suggestion-text-2 text-muted-foreground">
            {suggestion.description}
          </span>
        )}
      </Button>
    </div>
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
// Slot prop type
// ---------------------------------------------------------------------------

/**
 * Props passed to a custom `Suggestions` slot component. Replace the default
 * via `<Thread components={{ Suggestions: MySuggestions }}>`.
 */
export interface SuggestionsSlotProps {
  suggestions?: SuggestionsSource;
}

export type SuggestionsComponent = ComponentType<SuggestionsSlotProps>;
