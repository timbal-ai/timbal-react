"use client";

import { useId, type FC, type ReactNode } from "react";
import {
  Cell,
  Label,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { cn } from "../utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { ChartCenterLabel } from "./chart-center-label";
import { pieGradientId, PieGradientDefs } from "./chart-gradients";
import { CHART_PALETTE } from "./line-area-chart";
import { toNum } from "./geometry";

export interface RadialChartProps {
  data: Array<Record<string, unknown>>;
  /** Category / label key. Inferred from the first non-numeric field if omitted. */
  nameKey?: string;
  /** Value key. Default "value". */
  dataKey?: string;
  /** Value that maps to a full ring. Default: the data max (so the largest fills). */
  maxValue?: number;
  /** Per-arc colors. Defaults to the theme palette. */
  colors?: string[];
  height?: number;
  /** Thickness of each ring in px. Default 16. */
  ringWidth?: number;
  /** Gap between rings in px. Default 4. */
  ringGap?: number;
  showLegend?: boolean;
  /** Big number drawn in the center (e.g. a total or the single value). */
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Radial (progress ring) chart on recharts — one concentric ring per data
 * point, each filled proportional to its value against `maxValue`. Pass
 * `centerValue` / `centerLabel` to fill the middle. Theme-driven colors.
 */
export const RadialChart: FC<RadialChartProps> = ({
  data,
  nameKey: nameKeyProp,
  dataKey = "value",
  maxValue,
  colors,
  height = 260,
  ringWidth = 16,
  ringGap = 4,
  showLegend = true,
  centerValue,
  centerLabel,
  className,
  ariaLabel = "Radial chart",
}) => {
  const gradientScopeId = useId().replace(/:/g, "");
  const nameKey = nameKeyProp ?? inferNameKey(data, dataKey);
  const palette = colors ?? CHART_PALETTE;

  if (data.length === 0) {
    return <RadialEmpty className={className} height={height} ariaLabel={ariaLabel} />;
  }

  const rows = data.map((d, i) => ({
    name: String(d[nameKey] ?? i),
    value: toNum(d[dataKey]),
    fill: palette[i % palette.length],
  }));
  const max = maxValue ?? Math.max(...rows.map((r) => r.value), 1);

  // Color in config so the tooltip swatch resolves (Cell fill is an SVG
  // gradient `url(#…)`, not a valid CSS color for the swatch).
  const config: ChartConfig = {};
  for (const r of rows) config[r.name] = { label: r.name, color: r.fill };

  const hasCenter = centerValue != null || centerLabel != null;

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <ChartContainer
        config={config}
        role="img"
        aria-label={ariaLabel}
        className="aspect-auto w-full"
        style={{ height: height - (showLegend ? 32 : 0) }}
      >
        <RadialBarChart
          data={rows}
          startAngle={90}
          endAngle={-270}
          innerRadius="30%"
          outerRadius="100%"
          barSize={ringWidth}
          barGap={ringGap}
        >
          <PieGradientDefs
            scopeId={gradientScopeId}
            slices={rows.map((r) => ({ key: r.name, color: r.fill }))}
          />
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <RadialBar dataKey="value" background cornerRadius={ringWidth / 2} isAnimationActive>
            {rows.map((r) => (
              <Cell key={r.name} fill={`url(#${pieGradientId(gradientScopeId, r.name)})`} />
            ))}
          </RadialBar>
          {hasCenter && (
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
            </PolarRadiusAxis>
          )}
        </RadialBarChart>
      </ChartContainer>

      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {rows.map((r) => (
            <span key={r.name} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-[3px]" style={{ background: r.fill }} />
              {r.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const RadialEmpty: FC<{ className?: string; height: number; ariaLabel: string }> = ({
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
