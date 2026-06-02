"use client";

import type { FC, ReactNode } from "react";

import { TIMBAL_V2_ELEVATED_SURFACE, TIMBAL_V2_LOGO_TILE } from "../../design/button-tokens";
import { cn } from "../../utils";

export interface ConnectionRowProps {
  name: ReactNode;
  /** Logo / icon node, rendered in a small rounded tile. */
  logo?: ReactNode;
  /** Secondary line under the name (account, scope, last sync…). */
  meta?: ReactNode;
  /** Status / type pill on the right (e.g. a `StatusBadge` or `PlanBadge`). */
  badge?: ReactNode;
  /** Trailing action(s) — manage, disconnect, overflow menu. */
  action?: ReactNode;
  onClick?: () => void;
  /** Accessible name when `name` is not plain text. */
  ariaLabel?: string;
  className?: string;
}

const logoShellClass = cn(
  "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg",
  TIMBAL_V2_LOGO_TILE,
);

/**
 * One connected provider as a horizontal row. Wrap rows in a container with
 * `TIMBAL_V2_SECONDARY_CHROME` + `divide-y divide-border` for a single elevated panel.
 */
export const ConnectionRow: FC<ConnectionRowProps> = ({
  name,
  logo,
  meta,
  badge,
  action,
  onClick,
  ariaLabel,
  className,
}) => {
  const inner = (
    <>
      {logo ? <span className={logoShellClass}>{logo}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-normal text-foreground">{name}</p>
        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      {badge ? <span className="shrink-0">{badge}</span> : null}
      {action ? <span className="shrink-0">{action}</span> : null}
    </>
  );

  const rowClass = cn(
    "flex w-full items-center gap-3 px-4 py-3 text-left",
    onClick &&
      "cursor-pointer bg-transparent hover:bg-transparent active:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/10",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        role="listitem"
        onClick={onClick}
        aria-label={ariaLabel}
        className={rowClass}
      >
        {inner}
      </button>
    );
  }

  return (
    <div role="listitem" className={rowClass}>
      {inner}
    </div>
  );
};

/** List shell for stacked `ConnectionRow`s — one elevated secondary surface. */
export const connectionRowListClass = cn(
  "overflow-hidden rounded-2xl",
  TIMBAL_V2_ELEVATED_SURFACE,
);
