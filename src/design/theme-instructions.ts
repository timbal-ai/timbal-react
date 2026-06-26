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

**Never write \`oklch(...)\` / hex literals or hand-author paired \`:root\` + \`.dark\` blocks.** Express intent and let the package derive a complete, contrast-correct, paired palette.

### Generate a full personality (color + roundness + fonts + shadows)

\`\`\`ts
import { createTimbalTheme, themeToCss } from "@timbal-ai/timbal-react";

const theme = createTimbalTheme({
  brand: "#4f46e5",
  radius: 0.875,          // corner roundness in rem (sets --radius + --radius-2xl)
  shadow: "soft",         // "none" | "hairline" | "soft" | "medium" | "strong"
  tintNeutrals: false,    // tint background/border toward the brand hue
  accent: "#10b981",      // optional secondary accent
  typography: {           // optional — re-skins every component's font
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400..600&display=swap",
    // display?, mono? also supported
  },
});
const css = themeToCss(theme); // paired light + dark, guaranteed in sync
\`\`\`

- \`createTimbalTheme\` derives \`--primary\`, its foreground, ring, the full button gradient, and a soft playground tint from \`brand\`. \`radius\` sets roundness, \`shadow\` sets card depth, \`typography\` sets fonts. You only supply intent — never raw OKLCH.
- For a real company, look up the actual brand hex first (brandfetch / "<company> brand color hex").
- **Web fonts must be loaded.** \`applyTimbalTheme\` / \`TimbalThemeStyle\` inject the \`<link>\` for \`typography.importUrl\` automatically. For build-time \`themeToCss\`, add the \`<link rel="stylesheet" href="…">\` to your \`index.html\` yourself (or pass \`themeToCss(theme, { includeFontImport: true })\` when the result is a standalone stylesheet).

### Apply a theme

- **Build-time / SSR:** \`themeToCss(theme)\` → paste the returned CSS into your \`index.css\` (after the \`@import "@timbal-ai/timbal-react/styles.css"\`). One block, both modes.
- **Runtime / swappable:** \`applyTimbalTheme(theme)\` injects a managed \`<style>\` and returns a disposer. Works with the \`.dark\` toggle (next-themes / ModeToggle).
- **Component:** render \`<TimbalThemeStyle theme={theme} />\` (or \`preset="indigo"\`) once near the app root.

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
| \`folio\` | Editorial serif (Fraunces), near-sharp corners — content / docs |
| \`carbon\` | Terminal monospace (JetBrains Mono), green accent — dev / infra |

- Pick a preset at build/config time and apply it with \`applyThemePreset(id)\` (persists to \`localStorage\` and restores on reload). Theme selection is a **developer/config** choice — do **not** surface an end-user theme picker in generated apps.

### Rules

- Generated pages use **semantic Tailwind tokens only** — never literal colors or per-element \`style={{ color }}\`.
- Light/dark mode stays the \`.dark\` class (\`next-themes attribute="class"\` or \`ModeToggle\`). Presets are **brand**, not a second dark-mode system.
- Override individual tokens only for one-offs the generator doesn't cover; if you must, set the variable in **both** \`:root\` and \`.dark\` (a dev-only warning fires otherwise).
`.trim();
