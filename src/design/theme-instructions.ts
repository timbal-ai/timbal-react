/**
 * Copy-paste into a UI-generation agent's system prompt (the leviosa
 * `timbal-ui` skill, codegen tool context, etc.) so the model offers and
 * applies themes through the package API — never by hand-authoring OKLCH.
 *
 * @example
 * ```ts
 * import { THEME_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react";
 * const systemPrompt = `${basePrompt}\n\n${THEME_AGENT_INSTRUCTIONS}`;
 * ```
 */
export const THEME_AGENT_INSTRUCTIONS = `
## Theming (@timbal-ai/timbal-react)

The package ships a complete light + dark token system (\`styles.css\`). Components are written against semantic Tailwind tokens (\`bg-background\`, \`text-primary\`, \`border-border\`, \`bg-elevated-from\`, \`bg-bubble-user\`, …). To restyle, you change CSS variables — **never** hardcode colors in component code.

### Golden rule

**Literal colors (hex / oklch / rgb) are allowed in exactly one place: the intent object passed to \`createTimbalTheme\` (\`brand\`, \`accent\`, \`chartPalette\`).** Everywhere else, reference tokens — semantic utilities in markup, \`var(--token)\` / \`color-mix(in oklab, …)\` in CSS values. The lint gate enforces exactly this split.

### Generate a full personality from one intent object

\`\`\`ts
import { createTimbalTheme, applyTimbalTheme } from "@timbal-ai/timbal-react";

const theme = createTimbalTheme({
  brand: "#4f46e5",
  accent: "#10b981",       // optional secondary accent
  radius: 0.875,           // corner roundness in rem (sets --radius + --radius-2xl)
  shadow: "soft",          // "none" | "hairline" | "soft" | "medium" | "strong"
  neutrals: { hue: 85, chroma: 0.016, lightness: 0.975 },  // canvas warmth: cream≈85, greige≈70 —
                           // derives page/cards/muted/borders in BOTH modes; hue independent of brand
  surfaces: "console",     // "panel" (default) | "console" — flat ops/terminal chrome
  defaultMode: "dark",     // the mode the app opens in (default "light")
  chartPalette: ["#7132F5", "#22d3ee", "#a78bfa"],  // --chart-1..6; keep on ONE line
  typography: {            // optional — re-skins every component's font
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    display: '"Fraunces", ui-serif, Georgia, serif',  // ALL h1–h3 (kit headings included)
    importUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400..600&display=swap",
    // mono? also supported
  },
  overrides: {             // one-offs the generator misses — token-referential ONLY
    "--sidebar-active": "var(--sidebar-accent)",
    "--card": "color-mix(in oklab, var(--foreground) 3%, var(--background))",
  },
});
applyTimbalTheme(theme);   // module scope in main.tsx / a theme.ts it imports
\`\`\`

- \`createTimbalTheme\` derives \`--primary\`, its foreground, ring, the full button gradient, and a soft playground tint from \`brand\`; \`surfaces: "console"\` flattens the sidebar into the background, brand-tints the active nav item (\`--sidebar-active\`), points \`--chart-1\` at the brand, and drops shadows to hairline.
- \`neutrals\` owns the **canvas** (page background, cards, muted surfaces, borders — both modes) from one hue, independent of \`brand\`: cream paper ≈ \`{ hue: 85, chroma: 0.016, lightness: 0.975 }\`, greige enterprise ≈ \`{ hue: 70 }\`. It wins over \`tintNeutrals\` (which only leans neutrals toward the brand hue). Never fake canvas warmth by mixing the brand into white — say it with \`neutrals\`.
- \`typography.display\` reaches **every** \`h1\`–\`h3\` (kit-rendered headings included) via \`--font-display\` — no wrapper spans needed. Body/controls stay on \`typography.sans\`.
- \`overrides\` values must be **token-referential** (\`var(--token)\`, \`color-mix(in oklab, var(--a) 12%, var(--b))\`). A literal color there **throws** — new colors are intent (\`brand\`/\`accent\`/\`chartPalette\`), so the generated theme stays the single color source. The flat map applies to both modes (token-referential values resolve per-mode automatically). The full themable token inventory is the \`:root\` block of the package's \`styles.css\` — read it before writing overrides.
- For a real company, look up the actual brand hex first (brandfetch / "<company> brand color hex").
- **Web fonts must be loaded.** \`applyTimbalTheme\` / \`TimbalThemeStyle\` inject the \`<link>\` for \`typography.importUrl\` automatically.

### Apply a theme

- **Runtime (the default path):** \`applyTimbalTheme(theme)\` at module scope injects a managed \`<style>\` before first paint and returns a disposer. Works with the \`.dark\` toggle (next-themes / ModeToggle).
- **Component:** render \`<TimbalThemeStyle theme={theme} />\` (or \`preset="indigo"\`) once near the app root.
- **\`themeToCss(theme)\`** serializes the same tokens for SSR / build tooling **outside** the app source. Do **not** paste its output into \`ui/src\` CSS — the pasted literals fail the \`theme-via-generator\` lint gate; apply at runtime instead.

### Dark-first apps

\`defaultMode: "dark"\` expresses a dark-first design as intent. Wire it into the provider — \`defaultTheme={theme.defaultMode ?? "light"}\` with \`enableSystem={false}\` (\`storageKey="timbal-theme"\`, \`attribute="class"\`). Never \`defaultTheme="system"\` (follows OS dark) and never \`forcedTheme\` (kills the toggle).

### Offer styles to the user ("show compatible styles, then apply")

Use the closed preset catalog — do not invent options:

\`\`\`ts
import { TIMBAL_THEME_PRESETS, applyThemePreset } from "@timbal-ai/timbal-react";
// TIMBAL_THEME_PRESETS: { id, label, description, swatch, tokens }[]
\`\`\`

Each preset is a **full personality** (color + radius + shadows + font), not just a color:

| Preset id | Personality |
|-----------|-------------|
| \`platform\` | Neutral monochrome, system font (the default — no brand) |
| \`indigo\` | Blue-violet, Geist, generous radius, soft shadows — analytics / ops |
| \`violet\` | Purple, Sora, rounded — product / marketing |
| \`forest\` | Green, Lexend, compact — finance / sustainability |
| \`warm\` | Orange, Lexend, friendly — consumer / creative |
| \`slate\` | Enterprise gray-blue, Inter, tight radius, hairline shadows |
| \`folio\` | Editorial serif (Fraunces) on cream paper neutrals, near-sharp corners — content / docs |
| \`carbon\` | Terminal monospace (JetBrains Mono), green accent — dev / infra |

- Pick a preset at build/config time and apply it with \`applyThemePreset(id)\` (persists to \`localStorage\` and restores on reload). Theme selection is a **developer/config** choice — do **not** surface an end-user theme picker in generated apps.

### Rules

- Generated pages use **semantic Tailwind tokens only** — never literal colors or per-element \`style={{ color }}\`.
- Light/dark mode stays the \`.dark\` class (\`next-themes attribute="class"\` or \`ModeToggle\`). Presets are **brand**, not a second dark-mode system.
- **One-off tokens go through \`overrides\` (or token-referential CSS), never hand-written literals.** \`--primary: oklch(…)\` in app CSS is the \`theme-via-generator\` anti-pattern and fails the gate.
- Chart series: pass tokens raw (\`fill="var(--chart-1)"\` — never \`hsl(var(--chart-1))\`), rebrand via \`chartPalette\` intent.
`.trim();
