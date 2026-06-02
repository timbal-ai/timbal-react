/**
 * Curated brand presets — a small, closed catalog so agents (and pickers) can
 * *list* and *apply* styles by stable ID instead of inventing colors. Each
 * preset is generated through `createTimbalTheme`, so light/dark stay paired
 * and contrast-correct by construction.
 *
 * Keep this list short and well-tested. A handful of strong presets beats an
 * infinite palette for both humans and models.
 */

import {
  applyTimbalTheme,
  createTimbalTheme,
  type TimbalThemeTokens,
} from "./theme";
import { STORAGE_KEYS } from "./tokens";

export type TimbalThemePresetId =
  | "platform"
  | "indigo"
  | "violet"
  | "forest"
  | "warm"
  | "slate";

export interface TimbalThemePreset {
  id: TimbalThemePresetId;
  /** Short human label for pickers. */
  label: string;
  /** One-line "use when" guidance — surfaced to agents in prompts. */
  description: string;
  /** Representative swatch color (CSS) for chips / previews. */
  swatch: string;
  /**
   * Token overrides. `platform` is the shipped neutral palette and has empty
   * maps (no overrides — `styles.css` defaults apply).
   */
  tokens: TimbalThemeTokens;
}

const EMPTY_TOKENS: TimbalThemeTokens = { light: {}, dark: {}, root: {} };

export const TIMBAL_THEME_PRESETS: readonly TimbalThemePreset[] = [
  {
    id: "platform",
    label: "Platform",
    description:
      "Shipped neutral monochrome — the Timbal Platform default. Calm, brand-agnostic.",
    swatch: "oklch(0.205 0 0)",
    tokens: EMPTY_TOKENS,
  },
  {
    id: "indigo",
    label: "Indigo",
    description: "Cool, trustworthy blue-violet — good for analytics & ops dashboards.",
    swatch: "#4f46e5",
    tokens: createTimbalTheme({ brand: "#4f46e5" }),
  },
  {
    id: "violet",
    label: "Violet",
    description: "Vivid purple — expressive, product/marketing-leaning surfaces.",
    swatch: "#7c3aed",
    tokens: createTimbalTheme({ brand: "#7c3aed" }),
  },
  {
    id: "forest",
    label: "Forest",
    description: "Grounded green — finance, sustainability, status-positive apps.",
    swatch: "#16a34a",
    tokens: createTimbalTheme({ brand: "#16a34a" }),
  },
  {
    id: "warm",
    label: "Warm",
    description: "Energetic orange — consumer, creative, high-engagement tools.",
    swatch: "#ea580c",
    tokens: createTimbalTheme({ brand: "#ea580c" }),
  },
  {
    id: "slate",
    label: "Slate",
    description: "Muted cool gray-blue with a subtle tint — understated enterprise.",
    swatch: "#475569",
    tokens: createTimbalTheme({ brand: "#475569", tintNeutrals: true }),
  },
] as const;

const PRESET_BY_ID = new Map<TimbalThemePresetId, TimbalThemePreset>(
  TIMBAL_THEME_PRESETS.map((preset) => [preset.id, preset]),
);

/** Look up a preset by id. */
export function getThemePreset(
  id: TimbalThemePresetId,
): TimbalThemePreset | undefined {
  return PRESET_BY_ID.get(id);
}

/**
 * Apply a preset at runtime via {@link applyTimbalTheme} and persist the
 * choice to `localStorage` so it can be restored on reload. Returns a disposer.
 * No-op for unknown ids or in SSR.
 */
export function applyThemePreset(id: TimbalThemePresetId): () => void {
  const preset = PRESET_BY_ID.get(id);
  if (!preset) return () => {};
  // Lazy import avoids a hard dependency cycle in tree-shaken builds.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEYS.themePreset, id);
    } catch {
      // ignore quota / private mode
    }
  }
  return applyTimbalTheme(preset.tokens);
}

/** Read the persisted preset id (or null). */
export function getStoredThemePreset(): TimbalThemePresetId | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.themePreset);
    return value && PRESET_BY_ID.has(value as TimbalThemePresetId)
      ? (value as TimbalThemePresetId)
      : null;
  } catch {
    return null;
  }
}
