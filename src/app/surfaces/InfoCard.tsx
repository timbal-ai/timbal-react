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

export interface InfoCardProps {
  title?: ReactNode;
  children?: ReactNode;
  /** Leading icon node. */
  icon?: ReactNode;
  /** Trailing CTA / action. */
  action?: ReactNode;
  tone?: InfoCardTone;
  className?: string;
}

/**
 * Soft info / callout panel with optional icon, title, body and CTA. For tips,
 * empty hints, upsell nudges, and read-only notices.
 */
export const InfoCard: FC<InfoCardProps> = ({
  title,
  children,
  icon,
  action,
  tone = "neutral",
  className,
}) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-xl border p-4",
      toneClass[tone],
      className,
    )}
  >
    {icon ? <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span> : null}
    <div className="min-w-0 flex-1">
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
  </div>
);
