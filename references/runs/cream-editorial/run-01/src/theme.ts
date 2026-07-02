import { applyTimbalTheme, createTimbalTheme } from "@timbal-ai/timbal-react";

/**
 * Marginalia — cream-editorial theme.
 *
 * Intent: warm cream paper (not white, not gray), serif display type over a
 * humanist sans body, hairline rules instead of drop shadows, and a single
 * desaturated terracotta accent. Charts stay monochrome-warm via the palette.
 *
 * - `tintNeutrals` + the token-referential `--background` override pull the
 *   page toward cream paper without hand-authoring any literal token.
 * - `surfaces: "console"` merges the sidebar into the page background (the
 *   quiet, flat editorial rail) and keeps chrome flat.
 * - `--card: var(--background)` keeps every card on the same paper tone —
 *   no white cards floating on cream.
 */
export const marginaliaTheme = createTimbalTheme({
  brand: "#a35135",
  radius: 0.375,
  shadow: "hairline",
  tintNeutrals: true,
  surfaces: "console",
  defaultMode: "light",
  chartPalette: ["#a35135", "#bf7f63", "#6b5d52", "#d9b8a7", "#8a7364", "#e9dccf"],
  typography: {
    sans: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    display: '"Fraunces", "Iowan Old Style", Georgia, serif',
    importUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Source+Sans+3:ital,wght@0,400..600;1,400..600&display=swap",
  },
  overrides: {
    "--background": "color-mix(in oklab, var(--primary) 5%, var(--popover))",
    "--card": "var(--background)",
  },
});

// Module-scope apply: injects the managed <style> (and the font <link>)
// before first paint. Imported once from main.tsx.
applyTimbalTheme(marginaliaTheme);
