/**
 * Design DNA compiler — `dna.json` → `tokens.css`.
 *
 * Deterministic: the same DNA + compiler version always emits byte-identical
 * CSS, so drift (hand-edited tokens) is detectable by recompiling and
 * comparing (`timbal-dna check`). The compiler:
 *
 *   1. Resolves defaults (personality axes bias omitted fields).
 *   2. Derives complete paired light + dark neutral ladders from the surface
 *      strategy + neutral temperature.
 *   3. Derives primary / accent / ring / sidebar / status / chart colors.
 *   4. **Contrast-fixes every foreground/background pair** (WCAG), recording
 *      each adjustment in the report — unreadable text cannot be compiled.
 *   5. Emits `:root` / `.dark` custom properties plus Tailwind v4 `@theme`
 *      blocks (colors, radius ladder, fonts, type scale, spacing/density,
 *      shadows, easings) so utilities like `bg-card`, `rounded-control`,
 *      `h-control`, `shadow-md`, `ease-standard` all carry the DNA.
 *
 * The emitted vocabulary is a superset of the shadcn/ui token contract, so
 * battle-tested shadcn-shaped components restyle without touching their
 * internals.
 */

import {
  type Oklch,
  lighten,
  oklchToString,
  parseColor,
  relativeLuminance,
} from "../oklch";
import type {
  DesignDna,
  DnaMode,
  DnaChartRecipeId,
} from "./schema";
import {
  BRAND_CHART_ROTATIONS,
  CATEGORICAL_CHART_ANCHORS,
  DENSITY_SPECS,
  MONO_CHART_LADDER,
  getElevationLadder,
  getFontPairing,
  getMotionPreset,
  getStatusSet,
  type StatusAnchor,
} from "./registries";

export const DNA_COMPILER_VERSION = "1.0.0";

export interface DnaCompileReport {
  /** Contrast fixes the compiler applied (informational). */
  adjustments: string[];
  /** Non-blocking concerns worth a look (e.g. chart series similarity). */
  warnings: string[];
}

