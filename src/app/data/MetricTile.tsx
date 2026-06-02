"use client";

import type { FC, ReactNode } from "react";

import { metricCellDividerClass } from "./metrics-shared";
import { cn } from "../../utils";

export interface MetricTileProps {
  label: ReactNode;
  value: ReactNode;
  /** Small unit suffix next to the value (e.g. "ms", "%"). */
  unit?: ReactNode;
  /** Optional trend pill (e.g. "+8%"). */
  trend?: ReactNode;
  trendTone?: "up" | "down" | "neutral";
  /** Selected state — draws the bottom accent bar (for selectable rows). */
  active?: boolean;
  /** Right divider between cells in a metrics row. */
  showDivider?: boolean;
  /** Makes the tile a button. Omit for a static tile. */
  onSelect?: () => void;
  /** Override the default accessible name (use when `label` is not plain text). */
  ariaLabel?: string;
  className?: string;
}

/** Subtle trend chips — avoid loud green/red “dashboard template” colors. */
const trendToneClass: Record<NonNullable<MetricTileProps["trendTone"]>, string> = {
  up: "border-border/80 bg-muted/40 text-muted-foreground",
  down: "border-border/80 bg-muted/40 text-muted-foreground",
  neutral: "border-border/80 bg-muted/30 text-muted-foreground",
};

const metricTileBaseClass =
  "relative flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 text-left font-normal";

const metricTileInteractiveClass = cn(
  metricTileBaseClass,
  "bg-transparent hover:bg-transparent active:bg-transparent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/10",
);

/**
 * Single KPI cell — matches timbal-platform `MetricsRowCard` / `MetricCell`.
 * Use inside `MetricRow` or `MetricChartCard`, or standalone.
 */
export const MetricTile: FC<MetricTileProps> = ({
  label,
  value,
  unit,
  trend,
  trendTone = "neutral",
  active = false,
  showDivider = false,
  onSelect,
  ariaLabel,
  className,
}) => {
  const content = (
    <>
      {active ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground dark:bg-white"
        />
      ) : null}
      <span className="text-xs font-normal text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="flex items-baseline gap-1">
          <span className="text-2xl font-normal tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {unit ? (
            <span className="text-xs font-normal text-muted-foreground">{unit}</span>
          ) : null}
        </span>
        {trend ? (
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-xs font-normal",
              trendToneClass[trendTone],
            )}
          >
            {trend}
          </span>
        ) : null}
      </span>
    </>
  );

  const divider = showDivider ? metricCellDividerClass : undefined;

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={cn(metricTileInteractiveClass, divider, className)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn(metricTileBaseClass, divider, className)}>{content}</div>;
};
