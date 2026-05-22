"use client";

import { useMemo, type FC } from "react";
import type { ChartArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";

/**
 * Lightweight SVG chart for the four basic chart types. We deliberately don't
 * pull in `recharts` or similar — most artifact charts are small and these
 * render fine at the cost of a few hundred lines of SVG. Apps that need
 * production-grade charting can register a custom renderer that wraps their
 * preferred lib.
 */
export const ChartArtifactView: FC<{ artifact: ChartArtifact }> = ({
  artifact,
}) => {
  const { type: _t, chartType = "bar", data = [] } = artifact;
  const xKey = artifact.xKey ?? inferXKey(data);
  const dataKeys = useMemo<string[]>(() => {
    if (Array.isArray(artifact.dataKey)) return artifact.dataKey;
    if (typeof artifact.dataKey === "string") return [artifact.dataKey];
    return inferDataKeys(data, xKey);
  }, [artifact.dataKey, data, xKey]);

  return (
    <ArtifactCard title={artifact.title} kind="chart">
      <div className="aui-artifact-chart p-3">
        <ChartSvg
          chartType={chartType}
          data={data}
          xKey={xKey}
          dataKeys={dataKeys}
          unit={artifact.unit}
        />
        {dataKeys.length > 1 && (
          <Legend dataKeys={dataKeys} />
        )}
      </div>
    </ArtifactCard>
  );
};

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

const COLORS = [
  "var(--primary, #6366f1)",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
];

const W = 600;
const H = 240;
const PAD = { top: 12, right: 16, bottom: 28, left: 36 };

interface ChartSvgProps {
  chartType: NonNullable<ChartArtifact["chartType"]>;
  data: Array<Record<string, unknown>>;
  xKey: string;
  dataKeys: string[];
  unit?: string;
}

const ChartSvg: FC<ChartSvgProps> = ({ chartType, data, xKey, dataKeys, unit }) => {
  if (data.length === 0 || dataKeys.length === 0) {
    return <EmptyState />;
  }

  if (chartType === "pie") {
    return <PieChart data={data} xKey={xKey} dataKey={dataKeys[0]} />;
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const all = dataKeys.flatMap((k) => data.map((d) => toNum(d[k])));
  const maxV = Math.max(0, ...all);
  const minV = Math.min(0, ...all);
  const range = maxV - minV || 1;

  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / range) * innerH;
  const xCount = data.length;
  const xStep = xCount > 1 ? innerW / (xCount - 1) : innerW;
  const xPos = (i: number) =>
    chartType === "bar"
      ? PAD.left + (innerW * (i + 0.5)) / xCount
      : PAD.left + i * xStep;

  const ticks = niceTicks(minV, maxV);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="aui-artifact-chart-svg w-full"
      role="img"
      aria-label="Chart"
    >
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <text
            x={PAD.left - 6}
            y={yScale(t)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {formatTick(t, unit)}
          </text>
        </g>
      ))}

      {data.map((d, i) => (
        <text
          key={i}
          x={xPos(i)}
          y={H - PAD.bottom + 14}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {String(d[xKey] ?? i)}
        </text>
      ))}

      {chartType === "bar" &&
        renderBars({ data, dataKeys, xCount, xPos, yScale, minV, innerW })}
      {chartType === "line" &&
        dataKeys.map((k, ki) => (
          <Polyline
            key={k}
            data={data}
            dataKey={k}
            xPos={xPos}
            yScale={yScale}
            color={COLORS[ki % COLORS.length]}
          />
        ))}
      {chartType === "area" &&
        dataKeys.map((k, ki) => (
          <Area
            key={k}
            data={data}
            dataKey={k}
            xPos={xPos}
            yScale={yScale}
            baseY={yScale(Math.max(0, minV))}
            color={COLORS[ki % COLORS.length]}
          />
        ))}
    </svg>
  );
};

function renderBars(args: {
  data: Array<Record<string, unknown>>;
  dataKeys: string[];
  xCount: number;
  xPos: (i: number) => number;
  yScale: (v: number) => number;
  minV: number;
  innerW: number;
}) {
  const { data, dataKeys, xCount, xPos, yScale, minV, innerW } = args;
  const groupWidth = (innerW / xCount) * 0.7;
  const barWidth = groupWidth / dataKeys.length;
  const baseY = yScale(Math.max(0, minV));

  return dataKeys.flatMap((k, ki) =>
    data.map((d, i) => {
      const v = toNum(d[k]);
      const y = yScale(v);
      const x = xPos(i) - groupWidth / 2 + ki * barWidth;
      const top = Math.min(y, baseY);
      const height = Math.abs(y - baseY);
      return (
        <rect
          key={`${k}-${i}`}
          x={x}
          y={top}
          width={Math.max(1, barWidth - 2)}
          height={Math.max(1, height)}
          rx={2}
          fill={COLORS[ki % COLORS.length]}
        />
      );
    }),
  );
}

