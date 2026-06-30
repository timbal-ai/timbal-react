export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Recharts `margin` for flush vs default layouts. */
export function resolveChartMargin(options: {
  flush: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
}): ChartMargin {
  const { flush, showXAxis, showYAxis } = options;
  if (!flush) {
    return { top: 8, right: 12, bottom: 0, left: 0 };
  }
  const anyAxis = showXAxis || showYAxis;
  if (!anyAxis) {
    return { top: 8, right: 0, bottom: 0, left: 0 };
  }
  // Recharts already reserves height/width for visible axes, so we keep the
  // category-axis side at 0 — an extra inset there only renders a dead band of
  // empty space between the tick labels and the plot edge.
  return {
    top: 8,
    right: showYAxis ? 12 : 0,
    bottom: 0,
    left: showYAxis ? 8 : 0,
  };
}

/**
 * Bar category gap for flush layouts. Flush bars still need breathing room so
 * they read as distinct columns inset from the card edges (rather than one
 * glued-together block running wall to wall) — especially once category labels
 * are shown beneath them.
 */
export function flushBarCategoryGap(flush: boolean, showCategoryAxis: boolean): string | undefined {
  return flush && showCategoryAxis ? "20%" : undefined;
}

/** Whether flush line/area should use point scale + no-gap (edge-to-edge stroke, labeled x-axis). */
export function flushLineAreaEdgeToEdge(
  flush: boolean,
  variant: "area" | "line" | "bar",
  showXAxis: boolean,
  showYAxis: boolean,
): boolean {
  return flush && (variant === "line" || variant === "area") && showXAxis && !showYAxis;
}

type TooltipRow = { payload?: Record<string, unknown> };

/** Category label for cartesian tooltips (xKey / horizontal-bar category). */
export function resolveTooltipCategory(
  label: unknown,
  payload: TooltipRow[] | undefined,
  xKey: string,
  data: Array<Record<string, unknown>>,
  formatX: (raw: unknown, index: number) => string,
): string {
  const row = payload?.[0]?.payload;
  if (row && xKey in row) {
    const idx = data.indexOf(row);
    return formatX(row[xKey], idx >= 0 ? idx : 0);
  }
  if (label != null && label !== "") {
    const idx =
      typeof label === "number"
        ? label
        : data.findIndex((r) => r[xKey] === label || String(r[xKey]) === String(label));
    return formatX(label, idx >= 0 ? idx : 0);
  }
  return "";
}
