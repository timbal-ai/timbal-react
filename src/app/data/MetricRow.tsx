"use client";

import { useId, useState, type FC, type ReactNode } from "react";

import { Skeleton } from "../../ui/skeleton";
import { cn } from "../../utils";
import { useAppDensityClass } from "../layout/app-density-context";
import { MetricTile, type MetricTileProps } from "./MetricTile";
import {
  MetricCardHeader,
  metricCardShellClass,
  metricTilesGridColsClass,
  metricTilesRowClass,
  type MetricCardHeaderProps,
} from "./metrics-shared";

export interface MetricRowItem {
  id: string;
  label: MetricTileProps["label"];
  value: MetricTileProps["value"];
  unit?: MetricTileProps["unit"];
  trend?: MetricTileProps["trend"];
  trendTone?: MetricTileProps["trendTone"];
  trendVariant?: MetricTileProps["trendVariant"];
  activeTone?: MetricTileProps["activeTone"];
  sparklineData?: MetricTileProps["sparklineData"];
  sparklineConfig?: MetricTileProps["sparklineConfig"];
  sparkline?: MetricTileProps["sparkline"];
}

export interface MetricRowProps extends MetricCardHeaderProps {
  metrics: MetricRowItem[];
  /** When set, tiles are selectable and call `onMetricChange`. */
  activeMetricId?: string;
  defaultActiveMetricId?: string;
  onMetricChange?: (id: string) => void;
  /** Accessible name for the KPI tile group (when tiles are selectable). */
  metricsAriaLabel?: string;
  /** Render skeleton tiles while metrics load. Falls back to `metrics.length || 4`. */
  loading?: boolean;
  className?: string;
}

/**
 * Platform-style KPI strip in one elevated card — no chart.
 * Use for overview rows; pair with `MetricChartCard` when you need the plot below.
 * Fully supports background sparklines and rich inline trend metadata.
 */
export const MetricRow: FC<MetricRowProps> = ({
  title,
  titleTag,
  description,
  actions,
  metrics,
  activeMetricId,
  defaultActiveMetricId,
  onMetricChange,
  metricsAriaLabel = "Metrics",
  loading = false,
  className,
}) => {
  const metricTileClass = useAppDensityClass("metricTile");
  const titleId = useId();
  const selectable = onMetricChange != null || activeMetricId != null;
  const [internalId, setInternalId] = useState(
    defaultActiveMetricId ?? metrics[0]?.id,
  );
  const activeId = activeMetricId ?? internalId;

  const select = (id: string) => {
    if (activeMetricId == null) setInternalId(id);
    onMetricChange?.(id);
  };

  const hasHeader = Boolean(title || titleTag || description || actions);

  return (
    <section
      className={cn(metricCardShellClass, className)}
      aria-labelledby={title ? titleId : undefined}
    >
      <MetricCardHeader
        title={title}
        titleTag={titleTag}
        titleId={titleId}
        description={description}
        actions={actions}
      />
      <div
        role={selectable ? "group" : undefined}
        aria-label={selectable ? metricsAriaLabel : undefined}
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
            active={selectable && m.id === activeId}
            showDivider={index < metrics.length - 1}
            onSelect={
              selectable
                ? () => select(m.id)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
};
