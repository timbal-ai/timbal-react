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
  | "slate"
  | "folio"
  | "carbon";

export interface TimbalThemePreset {
  id: TimbalThemePresetId;
  /** Short human label for pickers. */
  label: string;
  /** One-line "use when" guidance — surfaced to agents in prompts. */
  description: string;
  /** Representative swatch color (CSS) for chips / previews. */
  swatch: string;
  /** Human-readable font name (for picker chips). `null` = system default. */
  font: string | null;
  /**
   * Full personality token set — color + radius + shadow + typography.
   * `platform` is the shipped neutral palette and has empty maps (no overrides;
   * `styles.css` defaults apply).
   */
  tokens: TimbalThemeTokens;
}

const EMPTY_TOKENS: TimbalThemeTokens = { light: {}, dark: {}, root: {} };

// Google Fonts stylesheet URLs (loaded on demand by applyTimbalTheme / TimbalThemeStyle).
const FONT_URL = {
  geist: "https://fonts.googleapis.com/css2?family=Geist:wght@400..600&display=swap",
  sora: "https://fonts.googleapis.com/css2?family=Sora:wght@400..600&display=swap",
  lexend: "https://fonts.googleapis.com/css2?family=Lexend:wght@400..600&display=swap",
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400..600&display=swap",
  fraunces:
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&display=swap",
  jetbrains:
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..600&display=swap",
} as const;

const STACK = {
  geist: '"Geist", ui-sans-serif, system-ui, sans-serif',
  sora: '"Sora", ui-sans-serif, system-ui, sans-serif',
  lexend: '"Lexend", ui-sans-serif, system-ui, sans-serif',
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fraunces: '"Fraunces", ui-serif, Georgia, "Times New Roman", serif',
  jetbrains: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const TIMBAL_THEME_PRESETS: readonly TimbalThemePreset[] = [
  {
    id: "platform",
    label: "Platform",
    description:
      "Shipped neutral monochrome — the Timbal Platform default. Calm, brand-agnostic, system font.",
    swatch: "oklch(0.205 0 0)",
    font: null,
    tokens: EMPTY_TOKENS,
  },
  {
    id: "indigo",
    label: "Indigo",
    description:
      "Cool, trustworthy blue-violet, Geist type, generous radius, soft shadows — analytics & ops dashboards.",
    swatch: "#4f46e5",
    font: "Geist",
    tokens: createTimbalTheme({
      brand: "#4f46e5",
      radius: 0.875,
      shadow: "soft",
      typography: { sans: STACK.geist, importUrl: FONT_URL.geist },
    }),
  },
  {
    id: "violet",
    label: "Violet",
    description:
      "Vivid purple, Sora type, rounded, soft shadows — expressive product / marketing surfaces.",
    swatch: "#7c3aed",
    font: "Sora",
    tokens: createTimbalTheme({
      brand: "#7c3aed",
      radius: 1,
      shadow: "soft",
      typography: { sans: STACK.sora, importUrl: FONT_URL.sora },
    }),
  },
  {
    id: "forest",
    label: "Forest",
    description:
      "Grounded green, Lexend type, compact radius — finance, sustainability, status-positive apps.",
    swatch: "#16a34a",
    font: "Lexend",
    tokens: createTimbalTheme({
      brand: "#16a34a",
      radius: 0.625,
      shadow: "soft",
      typography: { sans: STACK.lexend, importUrl: FONT_URL.lexend },
    }),
  },
  {
    id: "warm",
    label: "Warm",
    description:
      "Energetic orange, Lexend type, friendly radius — consumer, creative, high-engagement tools.",
    swatch: "#ea580c",
    font: "Lexend",
    tokens: createTimbalTheme({
      brand: "#ea580c",
      radius: 0.875,
      shadow: "soft",
      typography: { sans: STACK.lexend, importUrl: FONT_URL.lexend },
    }),
  },
  {
    id: "slate",
    label: "Slate",
    description:
      "Muted enterprise gray-blue, Inter type, tight radius, hairline shadows, tinted neutrals.",
    swatch: "#475569",
    font: "Inter",
    tokens: createTimbalTheme({
      brand: "#475569",
      radius: 0.5,
      shadow: "hairline",
      tintNeutrals: true,
      typography: { sans: STACK.inter, importUrl: FONT_URL.inter },
    }),
  },
  {
    id: "folio",
    label: "Folio",
    description:
      "Editorial serif (Fraunces), near-sharp corners, hairline shadows — content / docs / reports.",
    swatch: "#9a3412",
    font: "Fraunces",
    tokens: createTimbalTheme({
      brand: "#9a3412",
      radius: 0.25,
      shadow: "hairline",
      typography: { sans: STACK.fraunces, importUrl: FONT_URL.fraunces },
    }),
  },
  {
    id: "carbon",
    label: "Carbon",
    description:
      "Terminal monospace (JetBrains Mono), crisp corners, green accent — developer / infra tools.",
    swatch: "#15803d",
    font: "JetBrains Mono",
    tokens: createTimbalTheme({
      brand: "#15803d",
      radius: 0.375,
      shadow: "hairline",
      typography: { sans: STACK.jetbrains, importUrl: FONT_URL.jetbrains },
    }),
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
