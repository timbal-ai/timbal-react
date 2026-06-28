"use client";

import type { FC, ReactNode } from "react";

import { TIMBAL_V2_ELEVATED_SURFACE, TIMBAL_V2_LOGO_TILE } from "../../design/button-tokens";
import { cn } from "../../utils";

export interface ResourceCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Logo / icon node, rendered in a rounded tile. */
  media?: ReactNode;
  /** Status pill or badge (top-right). */
  badge?: ReactNode;
  /** Footer metadata (e.g. last updated, owner). */
  footer?: ReactNode;
  /** Trailing action in the footer (e.g. sparkline, menu). */
  action?: ReactNode;
  /** Whole-card click — makes the card a button. */
  onClick?: () => void;
  /** Accessible name when `title` is not plain text. */
  ariaLabel?: string;
  className?: string;
  /** Visual variant of the card. Default `"default"` (elevated gradient). */
  variant?: "default" | "flat" | "outline";
  /** Shape of the media container. Default `"circle"`. */
  avatarShape?: "circle" | "rounded";
}

const mediaShellClass = cn(
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-normal text-foreground",
  TIMBAL_V2_LOGO_TILE,
);

const resourceCardInteractiveClass = cn(
  "flex min-h-[8.5rem] flex-col rounded-2xl p-4 text-left font-normal border border-border shadow-card",
  TIMBAL_V2_ELEVATED_SURFACE,
);

/**
 * Project / agent / dataset card — same elevated surface as integration catalog tiles.
 */
export const ResourceCard: FC<ResourceCardProps> = ({
  title,
  subtitle,
  media,
  badge,
  footer,
  action,
  onClick,
  ariaLabel,
  className,
  variant = "flat",
  avatarShape = "circle",
}) => {
  const isInteractive = Boolean(onClick);

  const shellClass = cn(
    "flex min-h-[8.5rem] flex-col rounded-2xl p-5 text-left font-normal transition-all duration-200",
    variant === "default" && TIMBAL_V2_ELEVATED_SURFACE,
    variant === "flat" && "border border-border/50 bg-card/65 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.01)] hover:border-border hover:shadow-md dark:bg-card/45",
    variant === "outline" && "border border-border/70 bg-transparent shadow-none hover:bg-muted/5",
    isInteractive && "cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  const dynamicMediaShellClass = cn(
    "flex size-10 shrink-0 items-center justify-center overflow-hidden text-sm font-normal text-foreground transition-all duration-200",
    avatarShape === "circle" ? "rounded-full" : "rounded-xl",
    TIMBAL_V2_LOGO_TILE,
  );

  const body = (
    <>
      <div className="flex items-start gap-3">
        {media ? <span className={dynamicMediaShellClass}>{media}</span> : null}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-sm font-semibold leading-snug text-foreground tracking-tight">{title}</p>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-xs font-normal text-muted-foreground/90 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
        {badge ? <span className="shrink-0 pt-0.5">{badge}</span> : null}
      </div>
      {footer || action ? (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs font-normal text-muted-foreground">
          <span className="min-w-0 truncate">{footer}</span>
          {action ? <span className="shrink-0 opacity-90">{action}</span> : null}
        </div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(shellClass, className)}
      >
        {body}
      </button>
    );
  }

  return (
    <article className={cn(shellClass, className)}>
      {body}
    </article>
  );
};