export interface DnaCompileResult {
  /** The complete tokens.css contents. */
  css: string;
  report: DnaCompileReport;
  /** Content fingerprint embedded in the header (FNV-1a over DNA + version). */
  fingerprint: string;
  /** The mode the app should boot into (`dna.color.defaultMode`, default light). */
  defaultMode: DnaMode;
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const round = (n: number, digits = 4) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** FNV-1a 32-bit, hex — dependency-free fingerprint. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Nudge `fg` lightness until it clears `min` contrast against `bg`.
 * Records an adjustment when it had to move; records a warning when even the
 * extremes can't reach the target (kept, not thrown — the report surfaces it).
 */
function fixContrast(
  fg: Oklch,
  bg: Oklch,
  min: number,
  label: string,
  report: DnaCompileReport,
): Oklch {
  if (contrastRatio(fg, bg) >= min) return fg;

  const original = fg.l;
  // Move away from the background's luminance: light bg → darker fg, and
  // vice versa. Try the natural direction first, then the other.
  const bgIsLight = relativeLuminance(bg) > 0.35;
  const directions = bgIsLight ? [-1, 1] : [1, -1];

  for (const dir of directions) {
    let candidate = { ...fg };
    for (let i = 0; i < 80; i++) {
      candidate = { ...candidate, l: clamp(candidate.l + dir * 0.01, 0.02, 0.99) };
      if (contrastRatio(candidate, bg) >= min) {
        report.adjustments.push(
          `${label}: lightness ${round(original, 3)} → ${round(candidate.l, 3)} to reach ${min}:1 contrast`,
        );
        return candidate;
      }
      if (candidate.l <= 0.02 || candidate.l >= 0.99) break;
    }
  }

  report.warnings.push(
    `${label}: could not reach ${min}:1 contrast (got ${contrastRatio(fg, bg).toFixed(2)}:1) — consider a different brand/neutral combination`,
  );
  return fg;
}

// ---------------------------------------------------------------------------
// Neutral ladders per surface strategy
// ---------------------------------------------------------------------------

interface NeutralLadderSpec {
  bg: number;
  card: number;
  popover: number;
  secondary: number;
  muted: number;
  accent: number;
  /** Light mode: solid border lightness. Dark mode: white-alpha border. */
  border: number | { alpha: number };
  input: number | { alpha: number };
  sidebar: number;
  fg: number;
  mutedFg: number;
  /** Default neutral chroma for this strategy when DNA doesn't set one. */
  defaultChroma: number;
}

const LIGHT_LADDERS: Record<string, NeutralLadderSpec> = {
  flat: {
    bg: 0.995, card: 0.995, popover: 0.995, secondary: 0.97, muted: 0.97,
    accent: 0.955, border: 0.905, input: 0.905, sidebar: 0.985,
    fg: 0.145, mutedFg: 0.5, defaultChroma: 0.003,
  },
  panel: {
    bg: 0.975, card: 0.998, popover: 0.998, secondary: 0.955, muted: 0.95,
    accent: 0.94, border: 0.895, input: 0.895, sidebar: 0.965,
    fg: 0.145, mutedFg: 0.49, defaultChroma: 0.005,
  },
  console: {
    bg: 0.985, card: 0.985, popover: 0.99, secondary: 0.96, muted: 0.96,
    accent: 0.945, border: 0.885, input: 0.885, sidebar: 0.975,
    fg: 0.16, mutedFg: 0.48, defaultChroma: 0.004,
  },
};

const DARK_LADDERS: Record<string, NeutralLadderSpec> = {
  flat: {
    bg: 0.165, card: 0.165, popover: 0.21, secondary: 0.22, muted: 0.22,
    accent: 0.245, border: { alpha: 0.1 }, input: { alpha: 0.12 }, sidebar: 0.165,
    fg: 0.985, mutedFg: 0.72, defaultChroma: 0.005,
  },
  panel: {
    bg: 0.145, card: 0.19, popover: 0.19, secondary: 0.225, muted: 0.225,
    accent: 0.25, border: { alpha: 0.1 }, input: { alpha: 0.12 }, sidebar: 0.17,
    fg: 0.985, mutedFg: 0.72, defaultChroma: 0.006,
  },
  console: {
    bg: 0.115, card: 0.135, popover: 0.155, secondary: 0.17, muted: 0.17,
    accent: 0.19, border: { alpha: 0.08 }, input: { alpha: 0.1 }, sidebar: 0.125,
    fg: 0.93, mutedFg: 0.68, defaultChroma: 0.005,
  },
};

// ---------------------------------------------------------------------------
// Type scale
// ---------------------------------------------------------------------------

interface TypeStep {
  key: string;
  /** Exponent on the modular ratio relative to base. */
  exp: number;
  lineHeight: number;
  /** Floor in px so small steps stay legible. */
  floorPx?: number;
}

const TYPE_STEPS: readonly TypeStep[] = [
  { key: "xs", exp: -2, lineHeight: 1.45, floorPx: 11 },
  { key: "sm", exp: -1, lineHeight: 1.45, floorPx: 12 },
  { key: "base", exp: 0, lineHeight: 1.5 },
  { key: "lg", exp: 1, lineHeight: 1.45 },
  { key: "xl", exp: 2, lineHeight: 1.35 },
  { key: "2xl", exp: 3, lineHeight: 1.25 },
  { key: "3xl", exp: 4.5, lineHeight: 1.15 },
  { key: "4xl", exp: 6, lineHeight: 1.1 },
  { key: "5xl", exp: 8, lineHeight: 1 },
];

// ---------------------------------------------------------------------------
// Compiler
// ---------------------------------------------------------------------------

type TokenList = [name: string, value: string][];

function statusColor(anchor: StatusAnchor): Oklch {
  return { l: anchor.l, c: anchor.c, h: anchor.h, alpha: 1 };
}

/** Near-white / near-black text for a solid fill, then contrast-fixed. */
function solidForeground(
  bg: Oklch,
  min: number,
  label: string,
  report: DnaCompileReport,
): Oklch {
  const fg: Oklch =
    relativeLuminance(bg) > 0.35
      ? { l: 0.16, c: Math.min(bg.c * 0.2, 0.02), h: bg.h, alpha: 1 }
      : { l: 0.985, c: Math.min(bg.c * 0.1, 0.01), h: bg.h, alpha: 1 };
  return fixContrast(fg, bg, min, label, report);
}

export function compileDna(dna: DesignDna): DnaCompileResult {
  const report: DnaCompileReport = { adjustments: [], warnings: [] };

  // ── Resolve intent + personality-informed defaults ─────────────────────
  const p = dna.personality ?? {};
  const axis = (v: number | undefined) => clamp(v ?? 0.5, 0, 1);

  const brand = parseColor(dna.color.brand);
  const accentInput = dna.color.accent ? parseColor(dna.color.accent) : null;
  const surfaces = dna.color.surfaces ?? "flat";
  const defaultMode: DnaMode = dna.color.defaultMode ?? "light";
  const statusSet = getStatusSet(dna.color.status ?? "signal");

  const neutralHue = dna.color.neutrals?.hue ?? brand.h;
  const denseAiry = axis(p.dense_airy);
  const flatDim = axis(p.flat_dimensional);

  // Elevation defaults biased by flat↔dimensional.
  const elevationLevel =
    dna.elevation?.level ??
    (flatDim < 0.33 ? "hairline" : flatDim > 0.66 ? "medium" : "soft");
  const elevationStrategy = dna.elevation?.strategy ?? "both";
  const ladderShadows = getElevationLadder(elevationLevel);

  // Density defaults biased by dense↔airy.
  const density =
    dna.spacing?.density ??
    (denseAiry < 0.33 ? "compact" : denseAiry > 0.66 ? "spacious" : "comfortable");
  const densitySpec = DENSITY_SPECS[density];

  const motion = getMotionPreset(dna.motion?.preset ?? "snappy");

  // Typography resolution: pairing → explicit overrides → defaults.
  const pairing = dna.typography?.pairing
    ? getFontPairing(dna.typography.pairing)
    : getFontPairing("inter");
  if (dna.typography?.pairing && !pairing) {
    report.warnings.push(
      `typography.pairing "${dna.typography.pairing}" not found in the registry — falling back to "inter". Run \`timbal-dna registries\` to list valid ids.`,
    );
  }
  const resolvedPairing = pairing ?? getFontPairing("inter")!;
  const fontSans = dna.typography?.sans ?? resolvedPairing.sans;
  const fontDisplay =
    dna.typography?.display ?? resolvedPairing.display ?? fontSans;
  const fontMono = dna.typography?.mono ?? resolvedPairing.mono;
  const fontImportUrl =
    dna.typography?.importUrl ??
    (dna.typography?.sans ? undefined : resolvedPairing.importUrl);

  const typeScale =
    dna.typography?.scale ?? (denseAiry < 0.33 ? 1.16 : denseAiry > 0.66 ? 1.25 : 1.2);
  const baseSize =
    dna.typography?.baseSize ?? (denseAiry < 0.33 ? 14 : denseAiry > 0.66 ? 16 : 15);
  const headingWeight = dna.typography?.headingWeight ?? 600;
  const trackingDisplay =
    (dna.typography?.tracking ?? "normal") === "tight" ? "-0.02em" : "-0.011em";

  const radius = dna.shape?.radius ?? 0.625;
  const controls = dna.shape?.controls ?? "rounded";
  const borderWidth = dna.shape?.borderWidth ?? 1;

  // ── Neutrals ────────────────────────────────────────────────────────────
  const lightSpec = LIGHT_LADDERS[surfaces];
  const darkSpec = DARK_LADDERS[surfaces];
  const chromaLight = dna.color.neutrals?.chroma ?? lightSpec.defaultChroma;
  const chromaDark = dna.color.neutrals?.chroma ?? darkSpec.defaultChroma;

  const n = (l: number, c: number): Oklch => ({ l, c, h: neutralHue, alpha: 1 });
  const fgChroma = (c: number) => Math.min(c * 0.6, 0.008);

  interface ModePalette {
    bg: Oklch; fg: Oklch; card: Oklch; cardFg: Oklch; popover: Oklch; popoverFg: Oklch;
    secondary: Oklch; secondaryFg: Oklch; muted: Oklch; mutedFg: Oklch;
    accent: Oklch; accentFg: Oklch; border: Oklch; input: Oklch; ring: Oklch;
    primary: Oklch; primaryFg: Oklch;
    sidebar: Oklch; sidebarFg: Oklch; sidebarAccent: Oklch; sidebarAccentFg: Oklch;
    sidebarBorder: Oklch;
  }

  function buildNeutrals(mode: DnaMode): ModePalette {
    const spec = mode === "light" ? lightSpec : darkSpec;
    const c = mode === "light" ? chromaLight : chromaDark;

    const flatSurface = surfaces === "flat";
    const bgChroma = c * (flatSurface ? 0.6 : 1);
    const bg = n(spec.bg, bgChroma);
    const fg = fixContrast(
      n(spec.fg, fgChroma(c)), bg, 7, `${mode}: foreground/background`, report,
    );
    // Flat strategy: canvas and cards share one surface — identical token values.
    const card = flatSurface
      ? bg
      : n(spec.card, mode === "light" ? c * 0.5 : c);
    const cardFg = fixContrast(
      { ...fg }, card, 7, `${mode}: card-foreground/card`, report,
    );
    const popover = n(spec.popover, mode === "light" ? c * 0.5 : c);
    const secondary = n(spec.secondary, c);
    const muted = n(spec.muted, c);
    const mutedFg = fixContrast(
      n(spec.mutedFg, Math.min(c * 2.5, 0.02)),
      bg, 4.5, `${mode}: muted-foreground/background`, report,
    );
    const accentSurface = n(spec.accent, c * 1.4);
    const border =
      typeof spec.border === "number"
        ? n(spec.border, c)
        : { l: 1, c: 0, h: 0, alpha: spec.border.alpha };
    const input =
      typeof spec.input === "number"
        ? n(spec.input, c)
        : { l: 1, c: 0, h: 0, alpha: spec.input.alpha };

    // Primary from brand. A near-neutral brand keeps the classy near-black /
    // near-white button; a chromatic brand is clamped into a usable fill band.
    let primary: Oklch;
    if (brand.c < 0.03) {
      primary =
        mode === "light"
          ? { ...brand, l: clamp(brand.l, 0.16, 0.28) }
          : { l: 0.985, c: Math.min(brand.c, 0.01), h: brand.h, alpha: 1 };
    } else if (mode === "light") {
      primary = { ...brand, l: clamp(brand.l, 0.42, 0.68) };
    } else {
      const lightened = lighten(brand, 0.06);
      primary = {
        ...lightened,
        l: clamp(lightened.l, 0.5, 0.78),
        c: Math.min(brand.c, 0.22),
      };
    }
    const primaryFg = solidForeground(
      primary, 4.5, `${mode}: primary-foreground/primary`, report,
    );

    const ring: Oklch =
      brand.c < 0.03
        ? { l: mode === "light" ? 0.55 : 0.6, c: Math.min(c * 2, 0.014), h: neutralHue, alpha: 1 }
        : {
            l: mode === "light" ? 0.6 : 0.62,
            c: Math.min(primary.c * 0.7, 0.15),
            h: primary.h,
            alpha: 1,
          };

    const sidebar = n(spec.sidebar, c);
    const sidebarFg = fixContrast(
      { ...fg }, sidebar, 7, `${mode}: sidebar-foreground/sidebar`, report,
    );
    const sidebarAccent = n(
      mode === "light" ? spec.accent + 0.005 : spec.accent + 0.005,
      c * 1.4,
    );
    const sidebarAccentFg = fixContrast(
      { ...fg }, sidebarAccent, 4.5, `${mode}: sidebar-accent-foreground/sidebar-accent`, report,
    );
    const sidebarBorder = border;

    // Foregrounds for the flat tinted surfaces reuse the main foreground.
    const secondaryFg = fixContrast(
      { ...fg }, secondary, 4.5, `${mode}: secondary-foreground/secondary`, report,
    );

    // User-supplied accent color takes over the accent surface.
    let accentFinal = accentSurface;
    if (accentInput) {
      accentFinal =
        mode === "light"
          ? { l: clamp(accentInput.l, 0.9, 0.96), c: Math.min(accentInput.c, 0.06), h: accentInput.h, alpha: 1 }
          : { l: 0.28, c: Math.min(accentInput.c, 0.06), h: accentInput.h, alpha: 1 };
    }
    const accentFg = fixContrast(
      { ...fg }, accentFinal, 4.5, `${mode}: accent-foreground/accent`, report,
    );

    return {
      bg, fg, card, cardFg, popover, popoverFg: cardFg,
      secondary, secondaryFg, muted, mutedFg,
      accent: accentFinal, accentFg, border, input, ring,
      primary, primaryFg,
      sidebar, sidebarFg, sidebarAccent, sidebarAccentFg, sidebarBorder,
    };
  }

  const light = buildNeutrals("light");
  const dark = buildNeutrals("dark");

  // ── Status tokens ───────────────────────────────────────────────────────
  type StatusName = "success" | "warning" | "destructive" | "info";
  const STATUS_NAMES: readonly StatusName[] = [
    "success", "warning", "destructive", "info",
  ];

  function buildStatuses(mode: DnaMode): TokenList {
    const anchors = mode === "light" ? statusSet.light : statusSet.dark;
    const out: TokenList = [];
    for (const name of STATUS_NAMES) {
      const solid = statusColor(anchors[name]);
      const solidFg = solidForeground(
        solid, 4.5, `${mode}: ${name}-foreground/${name}`, report,
      );
      const subtle: Oklch =
        mode === "light"
          ? { l: 0.958, c: 0.045, h: solid.h, alpha: 1 }
          : { l: 0.225, c: 0.055, h: solid.h, alpha: 1 };
      const subtleFgSeed: Oklch =
        mode === "light"
          ? { l: 0.38, c: Math.min(solid.c * 0.9, 0.12), h: solid.h, alpha: 1 }
          : { l: 0.82, c: Math.min(solid.c * 0.75, 0.1), h: solid.h, alpha: 1 };
      const subtleFg = fixContrast(
        subtleFgSeed, subtle, 4.5, `${mode}: ${name}-subtle-foreground/${name}-subtle`, report,
      );
      out.push([`--${name}`, oklchToString(solid)]);
      out.push([`--${name}-foreground`, oklchToString(solidFg)]);
      out.push([`--${name}-subtle`, oklchToString(subtle)]);
      out.push([`--${name}-subtle-foreground`, oklchToString(subtleFg)]);
    }
    return out;
  }

  // ── Chart palette ───────────────────────────────────────────────────────
  function buildCharts(mode: DnaMode): TokenList {
    const charts = dna.color.charts ?? (brand.c < 0.03 ? "categorical" : "brand");
    let anchors: Oklch[];

    if (Array.isArray(charts)) {
      anchors = charts.map((c) => parseColor(c));
    } else {
      const recipe = charts as DnaChartRecipeId;
      if (recipe === "categorical") {
        anchors = CATEGORICAL_CHART_ANCHORS.map(statusColor);
      } else if (recipe === "monochrome") {
        anchors = MONO_CHART_LADDER.map((step) => ({
          l: step.l, c: Math.min(step.c, Math.max(brand.c, 0.05)), h: brand.h, alpha: 1,
        }));
      } else {
        // brand-anchored
        anchors = BRAND_CHART_ROTATIONS.map((rot) => ({
          l: rot.l,
          c: clamp(brand.c < 0.07 ? 0.12 : Math.min(brand.c, 0.16), 0.07, 0.17),
          h: (((brand.h + rot.dh) % 360) + 360) % 360,
          alpha: 1,
        }));
      }
    }

    // Distinguishability check (hue or lightness must separate neighbors).
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1]!;
      const b = anchors[i]!;
      const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
      if (dh < 18 && Math.abs(a.l - b.l) < 0.1) {
        report.warnings.push(
          `${mode}: chart-${i} and chart-${i + 1} are hard to distinguish (Δhue ${dh.toFixed(0)}°, ΔL ${Math.abs(a.l - b.l).toFixed(2)})`,
        );
      }
    }

