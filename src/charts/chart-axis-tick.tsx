"use client";

import type { FC } from "react";

import { truncateLabel } from "./chart-gradient-utils";

export interface ChartAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: unknown };
  textAnchor?: "start" | "middle" | "end" | "inherit";
  maxChars?: number;
  clipTicks?: boolean;
}

/** Recharts custom tick — truncates long category labels; full text in `<title>`. */
export const ChartAxisTick: FC<ChartAxisTickProps> = ({
  x = 0,
  y = 0,
  payload,
  textAnchor = "end",
  maxChars = 14,
  clipTicks = true,
}) => {
  const raw = String(payload?.value ?? "");
  const label = clipTicks ? truncateLabel(raw, maxChars) : raw;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{raw}</title>
      <text
        textAnchor={textAnchor}
        fill="currentColor"
        className="fill-muted-foreground"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
};
