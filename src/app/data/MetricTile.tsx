"use client";

import type { FC, ReactNode } from "react";

import { metricCellDividerClass } from "./metrics-shared";
import { cn } from "../../utils";
import { useAppDensity, useAppDensityClass } from "../layout/app-density-context";
import { Sparkline, type SparklineProps } from "../../charts/sparkline";

export interface MetricTileProps {
  label: ReactNode;
  value: ReactNode;
  /** Small unit suffix next to the value (e.g. "ms", "%"). */
  unit?: ReactNode;
  /** Optional trend pill or text (e.g. "+8%", "↗ 45100.00%"). */
  trend?: ReactNode;
  trendTone?: "up" | "down" | "neutral";
  /** Trend presentation variant. Default `"pill"`. */
  trendVariant?: "pill" | "inline";
  /** Selected state — draws the bottom accent bar (for selectable rows). */
  active?: boolean;
  /** Bottom accent bar color variant. Default `"default"`. */
  activeTone?: "default" | "primary" | "success" | "warn" | "danger" | "neutral";
  /** Right divider between cells in a metrics row. */
  showDivider?: boolean;
  /** Makes the tile a button. Omit for a static tile. */
  onSelect?: () => void;
  /** Sparkline chart data values to render inside the cell. */
  sparklineData?: Array<number | Record<string, unknown>>;
  /** Optional config options for the nested `<Sparkline />` component. */
  sparklineConfig?: Omit<SparklineProps, "data">;
  /** Custom sparkline component to render (overrides sparklineData). */
  sparkline?: ReactNode;
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

/** Inline text colors for trends (from our screenshot). */
const inlineTrendToneClass: Record<NonNullable<MetricTileProps["trendTone"]>, string> = {
  up: "text-blue-500/90 dark:text-blue-400/95 font-medium",
  down: "text-rose-500/90 dark:text-rose-400/95 font-medium",
  neutral: "text-muted-foreground/80",
};

/** Sparkline stroke color, keyed to the trend direction. */
const sparklineToneColor: Record<NonNullable<MetricTileProps["trendTone"]>, string> = {
  up: "var(--primary, #3b82f6)",
  down: "var(--destructive, #f43f5e)",
  neutral: "var(--muted-foreground, #64748b)",
};

/**
 * Full-bleed offsets for the sparkline band so it sits flush to the tile's
 * bottom and side edges (mirrors `metricTile` density padding).
 */
const sparklineBandBleed: Record<"default" | "compact", string> = {
  default: "-mx-4 -mb-3 h-10",
  compact: "-mx-3 -mb-2 h-8",
};

const activeToneClass: Record<NonNullable<MetricTileProps["activeTone"]>, string> = {
  default: "bg-foreground dark:bg-white",
  primary: "bg-primary",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-destructive",
  neutral: "bg-border",
};

const metricTileInteractiveExtraClass = cn(
  "bg-transparent hover:bg-transparent active:bg-transparent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/10",
);

/**
 * Single KPI cell — matches timbal-platform `MetricsRowCard` / `MetricCell`.
 * Use inside `MetricRow` or `MetricChartCard`, or standalone.
 * Supports inline trend tags and gorgeous background sparklines matching the premium look.
 */
export const MetricTile: FC<MetricTileProps> = ({
  label,
  value,
  unit,
  trend,
  trendTone = "neutral",
  trendVariant = "pill",
  active = false,
  activeTone = "default",
  showDivider = false,
  onSelect,
  sparklineData,
  sparklineConfig,
  sparkline,
  ariaLabel,
  className,
}) => {
  const density = useAppDensity();
  const metricTileBaseClass = useAppDensityClass("metricTile");

  const hasSparkline = Boolean(sparkline || sparklineData);
  const bandBleed = sparklineBandBleed[density === "compact" ? "compact" : "default"];

  const content = (
    <>
      {active ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 z-20 transition-colors duration-200",
            activeToneClass[activeTone]
          )}
        />
      ) : null}

      <div className="relative z-10 flex flex-col gap-1 w-full text-left">
        <span className="text-xs font-semibold text-muted-foreground/80 tracking-tight">{label}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-baseline gap-1">
            <span className="text-2xl font-normal tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {unit ? (
              <span className="text-xs font-medium text-muted-foreground">{unit}</span>
            ) : null}
          </span>
          {trend ? (
            trendVariant === "inline" ? (
              <span className={cn("text-xs leading-none select-none", inlineTrendToneClass[trendTone])}>
                {trend}
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-xs font-normal select-none",
                  trendToneClass[trendTone],
                )}
              >
                {trend}
              </span>
            )
          ) : null}
        </span>
      </div>

      {/* Dedicated bottom band — keeps the trend line clear of the numbers. */}
      {hasSparkline ? (
        <div
          className={cn(
            "relative z-10 mt-2",
            bandBleed,
          )}
        >
          {sparkline ?? (
            <Sparkline
              data={sparklineData!}
              width={160}
              height={40}
              interactive
              className="h-full w-full opacity-90"
              color={sparklineToneColor[trendTone]}
              {...sparklineConfig}
            />
          )}
        </div>
      ) : null}
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
        className={cn(
          metricTileBaseClass,
          "transition-all duration-200 hover:bg-muted/10",
          metricTileInteractiveExtraClass,
          divider,
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(metricTileBaseClass, divider, className)}>
      {content}
    </div>
  );
};
