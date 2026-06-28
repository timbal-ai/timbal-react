/**
 * Shared motion tokens for the expressive `/site` layer.
 *
 * These are deliberately *opinionated but restrained* — the defaults produce
 * the kind of confident, weighted motion seen on award-tier marketing sites
 * (slow-out cubic-bezier, ~0.7–1s durations) rather than the snappy 150ms
 * micro-interactions the app kit favours. Override per-component when a brief
 * calls for it.
 */

/** Cubic-bezier easings as `[x1, y1, x2, y2]` tuples (motion's `ease` format). */
export const EASE = {
  /** Strong slow-out — the workhorse for entrances and reveals. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Symmetric in-out for loops and continuous motion. */
  inOut: [0.65, 0, 0.35, 1] as const,
  /** Gentle in-out, good for parallax / large translations. */
  soft: [0.4, 0, 0.2, 1] as const,
} as const;

/** Default durations (seconds) for the expressive layer. */
export const DURATION = {
  fast: 0.4,
  base: 0.7,
  slow: 1.1,
} as const;

/** Spring presets for pointer-driven motion (Magnetic, etc.). */
export const SPRING = {
  /** Tight, responsive follow. */
  snappy: { stiffness: 350, damping: 30, mass: 0.4 } as const,
  /** Looser, more elastic follow. */
  smooth: { stiffness: 150, damping: 20, mass: 0.6 } as const,
} as const;
