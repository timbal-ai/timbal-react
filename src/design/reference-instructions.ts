/**
 * The reference-matching protocol — inject when the task includes a reference
 * screenshot / design image ("make it look like this"). Compact by design:
 * this is CORE-tier knowledge; component menus and chart specifics load
 * on demand (`APP_KIT_CATALOG`, `APP_KIT_AGENT_INSTRUCTIONS`).
 *
 * Contract-tested: every intent field this string names must exist on
 * `TimbalThemeIntent` (see reference-instructions.test.ts) so the protocol
 * can never teach fields the generator doesn't have.
 */
export const REFERENCE_AGENT_INSTRUCTIONS = `
## Matching a reference screenshot (@timbal-ai/timbal-react)

You cannot see your own rendered output. Work as: extract → plan → build → verify (lint/tsc/build) → ask for eyes → iterate on INTENT. Never claim the result matches — say what you matched, what differs, what house rules kept different. Matching is the user's verdict.

### 1. Extract a plan from the image (before any code)

Produce this structure first; every downstream decision reads from it:

- **archetype** — what kind of screen(s): dashboard / table+detail / settings / chat / docs / form flow. Pick app-kit archetypes, not ad-hoc layouts.
- **themeIntent** — one \`createTimbalTheme({ ... })\` call. Map image signals to fields:
  | Signal in the image | Intent field |
  |---|---|
  | dominant accent / CTA color | \`brand\` (look up the real brand hex when the product is known) |
  | secondary accent | \`accent\` |
  | canvas warmth — cream / greige / warm off-white vs cool | \`neutrals: { hue, chroma?, lightness? }\` (≈85 cream, ≈70 greige; hue is independent of brand) |
  | flat dark ops/terminal look | \`surfaces: "console"\` |
  | app opens dark | \`defaultMode: "dark"\` |
  | corner roundness | \`radius\` (sharp ≈0.25–0.5, default 0.75, soft ≈1+) |
  | card depth | \`shadow\` ("none"–"strong") |
  | chart series colors | \`chartPalette: [...]\` (one line) |
  | display/heading font personality | \`typography.display\` (serif/mono display — kit h1–h3 consume it automatically); body via \`typography.sans\` |
  | anything else | \`overrides\` — token-referential only (\`var()\`/\`color-mix()\`); the full token inventory is the \`:root\` block of the package's \`styles.css\` |
- **density** — \`Page density="compact"\` for dense grids; default otherwise.
- **blockPlan** — which catalog blocks build each region (check \`APP_KIT_CATALOG\`); note table columns, chart kinds, stat strips.
- **inventionPlan** — shapes with no catalog fit that you'll build on the sanctioned substrate (see the invention lane rules). Name each one.
- **nonGoals** — reference traits you will NOT reproduce, with the house rule that forbids each (topbar → Page.actions/sidebar; ALL-CAPS display → sentence case + weight/size; glows → kit elevation; bold giant metrics → font-normal size contrast). State these to the user BEFORE building — and in a one-shot run with no user channel, emit the whole extracted plan (this structure) as your first output before any code, so the host can review the tradeoffs.

### 2. Iterate on intent, not CSS

When new eyes (user / host screenshots) arrive, write a gap list, most important first, and map each gap to the SMALLEST intent change (a field tweak beats an override beats any structural change). If you are writing a CSS selector against kit markup, stop — there is a token or an intent field for it, or the gap belongs in your own composition code.

### 3. Close each round

Report: gaps closed, gaps remaining, nonGoals held. Then request the next look. Stop when the user confirms — not when you think it matches.
`.trim();
