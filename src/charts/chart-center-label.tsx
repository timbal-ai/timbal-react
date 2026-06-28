"use client";

import type { FC, ReactNode } from "react";

export interface ChartCenterLabelProps {
  cx: number;
  cy: number;
  value?: ReactNode;
  label?: ReactNode;
}

const CENTER_BOX_W = 96;
const CENTER_BOX_H = 52;

/**
 * Centered KPI block for donut / radial charts.
 * Uses HTML in foreignObject so flex centering is reliable (SVG tspans drift in Recharts).
 */
export const ChartCenterLabel: FC<ChartCenterLabelProps> = ({ cx, cy, value, label }) => {
  const hasValue = value != null && value !== "";
  const hasLabel = label != null && label !== "";

  if (!hasValue && !hasLabel) return null;

  return (
    <foreignObject
      x={cx - CENTER_BOX_W / 2}
      y={cy - CENTER_BOX_H / 2}
      width={CENTER_BOX_W}
      height={CENTER_BOX_H}
      className="overflow-visible"
    >
      <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-0.5 text-center">
        {hasValue ? (
          <div className="text-2xl font-normal leading-none tabular-nums text-foreground">
            {value}
          </div>
        ) : null}
        {hasLabel ? (
          <div className="text-[11px] leading-none text-muted-foreground">{label}</div>
        ) : null}
      </div>
    </foreignObject>
  );
};
