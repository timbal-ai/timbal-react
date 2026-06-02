"use client";

import { useEffect, useId, useMemo, useState, type FC, type ReactNode } from "react";

import { cn } from "../utils";
import { useChartWidth } from "./use-chart-width";
import {
  formatCompact,
  monotoneAreaPath,
  monotoneLinePath,
  niceTicks,
  toNum,
  type Point,
} from "./geometry";

/** Theme-aware default series palette. Primary uses the app's `--primary` token. */
export const CHART_PALETTE = [
  "var(--primary, #6366f1)",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
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
  /** `flush` fills the container width/height except top inset (for `MetricChartCard`). */
  layout?: ChartLayout;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  /** Series legend below the plot. Default: on when `layout` is `default` and multiple series. */
  showLegend?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  formatX?: (raw: unknown, index: number) => string;
  className?: string;
  /** Accessible label for the chart image. */
  ariaLabel?: string;
}

const PAD_DEFAULT: ChartPadding = { top: 12, right: 16, bottom: 26, left: 44 };
const PAD_FLUSH: ChartPadding = { top: 20, right: 0, bottom: 8, left: 0 };

/**
 * Polished, dependency-free chart: smooth monotone curves, gradient area fill,
 * faded dashed gridlines, hover crosshair + floating tooltip, and a cheap
 * clip-path grow-in animation. Renders crisp at the container's pixel width.
 */
