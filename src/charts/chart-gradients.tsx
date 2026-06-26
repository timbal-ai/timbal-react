"use client";

import type { FC } from "react";

import { barGradientId, pieGradientId } from "./chart-gradient-utils";

export {
  barGradientId,
  pieGradientId,
  truncateLabel,
  estimateYAxisWidth,
} from "./chart-gradient-utils";
export type { EstimateYAxisWidthOptions } from "./chart-gradient-utils";

export interface BarGradientDefsProps {
  scopeId: string;
  dataKeys: string[];
  horizontal: boolean;
}

/** SVG linear gradients for bar fills — uses scoped `--color-{dataKey}` vars. */
export const BarGradientDefs: FC<BarGradientDefsProps> = ({
  scopeId,
  dataKeys,
  horizontal,
}) => (
  <defs>
    {dataKeys.map((dataKey) => {
      const id = barGradientId(scopeId, dataKey);
      const color = `var(--color-${dataKey})`;
      if (horizontal) {
        return (
          <linearGradient key={dataKey} id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
        );
      }
      return (
        <linearGradient key={dataKey} id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.55} />
        </linearGradient>
      );
    })}
  </defs>
);

export interface PieSliceGradient {
  key: string;
  /** CSS color for gradient stops (palette entry or var). */
  color: string;
}

export interface PieGradientDefsProps {
  scopeId: string;
  slices: PieSliceGradient[];
}

/** Per-slice linear gradients for pie / donut segments. */
export const PieGradientDefs: FC<PieGradientDefsProps> = ({ scopeId, slices }) => (
  <defs>
    {slices.map(({ key, color }) => {
      const id = pieGradientId(scopeId, key);
      return (
        <linearGradient key={key} id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.65} />
        </linearGradient>
      );
    })}
  </defs>
);
