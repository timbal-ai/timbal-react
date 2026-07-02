/**
 * CORE-tier agent instructions — the compact knowledge surface that fits a
 * small token budget (size is test-enforced, see core-instructions.test.ts).
 *
 * Tiering contract: CORE is always injected; everything else loads on demand
 * from files shipped in the package (`dist/prompts/*.md`, `dist/styles.css`,
 * `dist/*.d.ts`) or from `APP_KIT_CATALOG`. CORE therefore contains: the
 * surface/archetype decision, EVERY house rule (one-liners, rendered from
 * `HOUSE_RULES` so prompt and linter never drift), the retry-killing API
 * gotchas, and the routing table to the on-demand layers — nothing else.
 */

import { HOUSE_RULES } from "../design/ui-vocabulary";

const RULE_LINES = HOUSE_RULES.map((r) => `- ${r.rule}`).join("\n");

export const APP_KIT_CORE_INSTRUCTIONS = `
## Timbal UI — core (@timbal-ai/timbal-react)

The package does the heavy lifting: shells, ~60 primitives, blocks, charts, tokens, motion. Compose it; never rebuild it. It is the API truth — verify any uncertain export/prop in \`node_modules/@timbal-ai/timbal-react/dist/*.d.ts\` (grep the .d.ts; NEVER import/execute the package to introspect — it boots the whole runtime and hangs).

### Pick the surface, then the archetype

Chat-first → \`TimbalChatShell\`/\`TimbalChat\`. Anything showing data/settings/admin → the app kit. Data app that also wants an assistant → app kit + self-mounting \`<AppCopilot workforceId="…" />\` (floating overlay, never a second column, never a topbar button).

| Archetype | When | Shape |
|---|---|---|
| Sidebar dashboard | multi-section product | \`AppShell sidebar={<StudioSidebar items selectedId onSelect/>}\` + \`Page\`→\`Section\` |
| Focused / no-chrome | single tool | \`AppShell\` (no sidebar) + \`Page width="narrow"|"prose"\` |
| Bento overview | at-a-glance home | \`Page\` + asymmetric grid of \`SurfaceCard\`/\`ChartPanel\`/\`StatTile\` |
| Split master–detail | inbox / triage / browser | \`AppShell contentFill\` + \`Page fill\` + two-pane flex, panes \`min-h-0 overflow-y-auto\` |
| Full-page chat / canvas | full-bleed surface | \`AppShell contentFill\` + headerless \`Page fill\` + \`min-h-0 flex-1\` child |
| Section-switcher | one page, several views | \`SubNav\` / \`PillSegmentedTabs trackVariant="flush"\` |

Mix and vary (grid, density, sidebar-or-not) — two domains should not produce the same screen. Never a global topbar.

### House rules (linted — the gate checks exactly this list)

${RULE_LINES}

### Theming in one line

Express intent, never author tokens: \`createTimbalTheme({ brand, accent?, neutrals?, radius?, shadow?, surfaces?, defaultMode?, chartPalette?, typography?, overrides? })\` + \`applyTimbalTheme(theme)\` at module scope. Literal colors ONLY inside that intent; \`overrides\` are token-referential (\`var()\`/\`color-mix()\`). Details: theme layer (below). Task has a reference screenshot → load the reference layer FIRST.

### API gotchas (retry killers — don't guess, don't retry variations)

- **Host CSS wiring** (the #1 unstyled-app cause) — the app's \`index.css\` is exactly three lines: \`@import "tailwindcss";\` then \`@import "@timbal-ai/timbal-react/styles.css";\` then \`@source "../node_modules/@timbal-ai/timbal-react/dist";\` (adjust the relative depth to your CSS file's location).
- App-kit surfaces (\`Page\`, \`Section\`, \`AppShell\`, \`DataTable\`, \`StatusBadge\`, \`MetricRow\`, \`StatTile\`, blocks) import from **\`/app\` or the root — not \`/ui\`** (wrong subpath = runtime blank page). \`/ui\` = base primitives (\`Button\`, \`Input\`, \`Select\`, \`Dialog\`, \`Progress\`, …). Root re-exports everything.
- No \`Tabs\` export (use \`SubNav\`/\`PillSegmentedTabs\`); no \`AppShell topbar\` (hard lint error); \`fill\` lives on \`Page\` only; \`Field*\` controls **require \`label\`** (label-less → \`FilterField\`/\`SearchInput\`); \`WorkforceSelector\` is controlled (\`workforces\`+\`value\`+\`onChange\`, no fetching).
- Chart series: \`dataKey\` must be a safe identifier (human name goes in \`label\`); pass tokens raw (\`fill="var(--chart-1)"\`, never \`hsl(var(--…))\`).
- A prop that type-errors twice → read \`dist/app.d.ts\` once instead of a third guess.
- Icons: \`lucide-react\` ships with the package — import it directly (no need to add it as an app dependency).

### On-demand layers — pull ONLY what the task needs

| Need | Read |
|---|---|
| Full component menu, blocks, recipes, layout detail, a11y | \`node_modules/@timbal-ai/timbal-react/dist/prompts/appkit.md\` |
| Theming detail (intent fields, presets, dark-first wiring) | \`dist/prompts/theme.md\` |
| Matching a reference screenshot (protocol) | \`dist/prompts/reference.md\` |
| Themable token inventory | \`dist/styles.css\` (\`:root\` block) |
| Exact props / exports | \`dist/*.d.ts\` (grep) |
| Machine-readable component index (\`importFrom\` guaranteed) | \`APP_KIT_CATALOG\` (typed export) |
`.trim();
