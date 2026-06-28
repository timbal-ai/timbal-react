"use client";

import { useId, type ComponentProps, type FC } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  BarStack,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
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
import { ChartAxisTick } from "./chart-axis-tick";
import { barGradientId, BarGradientDefs, estimateYAxisWidth } from "./chart-gradients";
import { formatCompact, toNum, type CurveType } from "./geometry";
import {
  flushBarCategoryGap,
  flushLineAreaEdgeToEdge,
  resolveChartMargin,
  resolveTooltipCategory,
} from "./line-area-chart-utils";

export {
  flushBarCategoryGap,
  flushLineAreaEdgeToEdge,
  resolveChartMargin,
  resolveTooltipCategory,
} from "./line-area-chart-utils";
export type { ChartMargin } from "./line-area-chart-utils";

export type { CurveType };

/** Internal x-position for flush line/area plots (numeric axis, edge-to-edge). */
const INDEX_X_KEY = "__index";

/**
 * Theme-aware default series palette. Each entry reads a `--chart-N` token
 * (defined in `styles.css`, overridable per host app) with a literal fallback,
 * so charts rebrand automatically when the theme changes.
 */
export const CHART_PALETTE = [
  "var(--chart-1, #4f46e5)",
  "var(--chart-2, #3b82f6)",
  "var(--chart-3, #0ea5e9)",
  "var(--chart-4, #6366f1)",
  "var(--chart-5, #60a5fa)",
  "var(--chart-6, #2563eb)",
] as const;

export interface ChartSeries {
  dataKey: string;
  label?: string;
  /** CSS color (token or literal). Defaults to the palette by index. */
  color?: string;
}

export type ChartVariant = "area" | "line" | "bar";

/** `flush` — plot edge-to-edge (no side/bottom inset); axes/legend off by default. */
export type ChartLayout = "default" | "flush";

/** Tooltip series marker, mirroring shadcn's `ChartTooltipContent` indicators. */
export type ChartTooltipIndicator = "dot" | "line" | "dashed";

/** Retained for API compatibility (the recharts engine manages its own margins). */
export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LineAreaChartProps {
  data: Array<Record<string, unknown>>;
  /** Category / x-axis key. Inferred from the first non-numeric field if omitted. */
  xKey?: string;
  /** Series to plot. Strings are shorthand for `{ dataKey }`. Inferred if omitted. */
  series?: Array<ChartSeries | string>;
  variant?: ChartVariant;
  /** Plot height in px (width is responsive). Default 240. */
  height?: number;
  /** Appended to axis ticks and tooltip values (e.g. "ms", "%"). */
  unit?: string;
  /** Fix the y-domain max (e.g. 100 for percentages). */
  yMax?: number;
  /** Line / area interpolation. Default `monotone`. */
  curve?: CurveType;
  /** Stack series on top of each other (area + bar). Default false. */
  stacked?: boolean;
  /** Draw point markers on line/area series. */
  dots?: boolean | "active";
  /** Bar orientation. `horizontal` swaps category to the y-axis. Default `vertical`. */
  orientation?: "vertical" | "horizontal";
  /** Corner radius for bars. Default 4. */
  barRadius?: number;
  /** Grid line direction. Default `horizontal`. */
  gridLines?: "horizontal" | "vertical" | "both" | "none";
  /** `flush` fills the container width/height and hides axes/legend by default. */
  layout?: ChartLayout;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  /** Series legend below the plot. Default: on when `layout` is `default` and multiple series. */
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Tooltip series marker style. Default `dot`. */
  tooltipIndicator?: ChartTooltipIndicator;
  formatValue?: (value: number) => string;
  formatX?: (raw: unknown, index: number) => string;
  /** Truncate long category axis labels (full text in native tooltip). Default true. */
  clipTicks?: boolean;
  className?: string;
  /** Accessible label for the chart image. */
  ariaLabel?: string;
}

