/**
 * Minimal, dependency-free OKLCH color math.
 *
 * The Timbal token system is authored entirely in `oklch(L C H)` (see
 * `styles.css`). To derive a complete, contrast-correct, paired light + dark
 * palette from a single brand color, the theme generator needs to:
 *
 *   1. Parse any CSS color the caller supplies (hex / rgb / oklch) → OKLCH.
 *   2. Nudge lightness / chroma / hue to build surfaces, gradients, and rings.
 *   3. Serialize back to an `oklch(...)` string for the CSS variables.
 *
 * Conversions follow Björn Ottosson's reference sRGB ⇄ OKLab matrices. We never
 * need OKLCH → sRGB for output (CSS renders `oklch()` natively), but we keep a
 * back-conversion for the dev-only contrast estimate.
 */

export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number;
  /** Chroma, ~0–0.4. */
  c: number;
  /** Hue angle in degrees, 0–360. */
  h: number;
  /** Alpha, 0–1. */
  alpha: number;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

// ---------------------------------------------------------------------------
// sRGB ⇄ OKLab (Ottosson)
// ---------------------------------------------------------------------------

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const c =
    channel <= 0.0031308
      ? channel * 12.92
      : 1.055 * channel ** (1 / 2.4) - 0.055;
  return clamp(Math.round(c * 255), 0, 255);
}

function linearRgbToOklch(r: number, g: number, b: number, alpha: number): Oklch {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const labL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const labA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const labB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(labA * labA + labB * labB);
  let h = (Math.atan2(labB, labA) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: labL, c, h, alpha };
}

function oklchToLinearRgb(color: Oklch): { r: number; g: number; b: number } {
  const hRad = (color.h * Math.PI) / 180;
  const labA = color.c * Math.cos(hRad);
  const labB = color.c * Math.sin(hRad);

  const l_ = color.l + 0.3963377774 * labA + 0.2158037573 * labB;
  const m_ = color.l - 0.1055613458 * labA - 0.0638541728 * labB;
  const s_ = color.l - 0.0894841775 * labA - 1.291485548 * labB;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseHex(value: string): Oklch | null {
  let hex = value.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(hex.length)) return null;
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const int = Number.parseInt(hex, 16);
  if (Number.isNaN(int)) return null;

  const hasAlpha = hex.length === 8;
  const r = (int >>> (hasAlpha ? 24 : 16)) & 0xff;
  const g = (int >>> (hasAlpha ? 16 : 8)) & 0xff;
  const b = (int >>> (hasAlpha ? 8 : 0)) & 0xff;
  const alpha = hasAlpha ? (int & 0xff) / 255 : 1;

  return linearRgbToOklch(
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b),
    alpha,
  );
}

function parseRgb(value: string): Oklch | null {
  const match = value.match(
    /rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)(?:[\s,/]+([0-9.%]+))?\s*\)/i,
  );
  if (!match) return null;
  const r = Number.parseFloat(match[1]!);
  const g = Number.parseFloat(match[2]!);
  const b = Number.parseFloat(match[3]!);
  let alpha = 1;
  if (match[4]) {
    alpha = match[4].includes("%")
      ? Number.parseFloat(match[4]) / 100
      : Number.parseFloat(match[4]);
  }
  if (![r, g, b].every(Number.isFinite)) return null;
  return linearRgbToOklch(
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b),
    Number.isFinite(alpha) ? alpha : 1,
  );
}

function parseOklch(value: string): Oklch | null {
  const match = value.match(
    /oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.%]+))?\s*\)/i,
  );
  if (!match) return null;
  const l = match[1]!.includes("%")
    ? Number.parseFloat(match[1]!) / 100
    : Number.parseFloat(match[1]!);
  const c = match[2]!.includes("%")
    ? (Number.parseFloat(match[2]!) / 100) * 0.4
    : Number.parseFloat(match[2]!);
  const h = Number.parseFloat(match[3]!);
  let alpha = 1;
  if (match[4]) {
    alpha = match[4].includes("%")
      ? Number.parseFloat(match[4]) / 100
      : Number.parseFloat(match[4]);
  }
  if (![l, c, h].every(Number.isFinite)) return null;
  return { l, c, h, alpha: Number.isFinite(alpha) ? alpha : 1 };
}

/**
 * Parse a CSS color (`#hex`, `rgb()/rgba()`, or `oklch()`) into OKLCH.
 * Throws on unsupported input so the generator fails loudly at author time
 * rather than emitting a broken token.
 */
export function parseColor(value: string): Oklch {
  const parsed =
    parseOklch(value) ?? parseHex(value) ?? parseRgb(value);
  if (!parsed) {
    throw new Error(
      `[@timbal-ai/timbal-react] Could not parse color "${value}". ` +
        `Use a hex (#1E40AF), rgb()/rgba(), or oklch() string.`,
    );
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Manipulation + serialization
// ---------------------------------------------------------------------------

/** Return a copy with overridden channels. */
export function withOklch(base: Oklch, patch: Partial<Oklch>): Oklch {
  return { ...base, ...patch };
}

/** Shift lightness by a delta, clamped to [0, 1]. */
export function lighten(color: Oklch, delta: number): Oklch {
  return { ...color, l: clamp(color.l + delta, 0, 1) };
}

/** Scale chroma by a factor, clamped to [0, 0.4]. */
export function scaleChroma(color: Oklch, factor: number): Oklch {
  return { ...color, c: clamp(color.c * factor, 0, 0.4) };
}

/** Set alpha, clamped to [0, 1]. */
export function withAlpha(color: Oklch, alpha: number): Oklch {
  return { ...color, alpha: clamp(alpha, 0, 1) };
}

/** Serialize to a CSS `oklch(...)` string (alpha omitted when opaque). */
export function oklchToString(color: Oklch): string {
  const l = round(clamp(color.l, 0, 1), 4);
  const c = round(clamp(color.c, 0, 0.4), 4);
  const h = round(((color.h % 360) + 360) % 360, 2);
  const a = clamp(color.alpha, 0, 1);
  const base = `oklch(${l} ${c} ${h}`;
  return a >= 1 ? `${base})` : `${base} / ${round(a, 3)})`;
}

/**
 * Pick a readable foreground (near-white or near-black) for a background color.
 * Uses OKLCH lightness as a fast perceptual proxy — above the threshold the
 * surface is light, so we return dark text, and vice versa.
 */
export function readableForeground(
  bg: Oklch,
  options?: { light?: string; dark?: string; threshold?: number },
): string {
  const threshold = options?.threshold ?? 0.62;
  const lightText = options?.light ?? "oklch(0.985 0 0)";
  const darkText = options?.dark ?? "oklch(0.205 0 0)";
  return bg.l >= threshold ? darkText : lightText;
}

/**
 * Approximate WCAG relative luminance for the dev-only contrast estimate.
 * Not used for output — only to warn when a brand color yields low contrast.
 */
export function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToLinearRgb(color);
  const lr = clamp(r, 0, 1);
  const lg = clamp(g, 0, 1);
  const lb = clamp(b, 0, 1);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Round-trip helper used by tests — OKLCH → `#rrggbb`. */
export function oklchToHex(color: Oklch): string {
  const { r, g, b } = oklchToLinearRgb(color);
  const toHex = (channel: number) =>
    linearToSrgb(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
