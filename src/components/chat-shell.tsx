"use client";

import { type FC, type ReactNode } from "react";

import { TimbalChat, type TimbalChatProps } from "./chat";
import { WorkforceSelector } from "./workforce-selector";
import { useWorkforces } from "../hooks/use-workforces";
import { studioChromeShellStyle } from "../design/tokens";
import { studioPlaygroundGradientClass } from "../design/classes";
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
 * Drop-in shell that wraps `TimbalChat` with the Studio playground chrome:
 * floating topbar with brand + workforce selector + actions, soft gradient
 * background, and the chat thread filling the remaining vertical space.
 *
 * Falls back to picking the first available workforce when `workforceId`
 * isn't supplied.
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
  const { workforces, selectedId, setSelectedId } = useWorkforces({
    baseUrl,
    fetch,
  });

  const effectiveId = workforceId ?? selectedId;
  const showSelector =
    !hideWorkforceSelector && !workforceId && workforces.length > 0;

  return (
    <div
      className={cn(
        "aui-chat-shell relative flex h-dvh flex-col overflow-hidden bg-background",
        className,
      )}
      style={studioChromeShellStyle}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0",
          studioPlaygroundGradientClass,
        )}
        aria-hidden
      />

      <header
        className={cn(
          "aui-chat-shell-header relative z-10 flex shrink-0 items-center justify-between px-4 pt-[var(--studio-topbar-gap)] pb-2",
          headerClassName,
        )}
        style={{ minHeight: "var(--studio-topbar-height)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {brand}
          {showSelector && (
            <WorkforceSelector
              workforces={workforces}
              value={selectedId}
              onChange={setSelectedId}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
      </header>

      <TimbalChat
        key={effectiveId}
        workforceId={effectiveId}
        baseUrl={baseUrl}
        fetch={fetch}
        className="relative z-10 min-h-0 flex-1"
        {...chatProps}
      />
    </div>
  );
};
