"use client";

import { useId, useState, type FC } from "react";

import { MetricTile, type MetricTileProps } from "./MetricTile";
import {
  MetricCardHeader,
  metricCardShellClass,
  metricTilesGridColsClass,
  metricTilesRowClass,
} from "./metrics-shared";
import type { MetricCardHeaderProps } from "./metrics-shared";
import { cn } from "../../utils";

export interface MetricRowItem {
  id: string;
  label: MetricTileProps["label"];
  value: MetricTileProps["value"];
  unit?: MetricTileProps["unit"];
  trend?: MetricTileProps["trend"];
  trendTone?: MetricTileProps["trendTone"];
}

export interface MetricRowProps extends MetricCardHeaderProps {
  metrics: MetricRowItem[];
  /** When set, tiles are selectable and call `onMetricChange`. */
  activeMetricId?: string;
  defaultActiveMetricId?: string;
  onMetricChange?: (id: string) => void;
  /** Accessible name for the KPI tile group (when tiles are selectable). */
  metricsAriaLabel?: string;
  className?: string;
}

/**
 * Platform-style KPI strip in one elevated card — no chart.
 * Use for overview rows; pair with `MetricChartCard` when you need the plot below.
 */
export const MetricRow: FC<MetricRowProps> = ({
  title,
  description,
  actions,
  metrics,
  activeMetricId,
  defaultActiveMetricId,
  onMetricChange,
  metricsAriaLabel = "Metrics",
  className,
}) => {
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
        role={selectable ? "group" : undefined}
        aria-label={selectable ? metricsAriaLabel : undefined}
        className={cn(
          metricTilesRowClass,
          metricTilesGridColsClass(metrics.length),
          (title || description || actions) && "mt-3",
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
