"use client";

import type { FC, ReactNode } from "react";

import { studioIntegrationCardClass } from "../../design/classes";
import { cn } from "../../utils";
import { useAppDensityClass } from "../layout/app-density-context";

/** Analytics / infrastructure card shell — platform `getOverviewMetricsSurfaceClass`. */
export const metricCardShellClass = cn(
  studioIntegrationCardClass,
  "aui-app-metric-card shadow-none",
  "flex flex-col overflow-hidden",
);

export const metricTilesRowClass = "grid w-full min-w-0";

export const metricCellDividerClass = "border-r border-border/40";

export interface MetricCardHeaderProps {
  title?: ReactNode;
  /** Tag or label next to the title (e.g. "Last 24 hours"). */
  titleTag?: ReactNode;
  /** Hook for `aria-labelledby` on the parent card `<section>`. */
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export const MetricCardHeader: FC<MetricCardHeaderProps> = ({
  title,
  titleTag,
  titleId,
  description,
  actions,
}) => {
  const headerClass = useAppDensityClass("metricCardHeader");

  if (!title && !description && !actions) return null;

  return (
    <header className={cn(headerClass, "items-center")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {title ? (
            <h3 id={titleId} className="text-sm font-semibold text-foreground tracking-tight select-none">
              {title}
            </h3>
          ) : null}
          {titleTag ? (
            <span className="inline-flex rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 tracking-tight leading-none select-none">
              {titleTag}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground leading-normal select-none">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex items-center">{actions}</div> : null}
    </header>
  );
};

export function metricTilesGridColsClass(n: number): string {
  switch (n) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-2 md:grid-cols-4";
    case 5:
      return "grid-cols-2 sm:grid-cols-5";
    case 6:
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
    default:
      return "grid-cols-2 md:grid-cols-4";
  }
}
