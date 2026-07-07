/**
 * WCAG 2.x contrast math on OKLCH values — anti-slop layer 2 (deterministic
 * guarantees). The compiler uses these to *construct* passing pairs (nudging
 * lightness until a pair passes) and to *verify* every emitted foreground /
 * background combination, so an unreadable theme is unrepresentable output,
 * not a review finding.
 */

import { relativeLuminance, type Oklch } from "../oklch";

/** WCAG contrast ratio between two colors (1–21). */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const WHITE: Oklch = { l: 0.985, c: 0, h: 0, alpha: 1 };
export const NEAR_BLACK: Oklch = { l: 0.205, c: 0, h: 0, alpha: 1 };

/**
 * Pick white or near-black text for a solid fill, preferring whichever gives
 * the higher ratio (not just a lightness threshold — saturated mid-lightness
 * brands like #f97316 flip depending on hue).
 */
export function bestForeground(bg: Oklch): {
  fg: Oklch;
  ratio: number;
} {
  const withWhite = contrastRatio(bg, WHITE);
  const withBlack = contrastRatio(bg, NEAR_BLACK);
  return withWhite >= withBlack
    ? { fg: WHITE, ratio: withWhite }
    : { fg: NEAR_BLACK, ratio: withBlack };
}

/**
 * Adjust a fill's lightness (keeping hue/chroma) until `bestForeground`
 * reaches `minRatio`. Deterministic and bounded; used for brand-derived
 * primaries whose input lightness is unusable as a button fill.
 */
export function ensureFillContrast(
  fill: Oklch,
  minRatio = 4.5,
  maxSteps = 60,
): { fill: Oklch; fg: Oklch; ratio: number } {
  let current = { ...fill };
  let best = bestForeground(current);
  let steps = 0;
  while (best.ratio < minRatio && steps < maxSteps) {
    // Move away from the current best fg: if white text wins, darken the
    // fill; if black text wins, lighten it. 0.01 L per step.
    const direction = best.fg === WHITE ? -0.01 : 0.01;
    const nextL = Math.min(0.98, Math.max(0.02, current.l + direction));
    if (nextL === current.l) break;
    current = { ...current, l: nextL };
    best = bestForeground(current);
    steps++;
  }
  return { fill: current, fg: best.fg, ratio: best.ratio };
}

export interface ContrastCheck {
  /** Token pair being verified, e.g. "primary-foreground on primary". */
  pair: string;
  mode: "light" | "dark";
  ratio: number;
  required: number;
  ok: boolean;
}

/** Build one check record. */
export function check(
  pair: string,
  mode: "light" | "dark",
  fg: Oklch,
  bg: Oklch,
  required: number,
): ContrastCheck {
  const ratio = contrastRatio(fg, bg);
  return { pair, mode, ratio: Math.round(ratio * 100) / 100, required, ok: ratio >= required };
}
