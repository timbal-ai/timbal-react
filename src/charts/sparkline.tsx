"use client";

import {
  useId,
  useRef,
  useState,
  type FC,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "../utils";
import { formatCompact, monotoneAreaPath, monotoneLinePath, toNum, type Point } from "./geometry";

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
  /** Enable hover crosshair + value tooltip. Default false. */
  interactive?: boolean;
  /** Per-point category labels (aligned to `data`) shown in the tooltip. */
  labels?: ReactNode[];
  /** Format the value shown in the tooltip. Defaults to a compact number. */
  formatValue?: (value: number, index: number) => ReactNode;
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
  interactive = false,
  labels,
  formatValue,
}) => {
  const uid = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const values = data.map((d) => (typeof d === "number" ? d : toNum(d[dataKey])));
  if (values.length === 0) {
    return <span className={cn("inline-block", className)} style={{ width, height }} />;
  }

  const padX = 0;
  const padY = strokeWidth + 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const points: Point[] = values.map((v, i) => ({
    x: padX + (values.length > 1 ? (i / (values.length - 1)) * innerW : innerW / 2),
    y: padY + innerH - ((v - min) / range) * innerH,
  }));

  const svg = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", interactive ? "h-full w-full" : className)}
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
          <path d={monotoneAreaPath(points, height - padY)} fill={`url(#${uid}-spark)`} />
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
      {interactive && activeIndex != null && points[activeIndex] ? (
        <>
          <line
            x1={points[activeIndex].x}
            x2={points[activeIndex].x}
            y1={0}
            y2={height}
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.3}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={points[activeIndex].x}
            cy={points[activeIndex].y}
            r={2.75}
            fill={color}
            stroke="var(--background, #fff)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );

  if (!interactive) return svg;

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.max(
      0,
      Math.min(values.length - 1, Math.round(fraction * (values.length - 1))),
    );
    setActiveIndex(index);
  };

  const active = activeIndex != null ? points[activeIndex] : null;
  const formattedValue =
    activeIndex != null
      ? formatValue
        ? formatValue(values[activeIndex], activeIndex)
        : formatCompact(values[activeIndex])
      : null;

  return (
    <span
      ref={containerRef}
      className={cn("relative block touch-none", className)}
      style={{ width: "100%", height: "100%" }}
      onPointerMove={onMove}
      onPointerLeave={() => setActiveIndex(null)}
    >
      {svg}
      {active ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap",
            "rounded-xl border px-3 py-2 text-[11px] font-medium leading-none tabular-nums shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]",
            "border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-950 text-white",
            "dark:border-black/10 dark:from-white dark:to-neutral-100 dark:text-neutral-900"
          )}
          style={{
            left: `${(active.x / width) * 100}%`,
            top: `${(active.y / height) * 100}%`,
            marginTop: -8,
          }}
        >
          {labels?.[activeIndex!] != null ? (
            <span className="mr-1.5 text-neutral-300 dark:text-neutral-500">{labels[activeIndex!]}</span>
          ) : null}
          <span>{formattedValue}</span>
        </span>
      ) : null}
    </span>
  );
};
