"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export type PlanBadgeTone = "free" | "pro" | "enterprise" | "beta" | "soon";

/** Neutral plan chip — matches platform `IntegrationPlanBadge` (no loud tier colors). */
const planBadgeClass =
  "inline-flex h-5 max-w-full shrink-0 items-center rounded-md border border-border bg-muted/90 px-2 text-[11px] font-normal text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground";

export interface PlanBadgeProps {
  /** Kept for API compatibility; styling is neutral for all tiers. */
  tone?: PlanBadgeTone;
  children: ReactNode;
  className?: string;
}

/** Small plan / tier chip on integration catalog cards. */
export const PlanBadge: FC<PlanBadgeProps> = ({ children, className }) => (
  <span className={cn(planBadgeClass, className)}>{children}</span>
);
