import * as React from "react";

import { cn } from "../utils";

export interface CircularProgressProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** Current value. Omit (or pass `null`) for an indeterminate spinner ring. */
  value?: number | null;
  max?: number;
  /** Diameter in px. Default: `40`. */
  size?: number;
  /** Stroke width in px. Default: `4`. */
  thickness?: number;
  /** Render the percentage (or custom node) in the center. */
  showLabel?: boolean;
  label?: React.ReactNode;
  /** Track + indicator tone. Default: `"primary"`. */
  tone?: "primary" | "success" | "warn" | "danger";
}

const toneClass = {
  primary: "text-primary",
  success: "text-emerald-500",
  warn: "text-amber-500",
  danger: "text-destructive",
} as const;

/**
 * Lightweight SVG progress ring — determinate (with optional center label) or
 * indeterminate (spinning). Dependency-free; for data-driven radial charts use
 * the chart `RadialChart` instead.
 */
function CircularProgress({
  value = 0,
  max = 100,
  size = 40,
  thickness = 4,
  showLabel = false,
  label,
  tone = "primary",
  className,
  ...props
}: CircularProgressProps) {
  const indeterminate = value === null || value === undefined;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = indeterminate ? 0.25 : Math.min(Math.max(value / max, 0), 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      data-slot="circular-progress"
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn(toneClass[tone], indeterminate && "animate-spin")}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-current opacity-15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn("stroke-current", !indeterminate && "transition-[stroke-dashoffset] duration-500")}
        />
      </svg>
      {showLabel && !indeterminate ? (
        <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-medium tabular-nums text-foreground">
          {label ?? `${Math.round(pct * 100)}%`}
        </span>
      ) : null}
    </div>
  );
}

export { CircularProgress };
