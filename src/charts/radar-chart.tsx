"use client";

import { type FC } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as ReRadarChart,
} from "recharts";

import { cn } from "../utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { CHART_PALETTE, type ChartSeries } from "./line-area-chart";

export interface RadarChartProps {
  data: Array<Record<string, unknown>>;
  /** Axis (category) key. Inferred from the first non-numeric field if omitted. */
  nameKey?: string;
  /** Series to plot. Strings are shorthand for `{ dataKey }`. Inferred if omitted. */
  series?: Array<ChartSeries | string>;
  /** Value at the outer edge. Default: the data max. */
  maxValue?: number;
  /** Number of concentric grid rings. Default 4. */
  rings?: number;
  height?: number;
  showLegend?: boolean;
  /** Fill the series polygons with a soft tint. Default true. */
  fill?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Radar (spider) chart on recharts — one axis per data point, one polygon per
 * series. Theme-driven colors. Good for comparing a handful of metrics across
 * two or three entities.
 */
export const RadarChart: FC<RadarChartProps> = ({
  data,
  nameKey: nameKeyProp,
  series: seriesProp,
  maxValue,
  height = 280,
  showLegend = true,
  fill = true,
  className,
  ariaLabel = "Radar chart",
}) => {
  const nameKey = nameKeyProp ?? inferNameKey(data);
  const series = resolveSeries(seriesProp, data, nameKey);

  if (data.length < 3 || series.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
      >
        Radar needs at least 3 axes
      </div>
    );
  }

  const config: ChartConfig = {};
  series.forEach((s, i) => {
    config[s.dataKey] = {
      label: s.label ?? s.dataKey,
      color: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });

  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={ariaLabel}
      className={cn("mx-auto aspect-square", className)}
      style={{ height }}
    >
      <ReRadarChart data={data} outerRadius="70%">
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <PolarGrid />
        <PolarAngleAxis
          dataKey={nameKey}
          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
        />
        {series.map((s) => (
          <Radar
            key={s.dataKey}
            dataKey={s.dataKey}
            stroke={`var(--color-${s.dataKey})`}
            fill={`var(--color-${s.dataKey})`}
            fillOpacity={fill ? 0.18 : 0}
            strokeWidth={2}
            dot={{ r: 2.5, fillOpacity: 1 }}
            isAnimationActive
          />
        ))}
        {showLegend && series.length > 1 && (
          <ChartLegend content={<ChartLegendContent />} />
        )}
      </ReRadarChart>
    </ChartContainer>
  );
};

function inferNameKey(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return "name";
  for (const k of Object.keys(data[0])) {
    if (typeof data[0][k] !== "number") return k;
  }
  return Object.keys(data[0])[0] ?? "name";
}

function resolveSeries(
  seriesProp: Array<ChartSeries | string> | undefined,
  data: Array<Record<string, unknown>>,
  nameKey: string,
): ChartSeries[] {
  if (seriesProp && seriesProp.length > 0) {
    return seriesProp.map((s) => (typeof s === "string" ? { dataKey: s } : s));
  }
  if (data.length === 0) return [];
  return Object.keys(data[0])
    .filter((k) => k !== nameKey && typeof data[0][k] === "number")
    .map((dataKey) => ({ dataKey }));
}
