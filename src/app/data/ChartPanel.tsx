"use client";

import { useId, type FC, type ReactNode } from "react";

import { ChartArtifactView } from "../../artifacts/chart-artifact";
import type { ChartArtifact } from "../../artifacts/types";
import { APP_DENSITY_CHART_HEIGHT } from "../../design/app-density";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../utils";
import { useAppDensity, useAppDensityClass } from "../layout/app-density-context";
import {
  MetricCardHeader,
  metricCardShellClass,
} from "./metrics-shared";

export interface ChartPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Built-in SVG chart — alternative to custom `children`. */
  artifact?: ChartArtifact;
  children?: ReactNode;
  actions?: ReactNode;
  /** Plot height in px. Defaults to the active page density (300 default, 220 compact). */
  height?: number;
  /** Render a skeleton at the plot height while data loads. */
  loading?: boolean;
  className?: string;
}

/**
 * A titled card wrapping a single chart — pass a built-in `artifact` or your
 * own chart as `children`. Use this when you just need "a chart in a card."
 *
 * Choosing between the two chart cards:
 * - `ChartPanel` — one chart in a titled shell. The simple, common case.
 * - `MetricChartCard` — a selectable KPI row **above** a chart, where clicking a
 *   metric swaps the series. Use only when you need that interaction.
 *
 * @example
 * ```tsx
 * <ChartPanel title="Revenue" description="Last 6 months">
 *   <LineAreaChart data={rows} xKey="month" series={["revenue"]} />
 * </ChartPanel>
 * ```
 */
export const ChartPanel: FC<ChartPanelProps> = ({
  title,
  description,
  artifact,
  children,
  actions,
  height: heightProp,
  loading = false,
  className,
}) => {
  const density = useAppDensity();
  const height = heightProp ?? APP_DENSITY_CHART_HEIGHT[density];
  const metricChartPlotRegionClass = useAppDensityClass("metricChartPlotRegion");
  const chartPanelBodyClass = useAppDensityClass("chartPanelBody");
  const titleId = useId();
  const resolvedTitle = title ?? artifact?.title;
  const hasHeader = Boolean(resolvedTitle || description || actions);

  // Treat non-renderable children (null/undefined/false/true) as "absent" so a
  // caller's `{cond && <X/>}` guard — which yields `false`, not `undefined` —
  // falls through to the built-in `artifact` instead of clobbering it. Using
  // `children ?? artifact` here would let a `false`-valued child block the
  // artifact (false is not nullish), rendering an empty card with no fallback.
  const hasRenderableChildren =
    children != null && children !== false && children !== true;

  const body = loading ? (
    <Skeleton className="w-full rounded-lg" style={{ height }} aria-hidden />
  ) : hasRenderableChildren ? (
    children
  ) : artifact ? (
    <ChartArtifactView artifact={artifact} embedded height={height} />
  ) : null;

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
          hasHeader ? metricChartPlotRegionClass : chartPanelBodyClass,
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
