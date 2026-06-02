"use client";

import type { FC, ReactNode } from "react";

import { studioIntegrationCardClass } from "../../design/classes";
import { cn } from "../../utils";

/** Analytics / infrastructure card shell — platform `getOverviewMetricsSurfaceClass`. */
export const metricCardShellClass = cn(
  studioIntegrationCardClass,
  "aui-app-metric-card shadow-none",
  "flex flex-col overflow-hidden",
);

export const metricCardHeaderClass =
  "flex items-start justify-between gap-3 px-4 pb-1 pt-3";

export const metricTilesRowClass = "grid w-full min-w-0";

/** Chart below a KPI tile row (`MetricChartCard`). */
export const metricChartRegionClass =
  "relative min-h-0 w-full border-t border-border/40 pt-2";

/** Chart-only panel (`ChartPanel`) — extra inset below the title so grid/curve never crowds the heading. */
export const metricChartPlotRegionClass =
  "relative min-h-0 w-full border-t border-border/40 px-0 pt-5 pb-3";

export const metricCellDividerClass = "border-r border-border/40";

export interface MetricCardHeaderProps {
  title?: ReactNode;
  /** Hook for `aria-labelledby` on the parent card `<section>`. */
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export const MetricCardHeader: FC<MetricCardHeaderProps> = ({
  title,
  titleId,
  description,
  actions,
}) => {
  if (!title && !description && !actions) return null;

  return (
    <header className={metricCardHeaderClass}>
      <div className="min-w-0">
        {title ? (
          <h3 id={titleId} className="text-base font-normal text-foreground">
            {title}
          </h3>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
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
    case 5:
      return "grid-cols-2 sm:grid-cols-5";
    case 6:
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
    default:
      return "grid-cols-2 md:grid-cols-4";
  }
}
