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

### Pick a brand color (rebrand)

\`\`\`ts
import { createTimbalTheme, themeToCss } from "@timbal-ai/timbal-react";

const theme = createTimbalTheme({ brand: "#4f46e5" /* accent?, radius?, tintNeutrals? */ });
// Build-time: write once into your app CSS (paired light + dark, guaranteed in sync):
const css = themeToCss(theme);
\`\`\`

- For a real company, look up the actual brand hex first (brandfetch / "<company> brand color hex"), then pass it as \`brand\`.
- \`createTimbalTheme\` derives \`--primary\`, its foreground, ring, the full button gradient, and a soft playground tint. You only supply intent.

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

| Preset id | Use when |
|-----------|----------|
| \`platform\` | Neutral monochrome default (no brand) |
| \`indigo\` | Cool, trustworthy — analytics / ops dashboards |
| \`violet\` | Expressive purple — product / marketing |
| \`forest\` | Green — finance, sustainability, positive status |
| \`warm\` | Orange — consumer / creative / high-engagement |
| \`slate\` | Muted enterprise gray-blue (tinted neutrals) |

- To present options visually, render \`<ThemePresetGallery value={id} onSelect={setId} />\` — each swatch previews real components (Button + metric tile) scoped via \`data-timbal-theme\`, so the live app doesn't change until the user picks.
- On selection, call \`applyThemePreset(id)\` (persists to \`localStorage\` and restores on reload).

### Rules

- Generated pages use **semantic Tailwind tokens only** — never literal colors or per-element \`style={{ color }}\`.
- Light/dark mode stays the \`.dark\` class (\`next-themes attribute="class"\` or \`ModeToggle\`). Presets are **brand**, not a second dark-mode system.
- Override individual tokens only for one-offs the generator doesn't cover; if you must, set the variable in **both** \`:root\` and \`.dark\` (a dev-only warning fires otherwise).
`.trim();
