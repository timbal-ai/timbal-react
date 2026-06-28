"use client";

import type { FC, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { TIMBAL_V2_ELEVATED_GRADIENT } from "../../design/button-tokens";
import { cn } from "../../utils";
import { StatusBadge, type StatusBadgeTone } from "./StatusBadge";

export interface AlertCardProps {
  /** The primary title/heading of the alert. */
  title: ReactNode;
  /** Detailed description or content of the alert. */
  description?: ReactNode;
  /** Optional category badge/tag label. */
  category?: ReactNode;
  /** Tone for the category badge. Default `"default"`. */
  categoryTone?: StatusBadgeTone;
  /** Optional status badge/tag label. */
  status?: ReactNode;
  /** Tone for the status badge. Default `"default"`. */
  statusTone?: StatusBadgeTone;
  /** Optional guided action description. If provided, renders with a bold "Action:" prefix at the bottom. */
  action?: ReactNode;
  /** Custom trailing element on the right. If omitted and `onClick` is provided, a chevron-right is rendered. */
  trailing?: ReactNode;
  /** Whole-card click handler. When provided, the card is rendered as an interactive button. */
  onClick?: () => void;
  /** Accessible name for the card button when interactive. */
  ariaLabel?: string;
  className?: string;
}

const alertCardShellClass = cn(
  "flex flex-col rounded-2xl p-4 text-left font-normal border border-border shadow-card",
  TIMBAL_V2_ELEVATED_GRADIENT,
);

const alertCardInteractiveClass = cn(
  "flex flex-col rounded-2xl p-4 text-left font-normal border border-border shadow-card cursor-pointer",
  TIMBAL_V2_ELEVATED_GRADIENT,
  "transition-[background-color,box-shadow,border-color] duration-150 ease-in-out",
  "hover:border-foreground/20",
  "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
  "active:from-secondary-fill-active-from active:to-secondary-fill-active-to",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/**
 * Standardized Alert / Action card component.
 *
 * Admits category and status tags, clear titles, descriptive bodies, and automated action
 * footers, keeping generated UIs beautiful and highly guided.
 * Fully interactive with safe, neutral-colored hover transitions.
 */
export const AlertCard: FC<AlertCardProps> = ({
  title,
  description,
  category,
  categoryTone = "default",
  status,
  statusTone = "default",
  action,
  trailing,
  onClick,
  ariaLabel,
  className,
}) => {
  const showTags = Boolean(category || status);
  const showTrailing = Boolean(trailing || onClick);

  const bodyContent = (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {showTags ? (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {category ? (
            <StatusBadge tone={categoryTone}>{category}</StatusBadge>
          ) : null}
          {status ? (
            <StatusBadge tone={statusTone}>{status}</StatusBadge>
          ) : null}
        </div>
      ) : null}

      <h4 className="text-sm font-medium leading-snug text-foreground">{title}</h4>

      {description ? (
        <p className="mt-1.5 text-xs text-muted-foreground leading-normal">{description}</p>
      ) : null}

      {action ? (
        <div className="mt-auto pt-3 text-xs text-muted-foreground/90 leading-normal">
          <strong className="font-semibold text-foreground/80">Action: </strong>
          {action}
        </div>
      ) : null}
    </div>
  );

  const cardContent = (
    <div className="flex items-start justify-between gap-4 w-full h-full">
      {bodyContent}
      {showTrailing ? (
        <div className="shrink-0 flex items-center justify-center self-center text-muted-foreground/50">
          {trailing || <ChevronRight className="size-4" />}
        </div>
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(alertCardInteractiveClass, className)}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <article className={cn(alertCardShellClass, className)}>
      {cardContent}
    </article>
  );
};