    const out: TokenList = [];
    anchors.slice(0, 8).forEach((anchor, i) => {
      const color =
        mode === "dark"
          ? { ...lighten(anchor, 0.06), c: anchor.c * 0.95 }
          : anchor;
      out.push([`--chart-${i + 1}`, oklchToString(color)]);
    });
    return out;
  }

  // ── Chat / markdown chrome tokens (consumed by the forked chat chrome) ──
  function buildChrome(mode: DnaMode, pal: ModePalette): TokenList {
    const c = mode === "light" ? chromaLight : chromaDark;
    if (mode === "light") {
      return [
        ["--composer-bg", oklchToString(n(Math.min(pal.card.l + 0.004, 1), c * 0.4))],
        ["--composer-border", oklchToString(pal.border)],
        ["--composer-border-focus", oklchToString({ l: 0.62, c: Math.min(brand.c * 0.25, 0.05), h: brand.h, alpha: 1 })],
        ["--bubble-user", oklchToString(n(0.924, c * 1.2))],
        ["--bubble-user-foreground", oklchToString(pal.fg)],
        ["--code-block-bg", oklchToString(n(clamp(pal.bg.l - 0.015, 0, 1), c))],
        ["--code-header-bg", oklchToString(n(clamp(pal.bg.l - 0.03, 0, 1), c))],
        ["--md-table-zebra", oklchToString({ l: 0.97, c: c, h: neutralHue, alpha: 0.4 })],
        ["--katex-bg", oklchToString({ l: 0.97, c: 0, h: 0, alpha: 0.6 })],
        ["--katex-border", oklchToString(n(0.922, c))],
      ];
    }
    return [
      ["--composer-bg", oklchToString(n(clamp(pal.card.l + 0.03, 0, 1), c))],
      ["--composer-border", oklchToString(pal.border)],
      ["--composer-border-focus", oklchToString({ l: 0.5, c: Math.min(brand.c * 0.25, 0.05), h: brand.h, alpha: 1 })],
      ["--bubble-user", oklchToString(n(clamp(pal.bg.l + 0.115, 0, 1), c))],
      ["--bubble-user-foreground", oklchToString(pal.fg)],
      ["--code-block-bg", oklchToString(n(clamp(pal.bg.l + 0.012, 0, 1), c))],
      ["--code-header-bg", oklchToString(n(clamp(pal.bg.l + 0.03, 0, 1), c))],
      ["--md-table-zebra", oklchToString({ l: 0.3, c: c, h: neutralHue, alpha: 0.35 })],
      ["--katex-bg", oklchToString({ l: 0.28, c: 0, h: 0, alpha: 0.6 })],
      ["--katex-border", oklchToString({ l: 1, c: 0, h: 0, alpha: 0.12 })],
    ];
  }

  // ── Assemble per-mode token lists (stable order) ────────────────────────
  function modeTokens(mode: DnaMode, pal: ModePalette): TokenList {
    const tokens: TokenList = [
      ["--background", oklchToString(pal.bg)],
      ["--foreground", oklchToString(pal.fg)],
      ["--card", oklchToString(pal.card)],
      ["--card-foreground", oklchToString(pal.cardFg)],
      ["--popover", oklchToString(pal.popover)],
      ["--popover-foreground", oklchToString(pal.popoverFg)],
      ["--primary", oklchToString(pal.primary)],
      ["--primary-foreground", oklchToString(pal.primaryFg)],
      ["--secondary", oklchToString(pal.secondary)],
      ["--secondary-foreground", oklchToString(pal.secondaryFg)],
      ["--muted", oklchToString(pal.muted)],
      ["--muted-foreground", oklchToString(pal.mutedFg)],
      ["--accent", oklchToString(pal.accent)],
      ["--accent-foreground", oklchToString(pal.accentFg)],
      ["--border", oklchToString(pal.border)],
      ["--input", oklchToString(pal.input)],
      ["--ring", oklchToString(pal.ring)],
      ...buildStatuses(mode),
      ...buildCharts(mode),
      ["--sidebar", oklchToString(pal.sidebar)],
      ["--sidebar-foreground", oklchToString(pal.sidebarFg)],
      ["--sidebar-primary", oklchToString(pal.primary)],
      ["--sidebar-primary-foreground", oklchToString(pal.primaryFg)],
      ["--sidebar-accent", oklchToString(pal.sidebarAccent)],
      ["--sidebar-accent-foreground", oklchToString(pal.sidebarAccentFg)],
      ["--sidebar-border", oklchToString(pal.sidebarBorder)],
      ["--sidebar-ring", oklchToString(pal.ring)],
      ...buildChrome(mode, pal),
    ];
    for (const step of ["xs", "sm", "md", "lg", "xl"] as const) {
      const pair = shadowFor(step);
      tokens.push([
        `--shadow-${step}-value`,
        mode === "light" ? pair.light : pair.dark,
      ]);
    }
    return tokens;
  }

  function shadowFor(step: "xs" | "sm" | "md" | "lg" | "xl"): {
    light: string;
    dark: string;
  } {
    // "border" strategy: cards separate with borders, so the low steps go
    // flat; overlays (md+) keep depth. "shadow" and "both" use the ladder.
    if (elevationStrategy === "border" && (step === "xs" || step === "sm")) {
      return { light: "none", dark: "none" };
    }
    return {
      light: ladderShadows.light[step],
      dark: ladderShadows.dark[step],
    };
  }

  // ── Non-color root tokens ───────────────────────────────────────────────
  const radiusControl =
    controls === "pill"
      ? "9999px"
      : controls === "sharp"
        ? "0.25rem"
        : "calc(var(--radius) - 2px)";

  const rootTokens: TokenList = [
    ["--radius", `${round(radius, 4)}rem`],
    ["--font-sans", fontSans],
    ["--font-display", fontDisplay],
    ["--font-mono", fontMono],
    ["--display-weight", String(headingWeight)],
    ["--tracking-display", trackingDisplay],
    ["--motion-fast", motion.fast],
    ["--motion-base", motion.base],
    ["--motion-slow", motion.slow],
    ["--border-width", `${borderWidth}px`],
    ["--scrollbar-thumb", "oklch(0.708 0 0 / 0.3)"],
    ["--scrollbar-thumb-hover", "oklch(0.708 0 0 / 0.5)"],
  ];

  // ── Type scale ──────────────────────────────────────────────────────────
  const typeTokens: TokenList = [];
  for (const step of TYPE_STEPS) {
    let px = baseSize * typeScale ** step.exp;
    if (step.floorPx) px = Math.max(px, step.floorPx);
    typeTokens.push([`--text-${step.key}`, `${round(px / 16, 4)}rem`]);
    typeTokens.push([`--text-${step.key}--line-height`, String(step.lineHeight)]);
  }

  // ── Overrides ───────────────────────────────────────────────────────────
  const overrides = dna.overrides ?? {};
  const isModeShaped =
    ("light" in overrides || "dark" in overrides) &&
    Object.keys(overrides).every((k) => k === "light" || k === "dark");
  const overridesLight: Record<string, string> = isModeShaped
    ? ((overrides as { light?: Record<string, string> }).light ?? {})
    : (overrides as Record<string, string>);
  const overridesDark: Record<string, string> = isModeShaped
    ? ((overrides as { dark?: Record<string, string> }).dark ?? {})
    : (overrides as Record<string, string>);

  // ── Emit CSS ────────────────────────────────────────────────────────────
  const fingerprint = fnv1a(JSON.stringify(dna) + DNA_COMPILER_VERSION);

  const emit = (tokens: TokenList, extra: Record<string, string>): string =>
    [
      ...tokens.map(([k, v]) => `  ${k}: ${v};`),
      ...Object.entries(extra).map(([k, v]) => `  ${k}: ${v};`),
    ].join("\n");

  const lines: string[] = [];
  lines.push(
    `/*`,
    ` * GENERATED by timbal-dna v${DNA_COMPILER_VERSION} — do not hand-edit.`,
    ` * Source of truth: src/design/dna.json  (edit it, then run \`bun run dna:compile\`).`,
    ` * Fingerprint: ${fingerprint}  ·  default mode: ${defaultMode}  ·  surfaces: ${surfaces}`,
    ` * Hand edits are rejected by \`timbal-dna check\` — change the DNA instead.`,
    ` */`,
  );
  if (fontImportUrl) {
    lines.push(`@import url("${fontImportUrl}");`);
  }
  lines.push("");
  lines.push(`:root {`);
  lines.push(emit([...rootTokens, ...modeTokens("light", light)], overridesLight));
  lines.push(`}`);
  lines.push("");
  lines.push(`.dark {`);
  lines.push(emit(modeTokens("dark", dark), overridesDark));
  lines.push(`}`);
  lines.push("");

  // Tailwind v4 mapping — colors + radius reference the runtime vars
  // (shadcn convention) so `.dark` swaps them live.
  const colorNames = [
    "background", "foreground", "card", "card-foreground", "popover",
    "popover-foreground", "primary", "primary-foreground", "secondary",
    "secondary-foreground", "muted", "muted-foreground", "accent",
    "accent-foreground", "border", "input", "ring",
    ...STATUS_NAMES.flatMap((s) => [s, `${s}-foreground`, `${s}-subtle`, `${s}-subtle-foreground`]),
    ...Array.from({ length: 8 }, (_, i) => `chart-${i + 1}`),
    "sidebar", "sidebar-foreground", "sidebar-primary",
    "sidebar-primary-foreground", "sidebar-accent", "sidebar-accent-foreground",
    "sidebar-border", "sidebar-ring",
  ];
  lines.push(`@theme inline {`);
  for (const name of colorNames) {
    lines.push(`  --color-${name}: var(--${name});`);
  }
  lines.push(`  --radius-sm: calc(var(--radius) - 4px);`);
  lines.push(`  --radius-md: calc(var(--radius) - 2px);`);
  lines.push(`  --radius-lg: var(--radius);`);
  lines.push(`  --radius-xl: calc(var(--radius) + 4px);`);
  lines.push(`  --radius-2xl: calc(var(--radius) + 8px);`);
  lines.push(`  --radius-control: ${radiusControl};`);
  lines.push(`  --shadow-2xs: var(--shadow-xs-value);`);
  lines.push(`  --shadow-xs: var(--shadow-xs-value);`);
  lines.push(`  --shadow-sm: var(--shadow-sm-value);`);
  lines.push(`  --shadow-md: var(--shadow-md-value);`);
  lines.push(`  --shadow-lg: var(--shadow-lg-value);`);
  lines.push(`  --shadow-xl: var(--shadow-xl-value);`);
  lines.push(`  --font-sans: var(--font-sans);`);
  lines.push(`  --font-display: var(--font-display);`);
  lines.push(`  --font-mono: var(--font-mono);`);
  lines.push(`}`);
  lines.push("");

  // Literal-valued theme tokens (emitted as real vars + utilities).
  lines.push(`@theme {`);
  lines.push(`  --spacing: ${densitySpec.spacingUnit};`);
  lines.push(`  --spacing-control: ${densitySpec.control};`);
  lines.push(`  --spacing-control-sm: ${densitySpec.controlSm};`);
  lines.push(`  --spacing-control-lg: ${densitySpec.controlLg};`);
  for (const [k, v] of typeTokens) {
    lines.push(`  ${k}: ${v};`);
  }
  lines.push(`  --ease-standard: ${motion.ease};`);
  lines.push(`  --ease-emphasized: ${motion.easeEmphasized};`);
  // Bare `transition-*` utilities inherit the DNA motion preset — components
  // don't hardcode durations, so a motion re-DNA restyles every transition.
  lines.push(`  --default-transition-duration: ${motion.base};`);
  lines.push(`  --default-transition-timing-function: ${motion.ease};`);
  lines.push(`}`);
  lines.push("");

  return {
    css: lines.join("\n"),
    report,
    fingerprint,
    defaultMode,
  };
}
