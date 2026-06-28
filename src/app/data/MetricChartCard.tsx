"use client";

import { useId, useState, type FC, type ReactNode } from "react";

import { LineAreaChart, type ChartVariant } from "../../charts/line-area-chart";
import { APP_DENSITY_CHART_HEIGHT } from "../../design/app-density";
import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../utils";
import { useAppDensity, useAppDensityClass } from "../layout/app-density-context";
import { MetricTile, type MetricTileProps } from "./MetricTile";
import {
  MetricCardHeader,
  metricCardShellClass,
  metricTilesGridColsClass,
  metricTilesRowClass,
} from "./metrics-shared";

export interface MetricChartMetric {
  id: string;
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  trend?: ReactNode;
  trendTone?: MetricTileProps["trendTone"];
  trendVariant?: MetricTileProps["trendVariant"];
  activeTone?: MetricTileProps["activeTone"];
  sparklineData?: MetricTileProps["sparklineData"];
  sparklineConfig?: MetricTileProps["sparklineConfig"];
  sparkline?: MetricTileProps["sparkline"];
  /** Time-series for this metric, shown in the chart when selected. */
  data?: Array<Record<string, unknown>>;
  /** Value field within `data`. Default "value". */
  dataKey?: string;
  /** Line/area color for this metric. Defaults to the chart palette. */
  color?: string;
}

export interface MetricChartCardProps {
  title?: ReactNode;
  titleTag?: ReactNode;
  description?: ReactNode;
  /** Trailing header control (e.g. a "See detail" link/button). */
  actions?: ReactNode;
  metrics: MetricChartMetric[];
  /** Controlled selected metric id. */
  activeMetricId?: string;
  defaultActiveMetricId?: string;
  onMetricChange?: (id: string) => void;
  /** x-axis key shared across metric series. Default "date". */
  xKey?: string;
  variant?: ChartVariant;
  /** Chart plot height in px. Default 300 (platform overview). */
  height?: number;
  formatX?: (raw: unknown, index: number) => string;
  formatValue?: (value: number) => string;
  /** Shown when the active metric has no data. */
  emptyLabel?: ReactNode;
  /** Accessible name for the selectable KPI tile group. */
  metricsAriaLabel?: string;
  /** Render skeleton tiles + chart while data loads. */
  loading?: boolean;
  className?: string;
}

/**
 * Analytics card: selectable KPI row over a flush area chart —
 * timbal-platform `MetricsRowCard` / Studio analytics pattern.
 * Fully supports background sparklines and rich inline trend metadata.
 */
export const MetricChartCard: FC<MetricChartCardProps> = ({
  title,
  titleTag,
  description,
  actions,
  metrics,
  activeMetricId,
  defaultActiveMetricId,
  onMetricChange,
  xKey = "date",
  variant = "area",
  height: heightProp,
  formatX,
  formatValue,
  emptyLabel = "No data yet",
  metricsAriaLabel = "Metrics",
  loading = false,
  className,
}) => {
  const density = useAppDensity();
  const height = heightProp ?? APP_DENSITY_CHART_HEIGHT[density];
  const metricChartRegionClass = useAppDensityClass("metricChartRegion");
  const metricTileClass = useAppDensityClass("metricTile");
  const titleId = useId();
  const [internalId, setInternalId] = useState(
    defaultActiveMetricId ?? metrics[0]?.id,
  );
  const activeId = activeMetricId ?? internalId;
  const active = metrics.find((m) => m.id === activeId) ?? metrics[0];

  const select = (id: string) => {
    if (activeMetricId == null) setInternalId(id);
    onMetricChange?.(id);
  };

  const hasHeader = Boolean(title || titleTag || description || actions);

  const chartAriaLabel =
    typeof active?.label === "string"
      ? `${active.label} over time`
      : "Metric chart";

  return (
    <section
      className={cn(metricCardShellClass, className)}
      aria-labelledby={title ? titleId : undefined}
    >
      <MetricCardHeader
        title={title}
        titleTag={titleTag}
        description={description}
        actions={actions}
        titleId={titleId}
      />

      <div
        role="group"
        aria-label={metricsAriaLabel}
        aria-busy={loading || undefined}
        className={cn(
          metricTilesRowClass,
          metricTilesGridColsClass(loading ? metrics.length || 4 : metrics.length),
          hasHeader && "mt-3.5 border-t border-border/40",
        )}
      >
        {loading
          ? Array.from({ length: metrics.length || 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className={cn("flex min-w-0 flex-1 flex-col gap-2", metricTileClass)}
                aria-hidden
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : metrics.map((m, index) => (
              <MetricTile
                key={m.id}
                label={m.label}
                value={m.value}
                unit={m.unit}
                trend={m.trend}
                trendTone={m.trendTone}
                trendVariant={m.trendVariant}
                activeTone={m.activeTone}
                sparklineData={m.sparklineData}
                sparklineConfig={m.sparklineConfig}
                sparkline={m.sparkline}
                active={m.id === active?.id}
                showDivider={index < metrics.length - 1}
                onSelect={() => select(m.id)}
              />
            ))}
      </div>

      <div className={metricChartRegionClass} aria-live="polite" aria-atomic="true">
        {loading ? (
          <Skeleton
            className="w-full rounded-lg"
            style={{ height }}
            aria-hidden
          />
        ) : active?.data && active.data.length > 0 ? (
          <LineAreaChart
            key={active.id}
            data={active.data}
            xKey={xKey}
            series={[
              {
                dataKey: active.dataKey ?? "value",
                label: typeof active.label === "string" ? active.label : active.id,
                color: active.color,
              },
            ]}
            variant={variant}
            layout="flush"
            height={height}
            formatX={formatX}
            formatValue={formatValue}
            ariaLabel={chartAriaLabel}
          />
        ) : (
          <div
            className="flex w-full items-center justify-center text-sm font-normal text-muted-foreground"
            style={{ height }}
            role="status"
          >
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
};
