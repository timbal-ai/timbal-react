"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between";

const GAP_CLASS: Record<StackGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const ALIGN_CLASS: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const JUSTIFY_CLASS: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export interface StackProps {
  children: ReactNode;
  /** Flex direction. Default `"vertical"`. */
  direction?: "vertical" | "horizontal";
  /** Spacing between children. Default `"md"`. */
  gap?: StackGap;
  /** Cross-axis alignment. */
  align?: StackAlign;
  /** Main-axis distribution. */
  justify?: StackJustify;
  /** Allow children to wrap (horizontal rows). Default `false`. */
  wrap?: boolean;
  className?: string;
}

/**
 * Minimal flex stack with an explicit gap scale — the lightweight option for
 * spacing a small cluster of elements where a full `Section` (title, padding)
 * is too heavy. Prevents flush, gap-less groups inside cards and rows.
 */
export const Stack: FC<StackProps> = ({
  children,
  direction = "vertical",
  gap = "md",
  align,
  justify,
  wrap = false,
  className,
}) => (
  <div
    className={cn(
      "flex min-w-0",
      direction === "vertical" ? "flex-col" : "flex-row",
      GAP_CLASS[gap],
      align && ALIGN_CLASS[align],
      justify && JUSTIFY_CLASS[justify],
      wrap && "flex-wrap",
      className,
    )}
  >
    {children}
  </div>
);
