"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export type InfoCardTone = "neutral" | "info" | "success" | "warn" | "danger";

const toneClass: Record<InfoCardTone, string> = {
  neutral: "border-border bg-muted/40",
  info: "border-primary/25 bg-primary/5",
  success: "border-emerald-500/25 bg-emerald-500/5",
  warn: "border-amber-500/25 bg-amber-500/5",
  danger: "border-destructive/25 bg-destructive/5",
};

// For vertical layout, we want a premium card look
const toneVerticalClass: Record<InfoCardTone, string> = {
  neutral: "border-border/60 bg-card hover:border-border dark:bg-card/40",
  info: "border-primary/20 bg-primary/5 hover:border-primary/45",
  success: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/45",
  warn: "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/45",
  danger: "border-destructive/20 bg-destructive/5 hover:border-destructive/45",
};

export interface InfoCardProps {
  title?: ReactNode;
  children?: ReactNode;
  /** Leading icon node. */
  icon?: ReactNode;
  /** Trailing CTA / action. */
  action?: ReactNode;
  tone?: InfoCardTone;
  layout?: "horizontal" | "vertical";
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Soft info / callout panel with optional icon, title, body and CTA. For tips,
 * empty hints, upsell nudges, and read-only notices. Supports horizontal and vertical layouts.
 */
export const InfoCard: FC<InfoCardProps> = ({
  title,
  children,
  icon,
  action,
  tone = "neutral",
  layout = "horizontal",
  onClick,
  ariaLabel,
  className,
}) => {
  const isInteractive = Boolean(onClick);
  
  if (layout === "vertical") {
    const cardContent = (
      <>
        {icon ? (
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted/50 border border-border/40 text-muted-foreground/80 transition-transform duration-200 group-hover:scale-105">
            {icon}
          </span>
        ) : null}
        <div className="flex flex-col gap-1.5 w-full text-left">
          {title ? (
            <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">{title}</p>
          ) : null}
          {children ? (
            <div className="text-xs text-muted-foreground leading-relaxed">
              {children}
            </div>
          ) : null}
        </div>
        {action ? <div className="w-full mt-1">{action}</div> : null}
      </>
    );

    const baseClass = cn(
      "group flex flex-col gap-4 items-start rounded-2xl border p-5 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_10px_15px_-3px_rgba(0,0,0,0.01)]",
      toneVerticalClass[tone],
      isInteractive && "cursor-pointer select-none hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    );

    if (isInteractive) {
      return (
        <button type="button" onClick={onClick} aria-label={ariaLabel} className={baseClass}>
          {cardContent}
        </button>
      );
    }

    return (
      <div className={baseClass}>
        {cardContent}
      </div>
    );
  }

  // Horizontal layout
  const horizontalContent = (
    <>
      {icon ? <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span> : null}
      <div className="min-w-0 flex-1 text-left">
        {title ? (
          <p className="text-sm font-medium text-foreground">{title}</p>
        ) : null}
        {children ? (
          <div className={cn("text-sm text-muted-foreground", title && "mt-1")}>
            {children}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </>
  );

  const baseClass = cn(
    "flex items-start gap-3 rounded-xl border p-4 transition-all duration-200",
    toneClass[tone],
    isInteractive && "cursor-pointer select-none hover:bg-muted/30 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );

  if (isInteractive) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={baseClass}>
        {horizontalContent}
      </button>
    );
  }

  return (
    <div className={baseClass}>
      {horizontalContent}
    </div>
  );
};
