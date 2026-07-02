import { applyTimbalTheme, createTimbalTheme } from "@timbal-ai/timbal-react";

/**
 * Log Sentinel — dark ops-console personality.
 *
 * - `surfaces: "console"` flattens the sidebar into the page, brand-tints the
 *   active nav item, points --chart-1 at the brand, and drops shadows to
 *   hairline — the pro terminal look.
 * - Single saturated purple leads every chart (chart-1); companions are muted
 *   violet / amber / gray so severity reads as tone, not rainbow.
 */
export const theme = createTimbalTheme({
  brand: "#7132F5",
  surfaces: "console",
  defaultMode: "dark",
  radius: 0.5,
  chartPalette: ["#7132F5", "#9d8cf0", "#c9913f", "#69707d", "#54346b", "#8a90a2"],
  typography: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    importUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400..600&display=swap",
  },
});

applyTimbalTheme(theme);
