"use client";

import { useId, type FC } from "react";

import { cn } from "../utils";
import { monotoneAreaPath, monotoneLinePath, toNum, type Point } from "./geometry";

export interface SparklineProps {
  /** Numeric values, or objects from which `dataKey` is read. */
  data: Array<number | Record<string, unknown>>;
  dataKey?: string;
  color?: string;
  /** Show a soft gradient fill under the line. Default true. */
  area?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
}

/** Tiny inline trend line — no axes, no chrome. For table cells and stat tiles. */
export const Sparkline: FC<SparklineProps> = ({
  data,
  dataKey = "value",
  color = "var(--primary, #6366f1)",
  area = true,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  className,
  ariaLabel = "Trend",
}) => {
  const uid = useId();
  const values = data.map((d) => (typeof d === "number" ? d : toNum(d[dataKey])));
  if (values.length === 0) {
    return <span className={cn("inline-block", className)} style={{ width, height }} />;
  }

  const pad = strokeWidth + 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points: Point[] = values.map((v, i) => ({
    x: pad + (values.length > 1 ? (i / (values.length - 1)) * innerW : innerW / 2),
    y: pad + innerH - ((v - min) / range) * innerH,
  }));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {area && (
        <>
          <defs>
            <linearGradient id={`${uid}-spark`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={monotoneAreaPath(points, height - pad)} fill={`url(#${uid}-spark)`} />
        </>
      )}
      <path
        d={monotoneLinePath(points)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