/**
 * shadcn-style chart built on recharts. A single component renders line, area,
 * and bar charts (vertical or horizontal), with stacking, curve interpolation,
 * dots, grid control, and the shared `ChartTooltipContent` / `ChartLegendContent`
 * chrome. Series colors flow from the theme `--chart-N` tokens via `ChartConfig`.
 */
export const LineAreaChart: FC<LineAreaChartProps> = ({
  data = [],
  xKey: xKeyProp,
  series: seriesProp,
  variant = "area",
  height = 240,
  unit,
  yMax,
  curve = "monotone",
  stacked = false,
  dots = false,
  orientation = "vertical",
  barRadius = 4,
  gridLines,
  layout = "default",
  showGrid: showGridProp,
  showXAxis: showXAxisProp,
  showYAxis: showYAxisProp,
  showLegend: showLegendProp,
  showTooltip = true,
  tooltipIndicator = "dot",
  formatValue,
  formatX,
  clipTicks = true,
  className,
  ariaLabel = "Chart",
}) => {
  const gradientScopeId = useId().replace(/:/g, "");
  const xKey = xKeyProp ?? inferXKey(data);
  const series = resolveSeries(seriesProp, data, xKey);

  const flush = layout === "flush";
  const showGrid = showGridProp ?? !flush;
  const horizontal = orientation === "horizontal" && variant === "bar";
  const showXAxis = showXAxisProp ?? !flush;
  const showYAxis = showYAxisProp ?? !flush;
  const showLegend = showLegendProp ?? (!flush && series.length > 1);
  const grid = gridLines ?? (horizontal ? "vertical" : "horizontal");

  if (data.length === 0 || series.length === 0) {
    return <ChartEmpty className={className} height={height} ariaLabel={ariaLabel} />;
  }

  const config: ChartConfig = {};
  series.forEach((s, i) => {
    config[s.dataKey] = {
      label: s.label ?? s.dataKey,
      color: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });

  const valueFmt = (v: unknown) =>
    formatValue ? formatValue(toNum(v)) : formatCompact(toNum(v), unit);
  const xFmt = (v: unknown, i: number) => (formatX ? formatX(v, i) : String(v ?? ""));

  const margin = resolveChartMargin({ flush, showXAxis, showYAxis });

  /** Recharts 3: `no-gap` only for labeled flush line/area (edge-to-edge stroke). Bars use band + margin inset. */
  const flushCategoryXAxisProps =
    flush && showXAxis && flushLineAreaEdgeToEdge(flush, variant, showXAxis, showYAxis)
      ? ({ scale: "point" as const, padding: "no-gap" as const, interval: 0 as const })
      : flush && showXAxis && variant === "bar"
        ? ({ interval: 0 as const })
        : {};

  const useIndexX = flushLineAreaEdgeToEdge(flush, variant, showXAxis, showYAxis);
  const chartData = useIndexX
    ? data.map((row, i) => ({ ...row, [INDEX_X_KEY]: i }))
    : data;
  const chartXKey = useIndexX ? INDEX_X_KEY : xKey;

  const categoryTick = (textAnchor: "start" | "middle" | "end") => (
    <ChartAxisTick textAnchor={textAnchor} clipTicks={clipTicks} />
  );

  const showVGrid = showGrid && (grid === "vertical" || grid === "both");
  const showHGrid = showGrid && (grid === "horizontal" || grid === "both");

  const tooltipEl = showTooltip ? (
    <ChartTooltip
      cursor={variant === "bar"}
      content={({ active, payload, label }) => (
        <ChartTooltipContent
          active={active}
          payload={
            payload as unknown as ComponentProps<typeof ChartTooltipContent>["payload"]
          }
          label={label}
          indicator={tooltipIndicator}
          labelFormatter={(_value, items) => {
            const category = resolveTooltipCategory(label, items, xKey, data, xFmt);
            return category || null;
          }}
          valueFormatter={(value) => (value != null ? valueFmt(value) : null)}
        />
      )}
    />
  ) : null;

  const legendEl = showLegend ? (
    <ChartLegend content={<ChartLegendContent />} />
  ) : null;

  const gridEl =
    showGrid && grid !== "none" ? (
      <CartesianGrid vertical={showVGrid} horizontal={showHGrid} strokeDasharray="4 4" />
    ) : null;

  const yDomain: [number | string, number | string] | undefined =
    yMax != null ? [0, yMax] : undefined;

  // ---- Bars -------------------------------------------------------------
  if (variant === "bar") {
    const dataKeys = series.map((s) => s.dataKey);
    const barDefs = (
      <BarGradientDefs scopeId={gradientScopeId} dataKeys={dataKeys} horizontal={horizontal} />
    );
    const bars = stacked ? (
      <BarStack
        radius={barCornerRadius(barRadius, horizontal, false)}
        stackId="stack"
      >
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            fill={`url(#${barGradientId(gradientScopeId, s.dataKey)})`}
            isAnimationActive
          />
        ))}
      </BarStack>
    ) : (
      series.map((s) => (
        <Bar
          key={s.dataKey}
          dataKey={s.dataKey}
          fill={`url(#${barGradientId(gradientScopeId, s.dataKey)})`}
          radius={barCornerRadius(barRadius, horizontal, false)}
          isAnimationActive
        />
      ))
    );

    if (horizontal) {
      const categoryLabels = data.map((row, i) => xFmt(row[xKey], i));
      const yAxisWidth = showYAxis
        ? estimateYAxisWidth(
            clipTicks
              ? categoryLabels.map((l) => l.slice(0, 14))
              : categoryLabels,
          )
        : 0;

      return (
        <ChartShell config={config} height={height} className={className} ariaLabel={ariaLabel}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={margin}
            barCategoryGap={flushBarCategoryGap(flush, showYAxis)}
          >
            {barDefs}
            {gridEl}
            {showXAxis ? (
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => valueFmt(v)}
                domain={yDomain}
              />
            ) : null}
            {showYAxis ? (
              <YAxis
                type="category"
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={yAxisWidth}
                minTickGap={16}
                tick={categoryTick("end")}
              />
            ) : (
              <YAxis type="category" dataKey={xKey} hide width={0} />
            )}
            {tooltipEl}
            {legendEl}
            {bars}
          </BarChart>
        </ChartShell>
      );
    }

    return (
      <ChartShell config={config} height={height} className={className} ariaLabel={ariaLabel}>
        <BarChart
          accessibilityLayer
          data={data}
          margin={margin}
          barCategoryGap={flushBarCategoryGap(flush, showXAxis)}
        >
          {barDefs}
          {gridEl}
          {showXAxis ? (
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tick={categoryTick("middle")}
              {...flushCategoryXAxisProps}
            />
          ) : (
            <XAxis dataKey={xKey} hide height={0} />
          )}
          {showYAxis ? (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
              tickFormatter={(v) => valueFmt(v)}
              domain={yDomain}
            />
          ) : (
            <YAxis hide width={0} domain={yDomain} />
          )}
          {tooltipEl}
          {legendEl}
          {bars}
        </BarChart>
      </ChartShell>
    );
  }

  // ---- Line / Area ------------------------------------------------------
  const lineAreaAxes = (
    <>
      {showXAxis && useIndexX ? (
        <XAxis
          type="number"
          dataKey={INDEX_X_KEY}
          domain={[0, Math.max(0, chartData.length - 1)]}
          allowDecimals={false}
          ticks={chartData.map((_, i) => i)}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(i) => {
            const row = chartData[Number(i)] as Record<string, unknown> | undefined;
            return row ? xFmt(row[xKey], Number(i)) : "";
          }}
        />
      ) : showXAxis ? (
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={flush ? 8 : 24}
          tickFormatter={(v, i) => xFmt(v, i)}
          {...flushCategoryXAxisProps}
        />
      ) : (
        <XAxis dataKey={chartXKey} hide height={0} />
      )}
      {showYAxis ? (
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={44}
          tickFormatter={(v) => valueFmt(v)}
          domain={yDomain}
        />
      ) : (
        <YAxis hide width={0} domain={yDomain} />
      )}
    </>
  );

  const chartA11y = flush ? {} : { accessibilityLayer: true as const };

  if (variant === "area") {
    return (
      <ChartShell
        config={config}
        height={height}
        className={className}
        ariaLabel={ariaLabel}
        flush={flush}
      >
        <AreaChart {...chartA11y} data={chartData} margin={margin}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.dataKey} id={`fill-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${s.dataKey})`} stopOpacity={0.3} />
                <stop offset="95%" stopColor={`var(--color-${s.dataKey})`} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          {gridEl}
          {lineAreaAxes}
          {tooltipEl}
          {legendEl}
          {series.map((s) => (
            <Area
              key={s.dataKey}
              dataKey={s.dataKey}
              type={curve}
              stackId={stacked ? "stack" : undefined}
              stroke={`var(--color-${s.dataKey})`}
              strokeWidth={2}
              fill={`url(#fill-${s.dataKey})`}
              dot={dots === true ? { r: 3 } : false}
              activeDot={{ r: 4 }}
              isAnimationActive
            />
          ))}
        </AreaChart>
      </ChartShell>
    );
  }

  return (
    <ChartShell
      config={config}
      height={height}
      className={className}
      ariaLabel={ariaLabel}
      flush={flush}
    >
      <LineChart {...chartA11y} data={chartData} margin={margin}>
        {gridEl}
        {lineAreaAxes}
        {tooltipEl}
        {legendEl}
        {series.map((s) => (
          <Line
            key={s.dataKey}
            dataKey={s.dataKey}
            type={curve}
            stroke={`var(--color-${s.dataKey})`}
            strokeWidth={2}
            dot={dots === true ? { r: 3 } : false}
            activeDot={{ r: 4 }}
            isAnimationActive
          />
        ))}
      </LineChart>
    </ChartShell>
  );
};

