"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

const statusBadgeToneClass = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  muted: "bg-muted/80 text-muted-foreground",
} as const;

export type StatusBadgeTone = keyof typeof statusBadgeToneClass;

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  children,
  tone = "default",
  className,
}) => {
  return (
    <span
      className={cn(
        "aui-app-status-badge inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusBadgeToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};
