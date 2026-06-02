"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export type StatusDotTone = "online" | "busy" | "offline" | "error" | "neutral";

const dotClass: Record<StatusDotTone, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  offline: "bg-muted-foreground/50",
  error: "bg-destructive",
  neutral: "bg-muted-foreground",
};

export interface StatusDotProps {
  tone?: StatusDotTone;
  /** Optional label rendered to the right of the dot. */
  label?: ReactNode;
  /** Soft pulse halo for live/online states. */
  pulse?: boolean;
  className?: string;
}

/** Tiny status indicator dot, optionally labeled and pulsing. */
export const StatusDot: FC<StatusDotProps> = ({
  tone = "neutral",
  label,
  pulse = false,
  className,
}) => (
  <span className={cn("inline-flex items-center gap-1.5", className)}>
    <span className="relative flex size-2">
      {pulse ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            dotClass[tone],
          )}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2 rounded-full", dotClass[tone])} />
    </span>
    {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
  </span>
);