export const LineAreaChart: FC<LineAreaChartProps> = ({
  data = [],
  xKey: xKeyProp,
  series: seriesProp,
  variant = "area",
  height = 240,
  unit,
  yMax,
  layout = "default",
  showGrid = true,
  showXAxis: showXAxisProp,
  showYAxis: showYAxisProp,
  showLegend: showLegendProp,
  showTooltip = true,
  formatValue,
  formatX,
  className,
  ariaLabel = "Chart",
}) => {
  const uid = useId();
  const { ref, width } = useChartWidth();
  const [active, setActive] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);

  const xKey = xKeyProp ?? inferXKey(data);
  const series = useMemo<ChartSeries[]>(
    () => resolveSeries(seriesProp, data, xKey),
    [seriesProp, data, xKey],
  );

  const pad = layout === "flush" ? PAD_FLUSH : PAD_DEFAULT;
  const showXAxis = showXAxisProp ?? layout !== "flush";
  const showYAxis = showYAxisProp ?? layout !== "flush";
  const showLegend =
    showLegendProp ?? (layout !== "flush" && series.length > 1);

  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = Math.max(0, height - pad.top - pad.bottom);

  const { minV, maxV } = useMemo(() => {
    let lo = 0;
    let hi = yMax ?? 0;
    for (const s of series) {
      for (const d of data) {
        const v = toNum(d[s.dataKey]);
        if (v > hi && yMax == null) hi = v;
        if (v < lo) lo = v;
      }
    }
    if (hi === lo) hi = lo + 1;
    return { minV: lo, maxV: yMax != null ? yMax : hi * 1.08 };
  }, [series, data, yMax]);

  const ticks = useMemo(() => niceTicks(minV, maxV, 4), [minV, maxV]);

  if (data.length === 0 || series.length === 0) {
    return <ChartEmpty className={className} height={height} />;
  }

  const yScale = (v: number) =>
    pad.top + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;
  const xCount = data.length;
  const xStep = xCount > 1 ? innerW / (xCount - 1) : innerW;
  const xPos = (i: number) =>
    variant === "bar"
      ? pad.left + (innerW * (i + 0.5)) / xCount
      : pad.left + i * xStep;
  const baseY = yScale(Math.max(0, minV));

  const fmtV = (v: number) => (formatValue ? formatValue(v) : formatCompact(v, unit));
  const fmtX = (i: number) =>
    formatX ? formatX(data[i]?.[xKey], i) : String(data[i]?.[xKey] ?? i);

  const onMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left - pad.left;
    const i = Math.round(px / (xStep || 1));
    setActive(Math.max(0, Math.min(xCount - 1, i)));
  };

  const labelIdx = pickXLabels(xCount, innerW);

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="block overflow-visible"
      >
        <defs>
          <clipPath id={`${uid}-grow`}>
            <rect
              x={pad.left}
              y={0}
              height={height}
              width={grown ? innerW : 0}
              style={{ transition: "width 900ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </clipPath>
          <linearGradient id={`${uid}-gridfade`} x1="0%" x2="100%" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="8%" stopColor="white" stopOpacity={1} />
            <stop offset="92%" stopColor="white" stopOpacity={1} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
          <mask id={`${uid}-gridmask`}>
            <rect
              x={pad.left}
              y={pad.top}
              width={innerW}
              height={innerH}
              fill={`url(#${uid}-gridfade)`}
            />
          </mask>
          {series.map((s, i) => {
            const color = s.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
            return (
              <linearGradient
                key={s.dataKey}
                id={`${uid}-fill-${i}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
              </linearGradient>
            );
          })}
        </defs>

        {showGrid && (
          <g mask={`url(#${uid}-gridmask)`}>
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={pad.left}
                x2={width - pad.right}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke="currentColor"
                strokeOpacity={0.14}
                strokeDasharray="4 4"
                className="text-muted-foreground"
              />
            ))}
          </g>
        )}

        {showYAxis &&
          ticks.map((t, i) => (
            <text
              key={i}
              x={pad.left - 8}
              y={yScale(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {fmtV(t)}
            </text>
          ))}

        {showXAxis &&
          labelIdx.map((i) => (
            <text
              key={i}
              x={xPos(i)}
              y={height - pad.bottom + 16}
              textAnchor={i === 0 ? "start" : i === xCount - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {fmtX(i)}
            </text>
          ))}

        <g clipPath={`url(#${uid}-grow)`}>
          {variant === "bar"
            ? renderBars({ data, series, xCount, xPos, yScale, baseY, innerW, uid })
            : series.map((s, si) => {
                const color = s.color ?? CHART_PALETTE[si % CHART_PALETTE.length];
                const pts: Point[] = data.map((d, i) => ({
                  x: xPos(i),
                  y: yScale(toNum(d[s.dataKey])),
                }));
                return (
                  <g key={s.dataKey}>
                    {variant === "area" && (
                      <path d={monotoneAreaPath(pts, baseY)} fill={`url(#${uid}-fill-${si})`} />
                    )}
                    <path
                      d={monotoneLinePath(pts)}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
        </g>

        {showTooltip && active != null && variant !== "bar" && (
          <g pointerEvents="none">
            <line
              x1={xPos(active)}
              x2={xPos(active)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="currentColor"
              strokeOpacity={0.25}
              className="text-foreground"
            />
            {series.map((s, si) => {
              const color = s.color ?? CHART_PALETTE[si % CHART_PALETTE.length];
              return (
                <circle
                  key={s.dataKey}
                  cx={xPos(active)}
                  cy={yScale(toNum(data[active]?.[s.dataKey]))}
                  r={4}
                  fill={color}
                  stroke="var(--background, #fff)"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        )}

        {showTooltip && (
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseMove={onMove}
            onMouseLeave={() => setActive(null)}
          />
        )}
      </svg>

      {showTooltip && active != null && (
        <ChartTooltip
          x={xPos(active)}
          width={width}
          title={fmtX(active)}
          rows={series.map((s, si) => ({
            color: s.color ?? CHART_PALETTE[si % CHART_PALETTE.length],
            label: s.label ?? s.dataKey,
            value: fmtV(toNum(data[active]?.[s.dataKey])),
          }))}
        />
      )}

      {showLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------

function renderBars(args: {
  data: Array<Record<string, unknown>>;
  series: ChartSeries[];
  xCount: number;
  xPos: (i: number) => number;
  yScale: (v: number) => number;
  baseY: number;
  innerW: number;
  uid: string;
}): ReactNode {
  const { data, series, xCount, xPos, yScale, baseY, innerW } = args;
  const groupWidth = (innerW / xCount) * 0.66;
  const barWidth = groupWidth / series.length;
  return series.flatMap((s, si) =>
    data.map((d, i) => {
      const color = s.color ?? CHART_PALETTE[si % CHART_PALETTE.length];
      const y = yScale(toNum(d[s.dataKey]));
      const x = xPos(i) - groupWidth / 2 + si * barWidth;
      const top = Math.min(y, baseY);
      const h = Math.max(1, Math.abs(y - baseY));
      return (
        <rect
          key={`${s.dataKey}-${i}`}
          x={x}
          y={top}
          width={Math.max(1, barWidth - 2)}
          height={h}
          rx={3}
          fill={color}
        />
      );
    }),
  );
}

interface TooltipRow {
  color: string;
  label: string;
  value: string;
}

const ChartTooltip: FC<{
  x: number;
  width: number;
  title: string;
  rows: TooltipRow[];
}> = ({ x, width, title, rows }) => {
  const flip = x > width - 160;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-[8rem] rounded-lg border border-border bg-popover/95 px-2.5 py-2 text-popover-foreground shadow-card-elevated backdrop-blur-sm"
      style={{
        left: flip ? undefined : Math.min(x + 12, width - 8),
        right: flip ? Math.max(width - x + 12, 8) : undefined,
      }}
    >
      <div className="mb-1.5 text-[11px] text-muted-foreground">{title}</div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: r.color }}
              />
              {r.label}
            </span>
            <span className="text-xs font-medium tabular-nums text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartLegend: FC<{ series: ChartSeries[] }> = ({ series }) => (
  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-10 text-xs text-muted-foreground">
    {series.map((s, i) => (
      <span key={s.dataKey} className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-sm"
          style={{ background: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }}
        />
        {s.label ?? s.dataKey}
      </span>
    ))}
  </div>
);

const ChartEmpty: FC<{ className?: string; height: number }> = ({ className, height }) => (
  <div
    className={cn(
      "flex w-full items-center justify-center text-xs text-muted-foreground",
      className,
    )}
    style={{ height }}
  >
    No data yet
  </div>
);

// ---------------------------------------------------------------------------

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

/** Choose x-label indices: always first + last, plus evenly spaced by width. */
function pickXLabels(count: number, innerW: number): number[] {
  if (count <= 1) return [0];
  const maxLabels = Math.max(2, Math.min(count, Math.floor(innerW / 64) + 1));
  if (maxLabels >= count) return Array.from({ length: count }, (_, i) => i);
  const out = new Set<number>([0, count - 1]);
  const step = (count - 1) / (maxLabels - 1);
  for (let i = 1; i < maxLabels - 1; i++) out.add(Math.round(i * step));
  return [...out].sort((a, b) => a - b);
}
