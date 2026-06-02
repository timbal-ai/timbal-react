"use client";

import { useId, useState, type FC, type ReactNode } from "react";

import { LineAreaChart, type ChartVariant } from "../../charts/line-area-chart";
import { cn } from "../../utils";
import { MetricTile, type MetricTileProps } from "./MetricTile";
import {
  MetricCardHeader,
  metricCardShellClass,
  metricChartRegionClass,
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
  /** Time-series for this metric, shown in the chart when selected. */
  data?: Array<Record<string, unknown>>;
  /** Value field within `data`. Default "value". */
  dataKey?: string;
  /** Line/area color for this metric. Defaults to the chart palette. */
  color?: string;
}

export interface MetricChartCardProps {
  title?: ReactNode;
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
  className?: string;
}

/**
 * Analytics card: selectable KPI row over a flush area chart —
 * timbal-platform `MetricsRowCard` / Studio analytics pattern.
 */
export const MetricChartCard: FC<MetricChartCardProps> = ({
  title,
  description,
  actions,
  metrics,
  activeMetricId,
  defaultActiveMetricId,
  onMetricChange,
  xKey = "date",
  variant = "area",
  height = 300,
  formatX,
  formatValue,
  emptyLabel = "No data yet",
  metricsAriaLabel = "Metrics",
  className,
}) => {
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

  const hasHeader = Boolean(title || description || actions);

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
        titleId={titleId}
        description={description}
        actions={actions}
      />

      <div
        role="group"
        aria-label={metricsAriaLabel}
        className={cn(
          metricTilesRowClass,
          metricTilesGridColsClass(metrics.length),
          hasHeader && "mt-3",
        )}
      >
        {metrics.map((m, index) => (
          <MetricTile
            key={m.id}
            label={m.label}
            value={m.value}
            unit={m.unit}
            trend={m.trend}
            trendTone={m.trendTone}
            active={m.id === active?.id}
            showDivider={index < metrics.length - 1}
            onSelect={() => select(m.id)}
          />
        ))}
      </div>

      <div className={metricChartRegionClass} aria-live="polite" aria-atomic="true">
        {active?.data && active.data.length > 0 ? (
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