// ---------------------------------------------------------------------------

const ChartShell: FC<{
  config: ChartConfig;
  height: number;
  className?: string;
  ariaLabel: string;
  flush?: boolean;
  children: ComponentProps<typeof ChartContainer>["children"];
}> = ({ config, height, className, ariaLabel, flush = false, children }) => (
  <ChartContainer
    config={config}
    role="img"
    aria-label={ariaLabel}
    className={cn(
      "aspect-auto w-full",
      flush &&
        "justify-start [&_.recharts-responsive-container]:!mx-0 [&_.recharts-responsive-container]:w-full",
      className,
    )}
    style={{ height }}
  >
    {children}
  </ChartContainer>
);

const ChartEmpty: FC<{ className?: string; height: number; ariaLabel: string }> = ({
  className,
  height,
  ariaLabel,
}) => (
  <div
    className={cn(
      "flex w-full items-center justify-center text-xs text-muted-foreground",
      className,
    )}
    style={{ height }}
    role="img"
    aria-label={ariaLabel}
  >
    No data yet
  </div>
);

/** Bar corner radius: round the "end" of the bar, square the base. */
function barCornerRadius(
  r: number,
  horizontal: boolean,
  stacked: boolean,
): number | [number, number, number, number] {
  if (stacked) return r;
  return horizontal ? [0, r, r, 0] : [r, r, 0, 0];
}

function inferXKey(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return "x";
  for (const k of Object.keys(data[0])) {
    if (typeof data[0][k] !== "number") return k;
  }
  return Object.keys(data[0])[0] ?? "x";
}

function resolveSeries(
  seriesProp: Array<ChartSeries | string> | undefined,
  data: Array<Record<string, unknown>>,
  xKey: string,
): ChartSeries[] {
  if (seriesProp && seriesProp.length > 0) {
    return seriesProp.map((s) => (typeof s === "string" ? { dataKey: s } : s));
  }
  if (data.length === 0) return [];
  return Object.keys(data[0])
    .filter((k) => k !== xKey && typeof data[0][k] === "number")
    .map((dataKey) => ({ dataKey }));
}
