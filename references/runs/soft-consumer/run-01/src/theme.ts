import { applyTimbalTheme, createTimbalTheme } from "@timbal-ai/timbal-react";

/**
 * "Ritual" — wellness-consumer personality (Headspace / Calm / Oak family):
 *
 * - warm off-white canvas (`neutrals` owns the page/cards/borders warmth)
 * - terracotta brand + sage accent, multi-tint pastel chart family — no hard blues
 * - very rounded: radius 1.25rem → cards land at --radius-2xl = 1.5rem (24px)
 * - soft diffuse shadows
 * - rounded humanist sans (Nunito) with a cheerful display face (Baloo 2)
 * - minimal, bottom-tab-like rail: the sidebar flattens into the warm page
 *   via token-referential overrides
 */
export const theme = createTimbalTheme({
  brand: "#e07a5f",
  accent: "#81b29a",
  radius: 1.25,
  shadow: "soft",
  neutrals: { hue: 78, chroma: 0.015, lightness: 0.978 },
  chartPalette: ["#e08a6d", "#8fbc9f", "#e9c46a", "#b99bd3", "#e5989b", "#8fb8ad"],
  typography: {
    sans: '"Nunito", ui-sans-serif, system-ui, sans-serif',
    display: '"Baloo 2", "Nunito", ui-sans-serif, system-ui, sans-serif',
    importUrl:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400..800&family=Baloo+2:wght@500..700&display=swap",
  },
  overrides: {
    "--sidebar": "var(--background)",
    "--sidebar-border": "var(--background)",
  },
});

applyTimbalTheme(theme);
