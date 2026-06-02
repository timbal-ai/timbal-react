/**
 * Pure geometry helpers for the lightweight chart engine. No DOM, no deps —
 * unit-testable and shared by `LineAreaChart`, `Sparkline`, and artifact charts.
 */

export interface Point {
  x: number;
  y: number;
}

export function toNum(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Smooth monotone-cubic path (Fritsch–Carlson tangents) so series never
 * overshoot between points — the jagged-polyline look is gone, but lines stay
 * faithful to the data (no wild Catmull-Rom loops).
 */
export function monotoneLinePath(points: Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${points[0].x},${points[0].y}`;
  if (n === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const tangents = monotoneTangents(points);
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    const c1x = p0.x + dx;
    const c1y = p0.y + dx * tangents[i];
    const c2x = p1.x - dx;
    const c2y = p1.y - dx * tangents[i + 1];
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p1.x},${p1.y}`;
  }
  return d;
}

/** Closed area path under a monotone line down to `baseY`. */
export function monotoneAreaPath(points: Point[], baseY: number): string {
  if (points.length === 0) return "";
  const line = monotoneLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x},${baseY} L ${first.x},${baseY} Z`;
}

function monotoneTangents(points: Point[]): number[] {
  const n = points.length;
  const slopes = new Array<number>(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x || 1;
    slopes[i] = (points[i + 1].y - points[i].y) / dx;
  }

  const tangents = new Array<number>(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const s0 = slopes[i - 1];
    const s1 = slopes[i];
    if (s0 * s1 <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (s0 + s1) / 2;
    }
  }

  // Clamp tangents to preserve monotonicity (Fritsch–Carlson).
  for (let i = 0; i < n - 1; i++) {
    const s = slopes[i];
    if (s === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / s;
    const b = tangents[i + 1] / s;
    const h = Math.hypot(a, b);
    if (h > 3) {
      const t = 3 / h;
      tangents[i] = t * a * s;
      tangents[i + 1] = t * b * s;
    }
  }
  return tangents;
}

/** Human "nice" axis ticks between min and max. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
    return [min || 0];
  }
  const step = niceStep((max - min) / count);
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step / 2; v += step) {
    out.push(round(v));
  }
  return out;
}

function niceStep(raw: number): number {
  const exp = Math.floor(Math.log10(Math.abs(raw) || 1));
  const base = Math.pow(10, exp);
  const norm = raw / base;
  let nice = 1;
  if (norm >= 5) nice = 5;
  else if (norm >= 2) nice = 2;
  return nice * base;
}

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/** Compact number formatting for axis ticks and tooltips (1.2k, 3.4M). */
export function formatCompact(value: number, unit?: string): string {
  const abs = Math.abs(value);
  let s: string;
  if (abs >= 1_000_000) s = `${round(value / 1_000_000)}M`;
  else if (abs >= 1_000) s = `${round(value / 1_000)}k`;
  else s = String(round(value));
  return unit ? `${s}${unit}` : s;
}
