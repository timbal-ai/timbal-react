"use client";

import { type FC, type ReactNode } from "react";
import { TimbalChat, type TimbalChatProps } from "./chat";
import { WorkforceSelector } from "./workforce-selector";
import { useWorkforces } from "../hooks/use-workforces";
import { cn } from "../utils";

export interface TimbalChatShellProps
  extends Omit<TimbalChatProps, "workforceId"> {
  /**
   * Pre-selected workforce id. When omitted, the shell fetches the workforce
   * list from `{baseUrl}/workforce` and picks the first agent automatically.
   */
  workforceId?: string;
  /** Branding rendered at the start of the header (logo, etc). */
  brand?: ReactNode;
  /** Extra content rendered at the end of the header (theme toggle, logout). */
  headerActions?: ReactNode;
  /** Hide the built-in workforce selector. Default: false. */
  hideWorkforceSelector?: boolean;
  /** Class for the outer flex container. */
  className?: string;
  /** Class for the header bar. */
  headerClassName?: string;
}

/**
 * Drop-in shell that combines the most common blueprint patterns: a header
 * with brand + workforce selector + actions, plus the chat thread occupying
 * the remaining vertical space. Falls back to `<TimbalChat>` directly when
 * `workforceId` is provided.
 */
export const TimbalChatShell: FC<TimbalChatShellProps> = ({
  workforceId,
  brand,
  headerActions,
  hideWorkforceSelector,
  className,
  headerClassName,
  baseUrl,
  fetch,
  ...chatProps
}) => {
  const {
    workforces,
    selectedId,
    setSelectedId,
  } = useWorkforces({ baseUrl, fetch });

  const effectiveId = workforceId ?? selectedId;
  const showSelector =
    !hideWorkforceSelector && !workforceId && workforces.length > 0;

  return (
    <div
      className={cn(
        "aui-chat-shell flex h-screen flex-col overflow-hidden",
        className,
      )}
    >
      <header
        className={cn(
          "aui-chat-shell-header flex shrink-0 items-center justify-between border-b border-border/50 bg-background/90 px-5 py-2 backdrop-blur-md",
          headerClassName,
        )}
      >
        <div className="flex items-center">
          {brand}
          {showSelector && (
            <>
              <div className="mx-3.5 h-3.5 w-px bg-border" />
              <WorkforceSelector
                workforces={workforces}
                value={selectedId}
                onChange={setSelectedId}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">{headerActions}</div>
      </header>

      <TimbalChat
        key={effectiveId}
        workforceId={effectiveId}
        baseUrl={baseUrl}
        fetch={fetch}
        className="min-h-0 flex-1"
        {...chatProps}
      />
    </div>
  );
};
