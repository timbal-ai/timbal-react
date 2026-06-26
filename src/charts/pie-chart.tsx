"use client";

import { useId, type FC, type ReactNode } from "react";
import { Cell, Label, Pie, PieChart as RePieChart } from "recharts";

import { cn } from "../utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { ChartCenterLabel } from "./chart-center-label";
import { pieGradientId, PieGradientDefs } from "./chart-gradients";
import { CHART_PALETTE, type ChartTooltipIndicator } from "./line-area-chart";
import { toNum } from "./geometry";

export interface PieChartProps {
  data: Array<Record<string, unknown>>;
  /** Category / label key. Inferred from the first non-numeric field if omitted. */
  nameKey?: string;
  /** Value key. Default "value". */
  dataKey?: string;
  /** Donut hole radius as a fraction of the outer radius (0 = full pie). Default 0. */
  innerRadius?: number;
  /** Per-slice colors. Defaults to the theme palette. */
  colors?: string[];
  /** Plot height in px. Default 260. */
  height?: number;
  /** Show the slice legend below the chart. Default true. */
  showLegend?: boolean;
  /** Show value labels on each slice. Default false. */
  showLabels?: boolean;
  showTooltip?: boolean;
  tooltipIndicator?: ChartTooltipIndicator;
  /** Big number drawn in the donut hole (e.g. the total). Requires `innerRadius > 0`. */
  centerValue?: ReactNode;
  /** Caption under `centerValue`. */
  centerLabel?: ReactNode;
  unit?: string;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Pie / donut chart on recharts. Pass `innerRadius` (0–1 fraction) for a donut
 * and `centerValue` / `centerLabel` to fill the hole with a KPI. Slice colors
 * come from the theme `--chart-N` palette (or `colors`).
 */
export const PieChart: FC<PieChartProps> = ({
  data,
  nameKey: nameKeyProp,
  dataKey = "value",
  innerRadius = 0,
  colors,
  height = 260,
  showLegend = true,
  showLabels = false,
  showTooltip = true,
  tooltipIndicator = "dot",
  centerValue,
  centerLabel,
  className,
  ariaLabel = "Pie chart",
}) => {
  const gradientScopeId = useId().replace(/:/g, "");
  const nameKey = nameKeyProp ?? inferNameKey(data, dataKey);
  const palette = colors ?? CHART_PALETTE;

  if (data.length === 0) {
    return <PieEmpty className={className} height={height} ariaLabel={ariaLabel} />;
  }

  const slices = data.map((d, i) => ({
    name: String(d[nameKey] ?? i),
    value: toNum(d[dataKey]),
    fill: palette[i % palette.length],
  }));

  // Config carries readable labels + the resolved slice color so the legend and
  // tooltip swatches render (the Cell fill is an SVG gradient `url(#…)`, which is
  // not a valid CSS color for the swatch).
  const config: ChartConfig = {};
  for (const s of slices) config[s.name] = { label: s.name, color: s.fill };

  const innerPct = innerRadius > 0 ? `${Math.round(innerRadius * 75)}%` : 0;
  const hasCenter = innerRadius > 0 && (centerValue != null || centerLabel != null);

  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={ariaLabel}
      className={cn("aspect-auto w-full", className)}
      style={{ height }}
    >
      <RePieChart>
        <PieGradientDefs
          scopeId={gradientScopeId}
          slices={slices.map((s) => ({ key: s.name, color: s.fill }))}
        />
        {showTooltip && (
          <ChartTooltip
            content={<ChartTooltipContent nameKey="name" indicator={tooltipIndicator} hideLabel />}
          />
        )}
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          innerRadius={innerPct}
          outerRadius="75%"
          paddingAngle={innerRadius > 0 ? 2 : 0}
          strokeWidth={2}
          label={showLabels}
          isAnimationActive
        >
          {slices.map((s) => (
            <Cell key={s.name} fill={`url(#${pieGradientId(gradientScopeId, s.name)})`} />
          ))}
          {hasCenter && (
            <Label
              position="center"
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <ChartCenterLabel
                    cx={cx}
                    cy={cy}
                    value={centerValue}
                    label={centerLabel}
                  />
                );
              }}
            />
          )}
        </Pie>
        {showLegend && <ChartLegend content={<ChartLegendContent nameKey="name" />} />}
      </RePieChart>
    </ChartContainer>
  );
};

const PieEmpty: FC<{ className?: string; height: number; ariaLabel: string }> = ({
  className,
  height,
  ariaLabel,
}) => (
  <div
    className={cn("flex w-full items-center justify-center text-xs text-muted-foreground", className)}
    style={{ height }}
    role="img"
    aria-label={ariaLabel}
  >
    No data yet
  </div>
);

function inferNameKey(data: Array<Record<string, unknown>>, dataKey: string): string {
  if (data.length === 0) return "name";
  for (const k of Object.keys(data[0])) {
    if (k !== dataKey && typeof data[0][k] !== "number") return k;
  }
  return Object.keys(data[0]).find((k) => k !== dataKey) ?? "name";
}
