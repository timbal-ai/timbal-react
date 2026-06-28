/** Stable id for a bar series gradient within a chart instance. */
export function barGradientId(scopeId: string, dataKey: string): string {
  return `bar-${scopeId}-${sanitizeId(dataKey)}`;
}

/** Stable id for a pie slice gradient within a chart instance. */
export function pieGradientId(scopeId: string, key: string): string {
  return `pie-${scopeId}-${sanitizeId(key)}`;
}

function sanitizeId(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Truncate axis / legend labels with an ellipsis. */
export function truncateLabel(text: string, maxChars = 14): string {
  const s = String(text ?? "");
  if (s.length <= maxChars) return s;
  if (maxChars <= 1) return "…";
  return `${s.slice(0, maxChars - 1)}…`;
}

export interface EstimateYAxisWidthOptions {
  min?: number;
  max?: number;
  /** Approximate px per character at chart tick font size. */
  charWidth?: number;
}

/** Estimate category-axis width from formatted labels (horizontal bar charts). */
export function estimateYAxisWidth(
  labels: string[],
  { min = 48, max = 112, charWidth = 6.5 }: EstimateYAxisWidthOptions = {},
): number {
  if (labels.length === 0) return min;
  const longest = labels.reduce((a, b) => (a.length >= b.length ? a : b), "");
  return Math.min(max, Math.max(min, Math.ceil(longest.length * charWidth) + 12));
}
