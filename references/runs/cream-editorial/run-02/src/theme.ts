import { applyTimbalTheme, createTimbalTheme } from "@timbal-ai/timbal-react";

/**
 * Marginalia — cream-editorial personality.
 *
 * - brand: one desaturated warm terracotta/ink accent (links + the single
 *   primary action; progress and stats inherit tints of it).
 * - neutrals: cream paper canvas (page, cards, muted surfaces, borders) —
 *   NOT white, NOT gray.
 * - shadow "none": hairline rules instead of card shadows.
 * - radius: near-sharp editorial corners.
 * - chartPalette: monochrome-warm terracotta family (never the shipped blues).
 * - overrides (token-referential only): cards/elevated/sidebar sit on the SAME
 *   paper tone as the page — no white cards on cream — and the active nav item
 *   is a flat quiet fill.
 */
export const theme = createTimbalTheme({
  brand: "#9a5b44",
  radius: 0.375,
  shadow: "none",
  neutrals: { hue: 85, chroma: 0.016, lightness: 0.975 },
  chartPalette: ["#9a5b44", "#b98a70", "#77543f"],
  typography: {
    sans: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    display: '"Fraunces", ui-serif, Georgia, serif',
    importUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Source+Sans+3:ital,wght@0,400..600;1,400..600&display=swap",
  },
  overrides: {
    "--card": "var(--background)",
    "--elevated-from": "var(--background)",
    "--elevated-to": "var(--background)",
    "--sidebar": "var(--background)",
    "--sidebar-active": "var(--sidebar-accent)",
  },
});

applyTimbalTheme(theme);
