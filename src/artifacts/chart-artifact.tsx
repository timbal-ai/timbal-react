"use client";

import { useMemo, type FC } from "react";

import { LineAreaChart, type ChartSeries } from "../charts/line-area-chart";
import { PieChart } from "../charts/pie-chart";
import { RadialChart } from "../charts/radial-chart";
import { RadarChart } from "../charts/radar-chart";
import { formatCompact, toNum } from "../charts/geometry";
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
 * Renders a `chart` artifact. Cartesian kinds (bar / horizontalBar / line /
 * area, including stacked) go through the shared `LineAreaChart` engine; pie,
 * donut, radial, and radar use their dedicated recharts components. All
 * inherit the theme `--chart-N` palette.
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
    if (artifact.series && artifact.series.length > 0) {
      return artifact.series.map((s) => ({
        dataKey: s.dataKey,
        label: s.label,
        color: s.color,
      }));
    }
    const keys = Array.isArray(artifact.dataKey)
      ? artifact.dataKey
      : typeof artifact.dataKey === "string"
        ? [artifact.dataKey]
        : inferDataKeys(data, xKey);
    const colors = artifact.colors;
    return keys.map((dataKey, i) => ({
      dataKey,
      color: colors?.[i],
    }));
  }, [artifact.series, artifact.dataKey, artifact.colors, data, xKey]);

  const aria = typeof artifact.title === "string" ? artifact.title : "Chart";

  if (chartType === "pie" || chartType === "donut") {
    const total = data.reduce((sum, d) => sum + toNum(d[series[0]?.dataKey ?? "value"]), 0);
    return (
      <div className="px-3 pb-3 pt-2">
        <PieChart
          data={data}
          nameKey={xKey}
          dataKey={series[0]?.dataKey ?? "value"}
          innerRadius={chartType === "donut" ? 0.6 : 0}
          colors={artifact.colors}
          height={height}
          unit={artifact.unit}
          centerValue={chartType === "donut" ? formatCompact(total, artifact.unit) : undefined}
          centerLabel={chartType === "donut" ? "Total" : undefined}
          ariaLabel={aria}
        />
      </div>
    );
  }

  if (chartType === "radial") {
    return (
      <div className="px-3 pb-3 pt-2">
        <RadialChart
          data={data}
          nameKey={xKey}
          dataKey={series[0]?.dataKey ?? "value"}
          colors={artifact.colors}
          height={height}
          ariaLabel={aria}
        />
      </div>
    );
  }

  if (chartType === "radar") {
    return (
      <div className="px-3 pb-3 pt-2">
        <RadarChart data={data} nameKey={xKey} series={series} height={height} ariaLabel={aria} />
      </div>
    );
  }

  const horizontal = chartType === "horizontalBar";
  const showAxes = artifact.showAxes === true;
  return (
    <LineAreaChart
      data={data}
      xKey={xKey}
      series={series}
      layout="flush"
      height={height}
      variant={chartType === "line" ? "line" : chartType === "area" ? "area" : "bar"}
      orientation={horizontal ? "horizontal" : "vertical"}
      stacked={artifact.stacked}
      curve={artifact.curve}
      dots={artifact.dots}
      tooltipIndicator={artifact.tooltipIndicator}
      showXAxis={showAxes}
      showYAxis={showAxes && horizontal}
      showLegend={artifact.legend ?? series.length > 1}
      unit={artifact.unit}
      ariaLabel={aria}
    />
  );
}

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
