"use client";

import { useMemo, type FC } from "react";

import {
  LineAreaChart,
  CHART_PALETTE,
  type ChartSeries,
} from "../charts/line-area-chart";
import { toNum } from "../charts/geometry";
import type { ChartArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";

export interface ChartArtifactViewProps {
  artifact: ChartArtifact;
  /**
   * Skip `ArtifactCard` chrome — used by `ChartPanel` which supplies the
   * analytics-style shell (title row + flush plot).
   */
  embedded?: boolean;
  /** Plot height when `embedded`. Default 300 (matches `MetricChartCard`). */
  height?: number;
}

/**
 * Renders a `chart` artifact. Bar / line / area go through the shared
 * `LineAreaChart` engine (smooth curves, gradient fill, hover tooltip); pie
 * stays a small inline SVG.
 */
export const ChartArtifactView: FC<ChartArtifactViewProps> = ({
  artifact,
  embedded = false,
  height = 300,
}) => {
  const plot = <ChartArtifactPlot artifact={artifact} height={height} />;

  if (embedded) {
    return <div className="aui-artifact-chart w-full">{plot}</div>;
  }

  return (
    <ArtifactCard title={artifact.title} kind="chart">
      <div className="aui-artifact-chart pt-2">{plot}</div>
    </ArtifactCard>
  );
};

function ChartArtifactPlot({
  artifact,
  height,
}: {
  artifact: ChartArtifact;
  height: number;
}) {
  const { chartType = "bar", data = [] } = artifact;
  const xKey = artifact.xKey ?? inferXKey(data);
  const series = useMemo<ChartSeries[]>(() => {
    const keys = Array.isArray(artifact.dataKey)
      ? artifact.dataKey
      : typeof artifact.dataKey === "string"
        ? [artifact.dataKey]
        : inferDataKeys(data, xKey);
    return keys.map((dataKey) => ({ dataKey }));
  }, [artifact.dataKey, data, xKey]);

  if (chartType === "pie") {
    return (
      <div className="px-3 pb-3 pt-2">
        <PieChart data={data} xKey={xKey} dataKey={series[0]?.dataKey ?? "value"} />
      </div>
    );
  }

  return (
    <LineAreaChart
      data={data}
      xKey={xKey}
      series={series}
      layout="flush"
      height={height}
      variant={chartType === "line" ? "line" : chartType === "area" ? "area" : "bar"}
      unit={artifact.unit}
      ariaLabel={typeof artifact.title === "string" ? artifact.title : "Chart"}
    />
  );
}

// ---------------------------------------------------------------------------
// Pie (kept inline — the line/area engine doesn't cover radial layouts)
// ---------------------------------------------------------------------------

const PIE_W = 320;
const PIE_H = 220;

const PieChart: FC<{
  data: Array<Record<string, unknown>>;
  xKey: string;
  dataKey: string;
}> = ({ data, xKey, dataKey }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        No data
      </div>
    );
  }
  const cx = PIE_W / 2;
  const cy = PIE_H / 2;
  const r = Math.min(PIE_W, PIE_H) / 2 - 16;
  const total = data.reduce((sum, d) => sum + toNum(d[dataKey]), 0) || 1;

  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${PIE_W} ${PIE_H}`}
        className="w-full max-w-[20rem]"
        role="img"
        aria-label="Pie chart"
      >
        {data.map((d, i) => {
          const value = toNum(d[dataKey]);
          const start = (acc / total) * Math.PI * 2;
          acc += value;
          const end = (acc / total) * Math.PI * 2;
          return (
            <PieSlice
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              start={start}
              end={end}
              color={CHART_PALETTE[i % CHART_PALETTE.length]}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
            />
            {String(d[xKey] ?? i)}
          </span>
        ))}
      </div>
    </div>
  );
};

const PieSlice: FC<{
  cx: number;
  cy: number;
  r: number;
  start: number;
  end: number;
  color: string;
}> = ({ cx, cy, r, start, end, color }) => {
  const x1 = cx + Math.sin(start) * r;
  const y1 = cy - Math.cos(start) * r;
  const x2 = cx + Math.sin(end) * r;
  const y2 = cy - Math.cos(end) * r;
  const large = end - start > Math.PI ? 1 : 0;
  const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  return <path d={path} fill={color} stroke="var(--background, #fff)" strokeWidth={1.5} />;
};

// ---------------------------------------------------------------------------

function inferXKey(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return "x";
  for (const k of Object.keys(data[0])) {
    if (typeof data[0][k] !== "number") return k;
  }
  return Object.keys(data[0])[0] ?? "x";
}

function inferDataKeys(data: Array<Record<string, unknown>>, xKey: string): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]).filter(
    (k) => k !== xKey && typeof data[0][k] === "number",
  );
}