const Polyline: FC<{
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xPos: (i: number) => number;
  yScale: (v: number) => number;
  color: string;
}> = ({ data, dataKey, xPos, yScale, color }) => {
  const points = data
    .map((d, i) => `${xPos(i)},${yScale(toNum(d[dataKey]))}`)
    .join(" ");
  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};

const Area: FC<{
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xPos: (i: number) => number;
  yScale: (v: number) => number;
  baseY: number;
  color: string;
}> = ({ data, dataKey, xPos, yScale, baseY, color }) => {
  if (data.length === 0) return null;
  const top = data
    .map((d, i) => `${xPos(i)},${yScale(toNum(d[dataKey]))}`)
    .join(" ");
  const path = `M ${xPos(0)},${baseY} L ${top} L ${xPos(data.length - 1)},${baseY} Z`;
  return (
    <>
      <path d={path} fill={color} fillOpacity={0.18} />
      <Polyline data={data} dataKey={dataKey} xPos={xPos} yScale={yScale} color={color} />
    </>
  );
};

const PieChart: FC<{
  data: Array<Record<string, unknown>>;
  xKey: string;
  dataKey: string;
}> = ({ data, xKey, dataKey }) => {
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 16;
  const total = data.reduce((sum, d) => sum + toNum(d[dataKey]), 0) || 1;

  let acc = 0;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="aui-artifact-chart-svg w-full"
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
            color={COLORS[i % COLORS.length]}
            label={String(d[xKey] ?? i)}
          />
        );
      })}
    </svg>
  );
};

const PieSlice: FC<{
  cx: number;
  cy: number;
  r: number;
  start: number;
  end: number;
  color: string;
  label: string;
}> = ({ cx, cy, r, start, end, color, label }) => {
  const x1 = cx + Math.sin(start) * r;
  const y1 = cy - Math.cos(start) * r;
  const x2 = cx + Math.sin(end) * r;
  const y2 = cy - Math.cos(end) * r;
  const large = end - start > Math.PI ? 1 : 0;
  const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  const mid = (start + end) / 2;
  const lx = cx + Math.sin(mid) * (r * 0.65);
  const ly = cy - Math.cos(mid) * (r * 0.65);
  return (
    <g>
      <path d={path} fill={color} stroke="var(--background, #fff)" strokeWidth={1} />
      <text
        x={lx}
        y={ly}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white text-[10px] font-semibold"
      >
        {label}
      </text>
    </g>
  );
};

const Legend: FC<{ dataKeys: string[] }> = ({ dataKeys }) => (
  <div className="aui-artifact-chart-legend mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
    {dataKeys.map((k, i) => (
      <span key={k} className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-sm"
          style={{ background: COLORS[i % COLORS.length] }}
          aria-hidden
        />
        {k}
      </span>
    ))}
  </div>
);

const EmptyState: FC = () => (
  <div className="aui-artifact-chart-empty flex h-32 items-center justify-center text-xs text-muted-foreground">
    No data
  </div>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferXKey(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return "x";
  for (const k of Object.keys(data[0])) {
    if (typeof data[0][k] !== "number") return k;
  }
  return Object.keys(data[0])[0] ?? "x";
}

function inferDataKeys(
  data: Array<Record<string, unknown>>,
  xKey: string,
): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]).filter(
    (k) => k !== xKey && typeof data[0][k] === "number",
  );
}

function toNum(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (max === min) return [min];
  const range = max - min;
  const step = niceStep(range / count);
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step / 2; v += step) {
    out.push(round(v));
  }
  return out;
}

function niceStep(raw: number): number {
  const exp = Math.floor(Math.log10(Math.abs(raw))) || 0;
  const base = Math.pow(10, exp);
  const norm = raw / base;
  let nice = 1;
  if (norm >= 5) nice = 5;
  else if (norm >= 2) nice = 2;
  return nice * base;
}

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

function formatTick(v: number, unit?: string): string {
  const s = Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(round(v));
  return unit ? `${s}${unit}` : s;
}
