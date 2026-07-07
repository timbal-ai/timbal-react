/**
 * Curated registries the DNA compiler draws from.
 *
 * This is where taste is encoded as *data*: every font pairing, status set,
 * motion preset, and elevation ladder here has been chosen to read as a
 * designed product. The DNA schema lets a generator pick from these menus
 * (or supply explicit values within validated ranges) — it cannot invent
 * raw material below this quality floor.
 *
 * All Google Fonts URLs use the css2 API with explicit weight ranges so the
 * loaded payload stays small.
 */

import type { DnaMotionPreset, DnaStatusSetId, DnaElevationLevel } from "./schema";

// ---------------------------------------------------------------------------
// Font pairings
// ---------------------------------------------------------------------------

export interface FontPairing {
  id: string;
  label: string;
  /** Personality tags for agent selection ("what vibe does this carry?"). */
  vibe: string[];
  /** Body / UI stack. */
  sans: string;
  /** Display/heading stack. Omitted = headings use `sans`. */
  display?: string;
  /** Monospace stack. */
  mono: string;
  /** Google Fonts css2 stylesheet loading every family above. */
  importUrl: string;
}

const GF = "https://fonts.googleapis.com/css2";

export const FONT_PAIRINGS: readonly FontPairing[] = [
  {
    id: "inter",
    label: "Inter — neutral product default",
    vibe: ["neutral", "product", "safe", "saas"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;600&display=swap`,
  },
  {
    id: "geist",
    label: "Geist — crisp technical modern",
    vibe: ["technical", "crisp", "developer", "modern"],
    sans: `"Geist", ui-sans-serif, system-ui, sans-serif`,
    mono: `"Geist Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Geist:wght@100..900&family=Geist+Mono:wght@400;500;600&display=swap`,
  },
  {
    id: "figtree",
    label: "Figtree — friendly rounded",
    vibe: ["friendly", "approachable", "consumer", "warm"],
    sans: `"Figtree", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Figtree:wght@300..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "manrope",
    label: "Manrope — geometric humanist",
    vibe: ["modern", "clean", "fintech", "confident"],
    sans: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Manrope:wght@200..800&family=IBM+Plex+Mono:wght@400;500&display=swap`,
  },
  {
    id: "dm-sans",
    label: "DM Sans — warm geometric consumer",
    vibe: ["consumer", "warm", "retail", "rounded"],
    sans: `"DM Sans", ui-sans-serif, system-ui, sans-serif`,
    mono: `"DM Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=DM+Sans:opsz,wght@9..40,100..1000&family=DM+Mono:wght@400;500&display=swap`,
  },
  {
    id: "plus-jakarta",
    label: "Plus Jakarta Sans — contemporary startup",
    vibe: ["startup", "contemporary", "product", "energetic"],
    sans: `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Plus+Jakarta+Sans:wght@200..800&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "work-sans",
    label: "Work Sans — plainspoken humanist",
    vibe: ["editorial", "plain", "humanist", "calm"],
    sans: `"Work Sans", ui-sans-serif, system-ui, sans-serif`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Work+Sans:wght@100..900&family=IBM+Plex+Mono:wght@400;500&display=swap`,
  },
  {
    id: "public-sans",
    label: "Public Sans — civic institutional",
    vibe: ["institutional", "serious", "government", "trustworthy"],
    sans: `"Public Sans", ui-sans-serif, system-ui, sans-serif`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Public+Sans:wght@100..900&family=IBM+Plex+Mono:wght@400;500&display=swap`,
  },
  {
    id: "ibm-plex",
    label: "IBM Plex — engineered enterprise",
    vibe: ["enterprise", "engineered", "systematic", "industrial"],
    sans: `"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap`,
  },
  {
    id: "source-sans",
    label: "Source Sans 3 — documentation calm",
    vibe: ["documentation", "calm", "readable", "quiet"],
    sans: `"Source Sans 3", ui-sans-serif, system-ui, sans-serif`,
    mono: `"Source Code Pro", ui-monospace, monospace`,
    importUrl: `${GF}?family=Source+Sans+3:wght@300..900&family=Source+Code+Pro:wght@400;500&display=swap`,
  },
  {
    id: "lexend",
    label: "Lexend — accessible airy",
    vibe: ["accessible", "airy", "health", "education"],
    sans: `"Lexend", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Lexend:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "outfit-inter",
    label: "Outfit display / Inter body — geometric headline",
    vibe: ["geometric", "display", "brandable", "modern"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Outfit", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Outfit:wght@300..800&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "space-grotesk-inter",
    label: "Space Grotesk display / Inter body — technical distinctive",
    vibe: ["technical", "distinctive", "crypto", "developer"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Space Grotesk", ui-sans-serif, system-ui, sans-serif`,
    mono: `"Space Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Space+Grotesk:wght@300..700&family=Inter:wght@100..900&family=Space+Mono:wght@400;700&display=swap`,
  },
  {
    id: "sora-inter",
    label: "Sora display / Inter body — futurist clean",
    vibe: ["futurist", "ai", "clean", "sharp"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Sora", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Sora:wght@100..800&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "bricolage-inter",
    label: "Bricolage Grotesque display / Inter body — expressive editorial",
    vibe: ["expressive", "editorial", "bold", "creative"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "schibsted",
    label: "Schibsted Grotesk — sharp news",
    vibe: ["news", "sharp", "media", "dense"],
    sans: `"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Schibsted+Grotesk:wght@400..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "fraunces-inter",
    label: "Fraunces display / Inter body — premium editorial serif",
    vibe: ["premium", "editorial", "luxury", "serif", "hospitality"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Fraunces", ui-serif, Georgia, serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "playfair-source",
    label: "Playfair Display / Source Sans body — classic luxury",
    vibe: ["classic", "luxury", "elegant", "traditional"],
    sans: `"Source Sans 3", ui-sans-serif, system-ui, sans-serif`,
    display: `"Playfair Display", ui-serif, Georgia, serif`,
    mono: `"Source Code Pro", ui-monospace, monospace`,
    importUrl: `${GF}?family=Playfair+Display:wght@400..900&family=Source+Sans+3:wght@300..900&family=Source+Code+Pro:wght@400;500&display=swap`,
  },
  {
    id: "newsreader-inter",
    label: "Newsreader display / Inter body — literary calm",
    vibe: ["literary", "calm", "reading", "serif"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Newsreader", ui-serif, Georgia, serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Newsreader:opsz,wght@6..72,300..700&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "lora-work",
    label: "Lora display / Work Sans body — warm serif humanist",
    vibe: ["warm", "serif", "wellness", "organic"],
    sans: `"Work Sans", ui-sans-serif, system-ui, sans-serif`,
    display: `"Lora", ui-serif, Georgia, serif`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Lora:wght@400..700&family=Work+Sans:wght@100..900&family=IBM+Plex+Mono:wght@400;500&display=swap`,
  },
  {
    id: "instrument",
    label: "Instrument Serif display / Instrument Sans body — stylish accent serif",
    vibe: ["stylish", "portfolio", "modern-serif", "distinctive"],
    sans: `"Instrument Sans", ui-sans-serif, system-ui, sans-serif`,
    display: `"Instrument Serif", ui-serif, Georgia, serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "crimson-inter",
    label: "Crimson Pro display / Inter body — academic",
    vibe: ["academic", "research", "serif", "serious"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"Crimson Pro", ui-serif, Georgia, serif`,
    mono: `"JetBrains Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=Crimson+Pro:wght@300..700&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap`,
  },
  {
    id: "mono-terminal",
    label: "IBM Plex Mono display / Inter body — terminal ops",
    vibe: ["terminal", "ops", "console", "monospace", "hacker"],
    sans: `"Inter", ui-sans-serif, system-ui, sans-serif`,
    display: `"IBM Plex Mono", ui-monospace, monospace`,
    mono: `"IBM Plex Mono", ui-monospace, monospace`,
    importUrl: `${GF}?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@100..900&display=swap`,
  },
] as const;

export function getFontPairing(id: string): FontPairing | undefined {
  return FONT_PAIRINGS.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Status color sets
// ---------------------------------------------------------------------------

/**
 * Solid status colors per mode, in OKLCH channel form. The compiler derives
 * foregrounds, subtle backgrounds, and subtle foregrounds from these anchors
 * and then contrast-fixes every pair.
 */
export interface StatusAnchor {
  l: number;
  c: number;
  h: number;
}

export interface StatusSet {
  id: DnaStatusSetId;
  label: string;
  light: {
    success: StatusAnchor;
    warning: StatusAnchor;
    destructive: StatusAnchor;
    info: StatusAnchor;
  };
  dark: {
    success: StatusAnchor;
    warning: StatusAnchor;
    destructive: StatusAnchor;
    info: StatusAnchor;
  };
}

export const STATUS_SETS: readonly StatusSet[] = [
  {
    id: "signal",
    label: "Signal — clear, calibrated status hues",
    light: {
      success: { l: 0.58, c: 0.15, h: 152 },
      warning: { l: 0.68, c: 0.15, h: 70 },
      destructive: { l: 0.577, c: 0.215, h: 27 },
      info: { l: 0.56, c: 0.14, h: 245 },
    },
    dark: {
      success: { l: 0.68, c: 0.14, h: 152 },
      warning: { l: 0.75, c: 0.14, h: 75 },
      destructive: { l: 0.66, c: 0.19, h: 25 },
      info: { l: 0.66, c: 0.13, h: 245 },
    },
  },
  {
    id: "muted",
    label: "Muted — restrained, low-chroma status hues",
    light: {
      success: { l: 0.56, c: 0.09, h: 155 },
      warning: { l: 0.64, c: 0.1, h: 72 },
      destructive: { l: 0.56, c: 0.15, h: 26 },
      info: { l: 0.55, c: 0.09, h: 248 },
    },
    dark: {
      success: { l: 0.66, c: 0.08, h: 155 },
      warning: { l: 0.72, c: 0.09, h: 76 },
      destructive: { l: 0.64, c: 0.13, h: 25 },
      info: { l: 0.65, c: 0.08, h: 248 },
    },
  },
  {
    id: "vivid",
    label: "Vivid — saturated, energetic status hues",
    light: {
      success: { l: 0.6, c: 0.19, h: 150 },
      warning: { l: 0.7, c: 0.18, h: 66 },
      destructive: { l: 0.58, c: 0.24, h: 27 },
      info: { l: 0.58, c: 0.18, h: 242 },
    },
    dark: {
      success: { l: 0.7, c: 0.17, h: 150 },
      warning: { l: 0.77, c: 0.16, h: 72 },
      destructive: { l: 0.68, c: 0.21, h: 25 },
      info: { l: 0.68, c: 0.16, h: 242 },
    },
  },
] as const;

export function getStatusSet(id: DnaStatusSetId): StatusSet {
  const set = STATUS_SETS.find((s) => s.id === id);
  // Schema validation guarantees the id exists; fall back defensively anyway.
  return set ?? STATUS_SETS[0];
}

// ---------------------------------------------------------------------------
// Chart palette recipes
// ---------------------------------------------------------------------------

/**
 * Fixed categorical palette (light-mode anchors) — hue-spread, mid-chroma,
 * alternating lightness so adjacent series stay distinguishable in both
 * modes and for common color-vision deficiencies (hue + lightness deltas).
 */
export const CATEGORICAL_CHART_ANCHORS: readonly StatusAnchor[] = [
  { l: 0.55, c: 0.16, h: 252 }, // blue
  { l: 0.65, c: 0.12, h: 178 }, // teal
  { l: 0.72, c: 0.14, h: 78 }, // amber
  { l: 0.58, c: 0.16, h: 300 }, // violet
  { l: 0.62, c: 0.13, h: 150 }, // green
  { l: 0.6, c: 0.15, h: 20 }, // rose
  { l: 0.68, c: 0.11, h: 215 }, // cyan
  { l: 0.66, c: 0.14, h: 50 }, // orange
] as const;

/**
 * Hue rotations (degrees) and lightness targets for the brand-anchored
 * recipe: series 1 IS the brand; the rest orbit it with guaranteed hue or
 * lightness separation.
 */
export const BRAND_CHART_ROTATIONS: readonly { dh: number; l: number }[] = [
  { dh: 0, l: 0.55 },
  { dh: 45, l: 0.66 },
  { dh: -55, l: 0.62 },
  { dh: 160, l: 0.58 },
  { dh: 90, l: 0.7 },
  { dh: -120, l: 0.6 },
  { dh: 25, l: 0.74 },
  { dh: -155, l: 0.66 },
] as const;

/** Lightness/chroma ladder for the monochrome recipe (brand hue held). */
export const MONO_CHART_LADDER: readonly { l: number; c: number }[] = [
  { l: 0.48, c: 0.16 },
  { l: 0.56, c: 0.14 },
  { l: 0.64, c: 0.12 },
  { l: 0.72, c: 0.09 },
  { l: 0.79, c: 0.065 },
  { l: 0.85, c: 0.045 },
  { l: 0.6, c: 0.05 },
  { l: 0.4, c: 0.08 },
] as const;

// ---------------------------------------------------------------------------
// Motion presets
// ---------------------------------------------------------------------------

export interface MotionSpec {
  id: DnaMotionPreset;
  label: string;
  /** Micro-interactions: hover tints, toggles. */
  fast: string;
  /** Standard transitions: menus, popovers, accordions. */
  base: string;
  /** Large surfaces: dialogs, drawers, page-level. */
  slow: string;
  /** Default easing. */
  ease: string;
  /** Entrance/emphasis easing. */
  easeEmphasized: string;
}

export const MOTION_PRESETS: readonly MotionSpec[] = [
  {
    id: "instant",
    label: "Instant — near-zero motion, ops consoles",
    fast: "50ms",
    base: "80ms",
    slow: "120ms",
    ease: "linear",
    easeEmphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
  {
    id: "snappy",
    label: "Snappy — quick, professional (default)",
    fast: "100ms",
    base: "150ms",
    slow: "220ms",
    ease: "cubic-bezier(0.2, 0, 0, 1)",
    easeEmphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
  {
    id: "smooth",
    label: "Smooth — polished consumer product",
    fast: "140ms",
    base: "200ms",
    slow: "320ms",
    ease: "cubic-bezier(0.32, 0.72, 0, 1)",
    easeEmphasized: "cubic-bezier(0.32, 0.72, 0, 1)",
  },
  {
    id: "expressive",
    label: "Expressive — marketing, showcase surfaces",
    fast: "180ms",
    base: "280ms",
    slow: "450ms",
    ease: "cubic-bezier(0.32, 0.72, 0, 1)",
    easeEmphasized: "cubic-bezier(0.34, 1.3, 0.64, 1)",
  },
] as const;

export function getMotionPreset(id: DnaMotionPreset): MotionSpec {
  return MOTION_PRESETS.find((m) => m.id === id) ?? MOTION_PRESETS[1];
}

// ---------------------------------------------------------------------------
// Elevation (shadow) ladders
// ---------------------------------------------------------------------------

export interface ElevationLadder {
  id: DnaElevationLevel;
  /** Tailwind shadow scale, ascending. Paired light/dark values. */
  light: { xs: string; sm: string; md: string; lg: string; xl: string };
  dark: { xs: string; sm: string; md: string; lg: string; xl: string };
}

export const ELEVATION_LADDERS: readonly ElevationLadder[] = [
  {
    id: "none",
    light: { xs: "none", sm: "none", md: "none", lg: "none", xl: "none" },
    dark: { xs: "none", sm: "none", md: "none", lg: "none", xl: "none" },
  },
  {
    id: "hairline",
    light: {
      xs: "0 0 0 1px rgba(15, 23, 42, 0.05)",
      sm: "0 0 0 1px rgba(15, 23, 42, 0.06)",
      md: "0 1px 2px rgba(15, 23, 42, 0.06)",
      lg: "0 2px 8px rgba(15, 23, 42, 0.08)",
      xl: "0 4px 16px rgba(15, 23, 42, 0.1)",
    },
    dark: {
      xs: "0 0 0 1px rgba(255, 255, 255, 0.05)",
      sm: "0 0 0 1px rgba(255, 255, 255, 0.06)",
      md: "0 1px 2px rgba(0, 0, 0, 0.4)",
      lg: "0 2px 8px rgba(0, 0, 0, 0.45)",
      xl: "0 8px 24px rgba(0, 0, 0, 0.5)",
    },
  },
  {
    id: "soft",
    light: {
      xs: "0 1px 1px rgba(15, 23, 42, 0.03)",
      sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
      md: "0 2px 8px rgba(15, 23, 42, 0.05)",
      lg: "0 8px 30px rgba(15, 23, 42, 0.07)",
      xl: "0 16px 44px rgba(15, 23, 42, 0.1)",
    },
    dark: {
      xs: "0 1px 1px rgba(0, 0, 0, 0.25)",
      sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
      md: "0 2px 8px rgba(0, 0, 0, 0.35)",
      lg: "0 10px 34px rgba(0, 0, 0, 0.45)",
      xl: "0 18px 48px rgba(0, 0, 0, 0.55)",
    },
  },
  {
    id: "medium",
    light: {
      xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
      sm: "0 1px 2px -0.5px rgba(0, 0, 0, 0.05)",
      md: "0 2px 6px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)",
      lg: "0 4px 24px rgba(0, 0, 0, 0.06)",
      xl: "0 16px 48px rgba(0, 0, 0, 0.12)",
    },
    dark: {
      xs: "0 1px 2px rgba(0, 0, 0, 0.2)",
      sm: "0 1px 3px rgba(0, 0, 0, 0.22)",
      md: "0 2px 6px rgba(0, 0, 0, 0.28)",
      lg: "0 4px 24px rgba(0, 0, 0, 0.35)",
      xl: "0 18px 50px rgba(0, 0, 0, 0.55)",
    },
  },
  {
    id: "strong",
    light: {
      xs: "0 1px 3px rgba(15, 23, 42, 0.06)",
      sm: "0 2px 6px rgba(15, 23, 42, 0.08)",
      md: "0 4px 12px rgba(15, 23, 42, 0.1)",
      lg: "0 16px 48px rgba(15, 23, 42, 0.16)",
      xl: "0 24px 64px rgba(15, 23, 42, 0.2)",
    },
    dark: {
      xs: "0 1px 3px rgba(0, 0, 0, 0.3)",
      sm: "0 2px 6px rgba(0, 0, 0, 0.4)",
      md: "0 4px 12px rgba(0, 0, 0, 0.45)",
      lg: "0 18px 50px rgba(0, 0, 0, 0.6)",
      xl: "0 26px 68px rgba(0, 0, 0, 0.65)",
    },
  },
] as const;

export function getElevationLadder(id: DnaElevationLevel): ElevationLadder {
  return ELEVATION_LADDERS.find((e) => e.id === id) ?? ELEVATION_LADDERS[3];
}

// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

export interface DensitySpec {
  /** Tailwind v4 base spacing unit (all padding/gap utilities scale from this). */
  spacingUnit: string;
  /** Control heights (md / sm / lg) in rem. */
  control: string;
  controlSm: string;
  controlLg: string;
}

export const DENSITY_SPECS: Record<
  "compact" | "comfortable" | "spacious",
  DensitySpec
> = {
  compact: {
    spacingUnit: "0.225rem",
    control: "2rem",
    controlSm: "1.75rem",
    controlLg: "2.375rem",
  },
  comfortable: {
    spacingUnit: "0.25rem",
    control: "2.25rem",
    controlSm: "2rem",
    controlLg: "2.625rem",
  },
  spacious: {
    spacingUnit: "0.275rem",
    control: "2.5rem",
    controlSm: "2.25rem",
    controlLg: "2.875rem",
  },
};
