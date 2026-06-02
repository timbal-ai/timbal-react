"use client";

import { useId, type FC, type ReactNode } from "react";

import { ChartArtifactView } from "../../artifacts/chart-artifact";
import type { ChartArtifact } from "../../artifacts/types";
import { cn } from "../../utils";
import {
  MetricCardHeader,
  metricCardShellClass,
  metricChartPlotRegionClass,
} from "./metrics-shared";

export interface ChartPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Built-in SVG chart — alternative to custom `children`. */
  artifact?: ChartArtifact;
  children?: ReactNode;
  actions?: ReactNode;
  /** Plot height in px. Default 300 (same as `MetricChartCard`). */
  height?: number;
  className?: string;
}

/**
 * Chart shell matching `MetricChartCard` — title row with side padding, flush
 * plot edge-to-edge with only top inset on the chart region.
 */
export const ChartPanel: FC<ChartPanelProps> = ({
  title,
  description,
  artifact,
  children,
  actions,
  height = 300,
  className,
}) => {
  const titleId = useId();
  const resolvedTitle = title ?? artifact?.title;
  const hasHeader = Boolean(resolvedTitle || description || actions);

  const body =
    children ??
    (artifact ? (
      <ChartArtifactView artifact={artifact} embedded height={height} />
    ) : null);

  return (
    <section
      className={cn(metricCardShellClass, "aui-app-chart-panel", className)}
      aria-labelledby={resolvedTitle ? titleId : undefined}
    >
      <MetricCardHeader
        title={resolvedTitle}
        titleId={titleId}
        description={description}
        actions={actions}
      />

      <div
        className={cn(
          "relative min-h-0 w-full",
          hasHeader ? metricChartPlotRegionClass : "pt-2 pb-3",
        )}
      >
        {body ?? (
          <div
            className="flex items-center justify-center text-sm font-normal text-muted-foreground"
            style={{ minHeight: height }}
            role="status"
          >
            No chart
          </div>
        )}
      </div>
    </section>
  );
};
