"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

/**
 * Tone skin — a soft tint, a matching foreground, and an inset hairline ring so
 * the pill reads as a deliberate object rather than faint colored text. The dot
 * (when enabled) uses an opaque version of the same hue.
 */
const statusBadgeToneClass = {
  default: "bg-muted text-foreground ring-border",
  primary: "bg-primary/10 text-primary ring-primary/20",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  warn: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  muted: "bg-muted/70 text-muted-foreground ring-border/60",
} as const;

const statusBadgeDotClass = {
  default: "bg-foreground/40",
  primary: "bg-primary",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/60",
} as const;

export type StatusBadgeTone = keyof typeof statusBadgeToneClass;

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusBadgeTone;
  /** Render a small leading status dot in the tone color. */
  dot?: boolean;
  className?: string;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  children,
  tone = "default",
  dot = false,
  className,
}) => {
  return (
    <span
      className={cn(
        "aui-app-status-badge inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "text-xs font-medium leading-none ring-1 ring-inset",
        statusBadgeToneClass[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            statusBadgeDotClass[tone],
          )}
        />
      ) : null}
      {children}
    </span>
  );
};
