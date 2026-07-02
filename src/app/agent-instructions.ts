import { HOUSE_RULES, SLOP_BUDGETS } from "../design/ui-vocabulary";
import { APP_KIT_CATALOG, type CatalogEntry } from "./catalog";

/**
 * Anti-slop checklist rendered from the shared `HOUSE_RULES` vocabulary so the
 * prompt the model reads and the linter (`lintGeneratedUi`) it is checked
 * against never drift apart. Each rule shows a slop vs. good fragment when one
 * exists.
 */
const ANTI_SLOP_CHECKLIST = HOUSE_RULES.map((r) => {
  const pair =
    r.slop && r.good
      ? `\n  - slop: \`${r.slop}\`\n  - good: \`${r.good}\``
      : "";
  return `- **${r.id}** — ${r.rule} (${r.why})${pair}`;
}).join("\n");

/**
 * Block + primitive listings rendered **from `APP_KIT_CATALOG`** so the import
 * paths the model sees never drift from what the package actually exports (a
 * contract test asserts every entry resolves). Blocks lead — agents should
 * import them, not rebuild — and each carries its exact import + a source path
 * to fork. Primitives follow, grouped by category.
 */
const importLine = (entry: CatalogEntry) =>
  `import { ${entry.exports.join(", ")} } from "${entry.importFrom}";`;

const BLOCK_CATALOG_LISTING = APP_KIT_CATALOG.filter((e) => e.kind === "block")
  .map(
    (e) =>
      `- **${e.name}** — ${e.description}\n  - \`${importLine(e)}\`\n  - composes: ${e.composedOf?.join(", ") ?? "—"}\n  - when: ${e.whenToUse}\n  - fork: \`${e.source}\``,
  )
  .join("\n");

const PRIMITIVE_CATALOG_LISTING = [
  ...new Set(
    APP_KIT_CATALOG.filter((e) => e.kind === "primitive").map((e) => e.category),
  ),
]
  .map((category) => {
    const rows = APP_KIT_CATALOG.filter(
      (e) => e.kind === "primitive" && e.category === category,
    )
      .map(
        (e) =>
          `- \`${e.exports.join(", ")}\` (\`${e.importFrom}\`) — ${e.description}`,
      )
      .join("\n");
    return `**${category}**\n${rows}`;
  })
  .join("\n\n");

/**
 * Copy-paste into a workforce agent system prompt (or codegen tool context) so the
 * model knows which app-kit components exist and how to compose them — without
 * copying a single reference layout.
 *
 * @example
 * ```ts
 * import { APP_KIT_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react/app";
 *
 * const systemPrompt = `${basePrompt}\n\n${APP_KIT_AGENT_INSTRUCTIONS}`;
 * ```
 */
export const APP_KIT_AGENT_INSTRUCTIONS = `
## App kit (@timbal-ai/timbal-react/app)

Build **dashboard and operations UIs** with React components. Import from \`@timbal-ai/timbal-react/app\` (or the main package entry if your app already uses it).

### Creative freedom (read this first)

You are **not** required to copy any example layout, page title, section order, or visual theme.

- **Do** invent layouts that fit the user's domain (CRM, inventory, billing, internal tools, etc.).
- **Do** pick only the components you need; skip shell, sidebar, or copilot when the task does not need them.
- **Do** vary density, grid columns, navigation patterns, and copy — as long as you follow the **design guidelines** below.
- **Do not** treat \`examples/app-kit/src/reference/\` as a template to clone (no default "Operations" dashboard with sidebar + three KPI tiles + SubNav + table unless the user asked for that).
- **Do** use \`examples/app-kit/src/recipes/\` as **short grammar examples** (one concern per file), not as a full app blueprint.

When in doubt: compose from the **component menu** + **guidelines**, then adapt creatively to the request.

### The invention lane (bespoke components are legitimate — here are the rules)

When **no catalog block has the anatomy you need** (a pull-quote, an annotated reading row, a stepper variant, a domain-specific card), building a bespoke component is the **sanctioned** path — not slop. The rules that keep it on-system:

1. **Substrate:** compose from kit primitives (\`SurfaceCard\`, \`Stack\`, \`Field*\`, \`Badge\`, …) and semantic tokens (\`text-foreground\`, \`bg-muted\`, \`border-border\`, \`text-muted-foreground\`). Anything interactive rides the kit control classes — never a hand-styled \`<input>\`/\`<button>\`.
2. **Zero literal colors** and no glow/gradient tricks — bespoke code passes the exact same lint gate as everything else.
3. **Check the catalog first** (\`APP_KIT_CATALOG\`) and prefer **props over forks**: don't rebuild a near-fit block to change one slot.
4. **Second use = extract.** The moment you copy your own bespoke shape into a second place, pull it into one shared component (\`src/components/\`), props for the differences.

Name your bespoke components in your plan/summary so the host can track recurring shapes — shapes that recur across projects get productized into the kit.

### Importable catalog — import, don't rebuild

This listing is generated from \`APP_KIT_CATALOG\` (exported from \`@timbal-ai/timbal-react/app\` — read it programmatically for the same data). Every entry's import path is guaranteed to resolve. **Blocks** are composed sections: prefer importing a block over re-assembling its parts. Each block names a \`fork\` source path you can copy and adapt when no prop fits.

#### Blocks (composed sections — reach for these first)

${BLOCK_CATALOG_LISTING}

#### Primitives & surfaces

${PRIMITIVE_CATALOG_LISTING}

### Layout archetypes — pick the shape that fits (don't default to one)

The most common failure is shipping the **same** layout every time: sidebar + \`Page\` + one \`MetricRow\` + one full-width \`DataTable\`. That is *one* archetype, not *the* layout. Choose deliberately — different domains want different shapes, and varying the shell/page composition is encouraged.

| Archetype | When | Compose |
|-----------|------|---------|
| **Sidebar dashboard** | Multi-section product (CRM, billing, ops) with nav | \`StudioSidebar\` in \`AppShell.sidebar\` (items: \`{ id, name, icon? }\` + \`selectedId\` + \`onSelect\`) + \`Page\` → \`Section\`. **No topbar** — AppShell renders the mobile menu itself. |
| **Focused / no-chrome** | A single tool or one-screen utility | \`AppShell\` (no sidebar) + \`Page width="narrow"\` / \`"prose"\` for a centered focused column |
| **Bento overview** | Home / at-a-glance dashboards | \`Page\` + an **asymmetric grid** of \`SurfaceCard\` / \`ChartPanel\` / \`StatTile\` spanning different widths (not a uniform row + table) |
| **Split master–detail** | Inbox, triage queue, record browser, log explorer | \`AppShell contentFill\` + \`Page fill\` + a two-column flex row, each pane \`min-h-0 overflow-y-auto\` |
| **Full-page chat / canvas** | Chat-first app, editor, map, single full-bleed surface | \`AppShell contentFill\` + headerless \`Page fill\` + a \`min-h-0 flex-1\` child (e.g. \`TimbalChat\`) |
| **Copilot overlay** | A data app that also wants an assistant | any of the above + a self-mounting \`<AppCopilot workforceId="…" />\` dropped anywhere (floating overlay, never a second column) |
| **Section-switcher** | One page, several views | \`SubNav\` / \`PillSegmentedTabs\` (\`trackVariant="flush"\`) switching panels with state/router |

Mix them: vary the grid columns, density, \`Page\` actions placement, and whether there's a sidebar at all (never a global topbar — that's a lint error). Two dashboards for two domains should not look identical.

### Shell & navigation (don't hand-roll this)

The sidebar and the mobile menu are **solved** — use them, don't rebuild them.

- **Sidebar = \`StudioSidebar\`.** It's the canonical app nav. Pass \`items\` (nav items), \`selectedId\`, and \`onSelect\`. Each item is \`{ id, name, icon? }\` — **icons are a built-in optional slot**, so wanting a per-item icon is **never** a reason to build a custom rail. Pass a \`brand\` node for the product name/logo. (\`workforces\` is a deprecated alias for \`items\`.)
- **No topbar — ever.** Do **not** pass \`AppShell topbar={…}\`; it is a hard lint error (\`no-custom-shell-chrome\`). \`AppShell\` renders its own floating mobile menu button when a sidebar is present, so you never need a top bar to open the drawer. Put global actions (account, theme, export) in \`Page.actions\` or the sidebar; surface status as dashboard content (\`StatusBadge\`/\`MetricRow\`), not a bar. An in-app assistant is a self-mounting \`<AppCopilot>\` (with \`suggestions\` for quick actions) — **never** a topbar button that opens a hand-rolled panel.
- **Never** hand-roll a \`<nav>\`/\`<aside>\` rail or a custom \`<div className="h-12 border-b">\` topbar. The linter rejects both (\`no-custom-shell-chrome\`).

\`\`\`tsx
import { LayoutDashboard, Inbox, Boxes, ScrollText } from "lucide-react";
import { StudioSidebar } from "@timbal-ai/timbal-react/studio";

<AppShell
  sidebar={
    <StudioSidebar
      brand={<span className="text-sm font-semibold">SOC Dashboard</span>}
      items={[
        { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard /> },
        { id: "inbox", name: "Alert inbox", icon: <Inbox /> },
        { id: "assets", name: "Asset inventory", icon: <Boxes /> },
        { id: "logs", name: "Log stream", icon: <ScrollText /> },
      ]}
      selectedId={view}
      onSelect={setView}
    />
  }
>
  <Page title="Dashboard" description="Real-time security operations overview">
    {/* threat level lives here as content (MetricRow / StatusBadge), NOT in a topbar */}
  </Page>
</AppShell>
\`\`\`

### In-app assistant = \`AppCopilot\` (don't hand-roll a coach/chat panel)

When a data app also needs an assistant reachable from anywhere, drop in a **self-mounting** \`<AppCopilot>\`. Do **not** build a \`Sheet\` + \`TimbalChat\` + custom \`Composer\` "coach panel", and do **not** add a topbar button to open it — \`AppCopilot\` portals its own floating glass panel + pill trigger to \`document.body\`.

- **Quick-action chips** are the \`suggestions\` prop (a \`{ title, prompt }[]\`), **not** a custom composer. Page awareness is the \`context\` prop (or \`AppCopilotProvider\`).
- **Custom open trigger** (e.g. your own button): wrap the app in \`CopilotProvider\` and call \`useCopilot()\` to open it, with \`hideTrigger\` to suppress the built-in pill — never a topbar.

\`\`\`tsx
import { AppCopilot, CopilotProvider, useCopilot } from "@timbal-ai/timbal-react/app";

function OpenCoachButton() {
  const copilot = useCopilot(); // null when no CopilotProvider is mounted
  return <Button variant="secondary" onClick={() => copilot?.setOpen(true)}>Ask the coach</Button>;
}

<CopilotProvider>
  {/* place <OpenCoachButton /> anywhere in your content (e.g. Page.actions) */}
  <AppCopilot
    workforceId="coach"
    hideTrigger
    context={{ page: pathname }}
    suggestions={[
      { title: "Weekly correlation", prompt: "Analyze my sleep vs focus correlation this week" },
      { title: "Log 500ml water", prompt: "Log 500ml of water" },
    ]}
  />
</CopilotProvider>
\`\`\`

If the default floating pill is fine, skip \`CopilotProvider\`/\`hideTrigger\` and just drop \`<AppCopilot workforceId="…" suggestions={…} context={…} />\` anywhere.

### Full-height pages (chat, canvas, split views)

The content region is a **padded scroll area** by default — great for stacked \`Page\` → \`Section\` content, wrong for a surface that must fill the viewport. For full-bleed pages:

- Pass **\`contentFill\`** to \`AppShell\` → the content region becomes a bounded, non-scrolling flex column (clipped, no bottom padding).
- Pass **\`fill\`** to \`Page\` → the page becomes a \`min-h-0 flex-1\` flex column.
- Give the filling child **\`min-h-0 flex-1\`** (or \`h-full\`) so its own scroll/footer resolves — e.g. \`<TimbalChat className="min-h-0 flex-1" />\`, or a two-pane row where each pane is \`min-h-0 overflow-y-auto\`.

\`\`\`tsx
<AppShell contentFill>                          {/* no global topbar / theme switch */}
  <Page fill>                                  {/* headerless: omit title */}
    <TimbalChat workforceId="…" className="min-h-0 flex-1" />
  </Page>
</AppShell>
\`\`\`

**Don't** size full-height content with \`h-[calc(100dvh-…)]\` (guesses chrome height → spurious scrollbar) or \`min-h-[…]\` (free-growing floor → a pinned footer like the chat composer rides down on scroll). Let \`contentFill\` + \`fill\` provide the bounded height. \`Page\` with no \`title\` renders **no header** — you don't need to abandon \`Page\` to drop a heading.

**Full-page Assistant Guidelines (Hardened Layout):**
When creating a full-page assistant/chat page, let the chat component own the layout and welcome state completely. (A *floating* copilot over a page is a different thing — that's the self-mounting \`<AppCopilot />\`, which needs no layout wiring at all.)
- **Never wrap** \`<TimbalChat>\` inside standard card or section elements (like \`<Card>\`, \`<Section>\`, or custom bordered/padded panels). Wrapping degrades the viewport height calculations and wastes valuable layout estate.
- **Never add custom headings, titles, descriptions, or status badges** (e.g., "Asistente Virtual", "Online", or subtitle text blocks) inside the page. The assistant page context is already implicit. If you need a customized title or greeting, pass it through the \`welcome\` prop config: e.g., \`<TimbalChat welcome={{ heading: "Hola, soy el Concierge de TIBA", subheading: "Pregúntame sobre..." }} />\`.

### Module layout (source folders)

Presentational groups — import from the package root, not from these paths:

| Folder | Components |
|--------|------------|
| \`data/\` | \`MetricRow\`, \`MetricChartCard\`, \`MetricTile\`, \`DataTable\`, \`FilterBar\`, \`FilterField\`, \`FilterDropdown\`, \`ChartPanel\` |
| \`integrations/\` | \`IntegrationCard\`, \`ConnectionRow\`, \`ConnectionRowList\`, \`IntegrationsEmptyState\`, \`PlanBadge\` |
| \`settings/\` | \`SettingsSection\`, \`FieldRow\`, \`DangerZone\`, \`FloatingUnsavedChangesBar\` |
| \`surfaces/\` | \`StatTile\`, \`InfoCard\`, \`AlertCard\`, \`CatalogCard\`, \`ResourceCard\`, \`DescriptionList\`, \`ExpandableSection\`, \`StatusDot\`, \`StatusBadge\`, \`EmptyState\` |
| \`layout/\` | \`AppShell\` (layout-only), \`Page\` (auto-stacks children; \`width\` ladder), \`Section\`, \`Stack\` |
| \`blocks/\` | \`FilteredDataTable\`, \`StatGrid\`, \`IntegrationsGrid\`, \`ResourceGallery\`, \`SettingsLayout\` (composed, forkable sections) |
| \`copilot/\` | \`AppCopilot\` (self-mounting floating assistant), \`CopilotProvider\`, \`useCopilot\`, \`AppCopilotProvider\` |
| \`charts\` (re-exported) | \`LineAreaChart\`, \`PieChart\`, \`RadialChart\`, \`RadarChart\`, \`Sparkline\`, \`CHART_PALETTE\` |

Also re-exported from \`/app\`: \`Button\`, \`Avatar\` / \`AvatarImage\` / \`AvatarFallback\`, \`Banner\`, \`Timeline\`, \`Kanban\` (drag-and-drop board), \`TimbalChat\`, \`ChartArtifactView\`, \`APP_KIT_AGENT_INSTRUCTIONS\`. Other UI primitives used in block recipes (\`Card\`, \`Input\`, \`Label\`, \`Sheet\`, \`Separator\`, \`AlertDialog\`, \`Badge\`, \`Select\`, …) import from \`@timbal-ai/timbal-react/ui\` or the package root — **not** from \`/app\`.

Theming helpers (import from the package root or \`/app\`): \`createTimbalTheme\`, \`themeToCss\`, \`applyTimbalTheme\`, \`TIMBAL_THEME_PRESETS\`, \`applyThemePreset\`, \`TimbalThemeStyle\`, \`THEME_AGENT_INSTRUCTIONS\`. Theming is **configured by the developer**, not surfaced as an end-user theme picker.

### Design guidelines (required)

| Area | Rule |
|------|------|
| **Copilot** | Drop in a self-mounting \`<AppCopilot workforceId="…" />\` — it portals its own floating glass panel + trigger to \`document.body\`, so it needs **no** \`AppShell\` wiring and is never a sidebar column that shrinks main content. Pass page context via the \`context\` prop (or \`AppCopilotProvider\` / \`useAppCopilotContext\`). For a custom open trigger, use controlled \`open\`/\`onOpenChange\` + \`hideTrigger\`, or wrap the app in \`CopilotProvider\` and call \`useCopilot()\`. |
| **Chat panel** | \`AppCopilot\` owns the panel (\`Thread variant="panel"\` internally). Dismiss with **X**; the built-in trigger is a SiriWave pill (label e.g. "Assistant") — **no** MessageSquare or chat icons. |
| **Context** | Do not show raw JSON context in the panel header; pass it via \`AppCopilot\`'s \`context\` prop / \`AppCopilotProvider\`. |
| **Theming** | Use semantic Tailwind tokens (\`bg-background\`, \`text-foreground\`, \`border-border\`, \`bg-elevated-from\`, etc.) from the host app's \`styles.css\`. To rebrand, **never hand-author OKLCH** — call \`createTimbalTheme({ brand, … })\` + \`applyTimbalTheme\` at runtime (don't paste \`themeToCss\` output into app CSS — the literals fail the lint gate), or apply a catalog preset (\`TIMBAL_THEME_PRESETS\` / \`applyThemePreset\`). One-off tokens: the intent's \`overrides\` (token-referential). Apply the theme **programmatically** — do **not** add an end-user theme selector to generated apps. See \`THEME_AGENT_INSTRUCTIONS\`. |
| **Layout chrome** | \`Page\` → \`Section\` for main content hierarchy. **No global topbar — ever.** \`AppShell topbar={…}\` is a hard lint error (\`no-custom-shell-chrome\`); \`AppShell\` renders the mobile menu button itself, so a topbar is never needed. Put account/theme/global actions in the \`Page\` \`actions\` slot or the sidebar. Never hand-roll a \`<nav>\`/\`<aside>\` rail or a custom topbar \`<div>\` — use \`StudioSidebar\`. |
| **Theme** | Apply the brand once with \`createTimbalTheme({ brand })\` + \`applyTimbalTheme\`. **Never** hand-author token values (\`.dark { --background: oklch(…) }\`, \`--sidebar-bg\`, \`--primary\`) or pass \`forcedTheme\` — that punches through the generator and breaks dark mode/rebranding (linted: \`theme-via-generator\`). A "cyberpunk/glowing" brief means *pick a brand color*, not *hand-paint tokens and add neon glows*. |
| **Spacing / gaps** | \`Page\` **auto-stacks its direct children with a vertical gap** — drop blocks straight in (e.g. \`Page\` → \`FilterBar\` + \`DataTable\`, or \`MetricRow\` + \`ChartPanel\`) and they breathe; do **not** wrap every block in an extra \`<div>\` (that collapses the gap). For ad-hoc clusters inside a card/row use \`Stack\` (\`gap\`, \`direction\`) instead of bare flex with no gap. Grids still need their own \`gap-*\`. |
| **Width** | \`Page\` defaults to a wide centered column. For focused / reading / form pages pass \`width\` (\`default\`, \`centered\`, \`narrow\`, \`prose\`) instead of always running full-bleed — not everything needs the full width. \`width="full"\` opts into edge-to-edge. For full-height pages that should stay centered use \`fill\` + \`fillPadded\`. |
| **Density** | Set \`density="compact"\` on \`Page\` for tighter dashboards (full-width column, smaller section gaps, card padding, metric tiles, default chart height 220). Default is \`"default"\` (platform spacing). Wrap custom layouts with \`AppDensityProvider\` when not using \`Page\`. Per-section override: \`Section density="compact"\`. Do **not** hand-tune five layers of \`className\` padding when density covers the need. |
| **Data** | Prefer \`DataTable\` with typed \`columns\` / \`rows\` / \`getRowKey\`; use \`ChartPanel\` with a \`ChartArtifact\` for charts (set \`chartType\` + options — see the chart catalog). Chart colors come from the theme \`--chart-1..6\` tokens **automatically** — usually pass nothing. **Token color contract:** \`--chart-N\` (and all kit tokens) are already full **OKLCH** colors, so reference them **directly** — \`color: "var(--chart-3)"\`, or the \`bg-chart-3\` / \`bg-[var(--chart-3)]\` utilities. **Never** wrap a token in a color function (\`hsl(var(--chart-3))\`, \`rgb(var(--primary))\`) — that's invalid CSS that \`tsc\`/build won't catch and renders a **black/empty chart** (lint: \`chart-token-color-fn\`). Pass \`series[].color\` / \`colors\` only to override, never raw hex on every series. |
| **Chart dataKeys** | Series \`dataKey\`s must be **safe identifiers** (letters/digits/\`_\`/\`-\`, no spaces or \`%\`). The chart layer maps each \`dataKey\` to a CSS var \`--color-<dataKey>\`, so \`"Water %"\` → \`--color-Water %\` (invalid) and the series renders **black** (lint: \`chart-data-key\`). Put the human name in a separate \`label\`: \`{ dataKey: "waterPct", label: "Water %" }\`. |
| **Data loading** | Wire the data, not just the layout. Use the \`loading\` prop on \`DataTable\`/\`MetricRow\`/\`ChartPanel\` for skeletons. **Never swallow fetch errors** — \`.catch(() => {})\` turns a failed request into a permanent empty skeleton with no diagnostic; at minimum log the error (and surface an \`EmptyState\`/\`Banner\`). Verify any non-trivial query returns rows before wiring it to a route. |
| **Boards** | For status/triage workflows (pipelines, sprint boards, review queues) use \`Kanban\` — pass \`columns\` (each with \`cards\`) + \`renderCard\`; handle \`onColumnsChange\`/\`onMove\` to persist. It's drag-and-drop **and** keyboard accessible; don't hand-roll columns of cards. |
| **Modals** | Use \`AppConfirmDialog\` for destructive/export confirmations. |
| **Metrics** | Overview KPIs → \`MetricRow\` or \`MetricChartCard\` (not four separate heavy cards). Values use **normal** font weight, not bold. |
| **Integrations** | Catalog → \`IntegrationCard\` grid; connected list → \`ConnectionRow\` inside \`ConnectionRowList\`. Footer CTAs: \`Button variant="secondary"\`. |
| **Anti-slop** | Follow the **anti-slop checklist** below. No loud green/red trend pills on every tile; no \`bg-card\` flat grids when platform chrome exists; avoid recycling demo names ("Operations", mock workforce lists). |

### Anti-slop checklist (required — output is linted against this)

Generated UIs are checked by \`lintGeneratedUi\` and rejected on any error. Self-review against these before returning code (icon budget: ${SLOP_BUDGETS.maxIconsPerView} per view; at most ${SLOP_BUDGETS.maxRowDividers} ruled rows before it reads as a ledger):

${ANTI_SLOP_CHECKLIST}

The cause of slop is dropping **below** the curated block layer into raw primitives + free Tailwind. Stay on the blocks; reach for primitives only when no block fits, and even then keep colors on semantic tokens.

### Accessibility (required)

| Area | Rule |
|------|------|
| **Headings** | Use \`Page\` / \`Section\` titles for hierarchy. Card titles inside premade components are already \`h3\`/\`h4\`. |
| **Selectable metrics** | \`MetricChartCard\` / \`MetricRow\` tiles are buttons with \`aria-pressed\`. Pass \`metricsAriaLabel\` when the default "Metrics" is too vague. |
| **Charts** | \`LineAreaChart\` exposes \`role="img"\` + \`aria-label\`; \`MetricChartCard\` updates the chart label when the active metric changes (\`aria-live\` on the plot region). |
| **Integration cards** | Whole-card click → \`onClick\` only (no nested footer button). With footer \`action\`, render a static \`article\` — do not wrap the CTA in a card button. Pass \`ariaLabel\` when \`name\` is not plain text. |
| **Lists** | Wrap \`ConnectionRow\` in \`ConnectionRowList\` (\`role="list"\`); rows expose \`role="listitem"\`. |
| **Status** | Pair \`StatusDot\` / \`StatusBadge\` with visible text — do not rely on color alone. |
| **Forms** | Use \`Field*\` components; errors use \`role="alert"\`. |
| **Custom labels** | \`ariaLabel\` props exist on \`MetricTile\`, \`IntegrationCard\`, \`ConnectionRow\`, \`ResourceCard\` when slots are icons or rich nodes. |

### Component menu

| Component | Use for |
|-----------|---------|
| \`AppShell\` | **Layout-only** shell: optional \`sidebar\` (use \`StudioSidebar\`) + main \`children\`. Renders its **own** floating mobile menu button when \`sidebar\` is set, so a topbar is **never** needed — **do not pass \`topbar\`** (hard lint error \`no-custom-shell-chrome\`); global actions go in \`Page.actions\`. Key prop: **\`contentFill\`** (bounded non-scrolling content region for full-bleed pages — chat/canvas/split view). The copilot is **not** a prop here — drop \`<AppCopilot>\` separately. |
| \`StudioSidebar\` | Canonical app nav (import from \`/studio\`). \`items\`: \`{ id, name, icon? }[]\` (\`workforces\` is a deprecated alias), \`selectedId\`, \`onSelect\`, \`brand\`. Optional per-item \`icon\` (lucide) for route nav — so you never hand-roll a rail. Collapsible + mobile drawer + shell sync are automatic. |
| \`AppCopilot\` | Self-mounting floating assistant: \`workforceId\`, \`welcome\`, \`suggestions\`, \`triggerLabel\`, \`context\`, controlled \`open\`/\`onOpenChange\`, \`hideTrigger\`, \`debug\`. Portals its own overlay — drop it anywhere, no shell wiring. |
| \`AppCopilotProvider\` / \`useAppCopilotContext\` | Page context for copilot-aware tools (page, filters, selection). **Prop is \`value\`, not \`context\`** (\`<AppCopilotProvider value={{ page }}>\`). You **rarely need it** — if \`<AppCopilot>\` is already mounted (e.g. in your layout), just pass its \`context\` prop; **do not** also wrap pages in \`AppCopilotProvider\` (redundant, and a wrong \`context=\` prop is a TS error). |
| \`useCopilot\` | Read/drive copilot open+expand state from a custom trigger (wrap the app in \`CopilotProvider\`). |
| \`Page\` | Page title, description, \`breadcrumbs\`, \`actions\`, \`density\` (\`"default"\` \| \`"compact"\`), children. **\`title\` is optional** — omit it for a headerless page (no \`<h1>\`). **\`fill\`** makes it a \`min-h-0 flex-1\` column for full-height content (pair with \`AppShell contentFill\`). |
| \`Section\` | Titled block inside a page: \`title\`, \`description\`, right-aligned \`actions\` (e.g. a Refresh button), children. Optional \`density\` overrides inherited page density. |
| \`SubNav\` | **Section switcher** (Overview / Reports pill bar): \`items\`, \`activeId\`, \`onChange\`. Never use Radix/shadcn \`Tabs\` — it is not in this package. Switch panels with state or the router. |
| **Menus** | **Select** = short list, no search. **Combobox** = searchable (same trigger as Select). **Command** only inside \`PopoverContent variant=\"list\"\` or Combobox — never padded default Popover. See \`examples/app-kit/src/recipes/primitives-catalog.ts\`. |
| \`Breadcrumbs\` | Trail: \`items: [{ label, href? }]\`. |
| \`Button\` | Actions. Untitled UI-style \`color\` alias (\`primary\` \\| \`secondary\` \\| \`tertiary\` \\| \`link\` \\| \`primary-destructive\` \\| \`secondary-destructive\`) + \`iconLeading\` / \`iconTrailing\`; or legacy \`variant="secondary"\` (catalog CTAs) / \`variant="default"\` (primary). \`color="primary-destructive"\` is the solid red delete CTA. |
| \`StatTile\` | Single KPI in its own card (grid of scattered stats). Prefer \`MetricRow\` for a unified overview strip. |
| \`StatusBadge\` | Status pill: \`tone\` (\`default\`\\|\`primary\`\\|\`success\`\\|\`warn\`\\|\`danger\`\\|\`muted\`), children. Use \`danger\` for critical/error severity. |
| \`FilterBar\` | Horizontal filter row — bottom-aligns controls. Mix \`SearchInput\` with labeled \`FilterField\` + \`Select\` (or \`Field\` + \`Select\`); labels sit above, control baselines match. |
| \`FilterField\` | Optional label wrapper for a filter control inside \`FilterBar\` (severity, status, …). Omit \`label\` for search-only fields. |
| \`FilterDropdown\` | Single-button **multi-facet** filter popover for dense list/table views — **data-driven**: pass \`fields\` describing your **actual columns** (each \`{ id, label, type }\` where \`type\` is \`multiselect\` \\| \`text\` \\| \`daterange\` \\| \`numeric\`; \`multiselect\` takes \`options: [{ value, label, hint?, icon? }]\`). State is keyed by field \`id\` — controlled (\`value\` + \`onChange\`) or uncontrolled (\`defaultValue\`). Renders **removable active-filter pills** next to the trigger by default (\`showActiveChips\`); wire \`onChange\` to actually filter your rows. **Always derive \`fields\` from the table's columns/data; never ship the default example facets.** Use when one \`FilterBar\` row isn't enough. |
| \`SearchInput\` | Filter field with consistent app styling. |
| \`DataTable\` | Sortable table: \`columns\`, \`rows\`, \`getRowKey\`, optional \`sort\` / \`onSortChange\`, \`emptyTitle\`, \`showRowCount\`, \`caption\`, \`truncate: true\` on columns with long text. **Scales:** \`pageSize\` (built-in client pager), \`selectable\` + \`onSelectionChange\` (checkbox column for bulk actions), \`loading\` (skeleton rows). \`onRowClick\` for row → detail (open a \`Sheet\`). |
| \`Avatar\` / \`AvatarFallback\` | User initials: \`variant="secondary"\` (or \`primary\` / \`chart\` alias) on **both** \`Avatar\` and \`AvatarFallback\` — same chrome as catalog **Action** buttons (\`Button variant="secondary"\`: elevated gradient, \`border-border\`, \`shadow-card\`, \`text-foreground\`). Never dark primary CTA fill or raw \`bg-blue-600\`. |
| \`ChartPanel\` | Same shell as \`MetricChartCard\`: title row (\`px-4 pt-4\`), flush plot (\`pt-2\` only) with **no axis ticks** — hover tooltips show category + value. Pass \`title\` + \`artifact\` (omit \`artifact.title\` to avoid duplicates) or \`children\`. \`loading\` renders a plot-height skeleton. Default plot height follows page \`density\` (300 default, 220 compact); pass \`height\` to override. |
| \`FieldInput\`, \`FieldTextarea\`, \`FieldSelect\`, \`FieldSwitch\` | Settings-style forms with labels and hints. **\`label\` is required** on every \`Field*\` component; for a label-less filter control use \`FilterField\` (optional label) or \`SearchInput\`. |
| \`FormSection\` | Grouped form block. |
| \`AppConfirmDialog\` | Confirm/cancel modal: \`open\`, \`onOpenChange\`, \`title\`, \`description\`, \`onConfirm\`. |
| \`SurfaceCard\`, \`EmptyState\` | Generic surfaces when needed. |
| \`TimbalChat\` | Re-export if you need chat outside \`AppChatPanel\`. |

#### Charts & metrics

Charts run on **recharts** with shadcn \`ChartContainer\` / \`ChartTooltipContent\` chrome (see \`src/ui/chart.tsx\`). Series colors default to \`--chart-1..6\`; rebrand every chart via \`createTimbalTheme({ chartPalette: [...] })\` (or token-referential CSS like \`--chart-1: var(--primary)\`) — never assign literal colors to the tokens.

> **React 19 requirement — do not hand-roll SVG charts to work around this.** recharts under React 19 crashes (\`Cannot assign to read only property 'lanes'\`, blank route) when \`immer\` resolves to **11.0.0**. The fix is a dependency override in the app's \`package.json\` — \`"overrides": { "immer": ">=11.0.1" }\` (Yarn: \`"resolutions"\`) — **not** a code change. Always keep using \`LineAreaChart\` / \`PieChart\` / \`ChartPanel\`; never replace them with raw SVG/CSS charts.

| Component | Use for |
|-----------|---------|
| \`LineAreaChart\` | Cartesian engine (shadcn-style chrome). Bar fills use theme gradients automatically. Props: \`data\`, \`xKey\`, \`series: [{ dataKey, label?, color? }]\`, \`variant\` (\`area\`\\|\`line\`\\|\`bar\`), \`orientation\` (\`horizontal\` for horizontal bars), \`stacked\`, \`curve\`, \`dots\`, \`gridLines\`, \`tooltipIndicator\`, \`layout\` (\`flush\` — hides axes by default; category + values on hover tooltip), \`showXAxis\` / \`showYAxis\` to opt back in, \`clipTicks\` (truncates long axis labels when axes are on), \`height\`, \`showLegend\`, \`formatX\`, \`formatValue\`, \`ariaLabel\`. |
| \`PieChart\` | Pie / donut: \`data\`, \`nameKey\`, \`dataKey\`, \`innerRadius\` (>0 = donut), \`centerValue\`/\`centerLabel\` (donut hole KPI), \`showLabels\`, \`colors\`. |
| \`RadialChart\` | Concentric progress rings: \`data\`, \`nameKey\`, \`dataKey\`, \`maxValue\`, \`centerValue\`/\`centerLabel\`. Good for gauges / share-of-target. |
| \`RadarChart\` | Spider chart (≥3 axes): \`data\`, \`nameKey\`, \`series\`, \`maxValue\`. Compare a few metrics across entities. |
| \`Sparkline\` | Tiny inline trend (table cells): \`data\`, \`color\`, \`area\`. |
| \`MetricTile\` | Low-level KPI cell — prefer \`MetricRow\` / \`MetricChartCard\` instead of hand-wiring tiles. |
| \`MetricRow\` | KPI strip in one elevated card (no chart). Props: \`metrics: [{ id, label, value, unit?, trend?, trendTone? }]\`, optional \`onMetricChange\`, \`metricsAriaLabel\`, \`loading\` (skeleton tiles). |
| \`MetricChartCard\` | KPI strip + flush chart; tile click swaps series. Same metrics shape + \`data\` per metric. Default chart height follows page \`density\` (300 / 220); pass \`height\` to override. \`loading\` renders skeleton tiles + chart. |

#### Settings

| Component | Use for |
|-----------|---------|
| \`SettingsSection\` | Two-column settings block: \`title\` + \`description\` rail on the left, controls on the right. |
| \`FieldRow\` | Labeled control row: \`label\`, \`description\`, \`inline\` (right-aligned control for switches). |
| \`DangerZone\` + \`DangerZoneAction\` | Destructive-actions container with destructive border. |
| \`FloatingUnsavedChangesBar\` | Portaled discard/save pill: \`visible\`, \`onDiscard\`, \`onSave\`, \`isSaving\`. |

#### Integrations & resources

| Component | Use for |
|-----------|---------|
| \`IntegrationCard\` | Catalog tile: \`logo\`, \`name\`, \`description\`, \`badge\`, \`status\`, footer \`action\` **or** whole-card \`onClick\` (never both). |
| \`ConnectionRow\` | One connected provider row: \`logo\`, \`name\`, \`meta\`, \`badge\`, \`action\`. |
| \`ConnectionRowList\` | Wrapper for rows (\`role="list"\`) — use instead of raw class strings. |
| \`IntegrationsEmptyState\` | Empty catalog hero: \`icon\`, \`title\`, \`description\`, \`action\`. |
| \`PlanBadge\` | Neutral tier chip on catalog cards. |
| \`ResourceCard\` | Project/agent/dataset card on elevated surface + logo tile: \`media\`, \`title\`, \`subtitle\`, optional \`badge\`, \`footer\` (\`StatusDot\`), \`action\` (\`Sparkline\`). |

#### Surfaces & details

| Component | Use for |
|-----------|---------|
| \`InfoCard\` | Soft callout: \`icon\`, \`title\`, body, \`action\`, \`tone\` (\`info\`/\`success\`/\`warn\`/\`danger\`). |
| \`AlertCard\` | Actionable / AI-generated alert card with integrated status tags, clear titles, descriptive bodies, and automated action footers. Supports: \`title\`, \`description?\`, \`category?\`, \`categoryTone?\`, \`status?\`, \`statusTone?\`, \`action?\` (action description text), \`trailing?\` (custom element), and \`onClick?\`. Renders with a beautiful neutral hover state, avoiding loud/colored hover background effects. |
| \`CatalogCard\` | Highly sophisticated marketplace/routing catalog tile (models, datasets, tools). Supports: \`title\`, \`subtitle?\`, \`logo?\` (e.g. brand logo), \`badge?\` (e.g. model type badge), \`description?\`, \`tags?\` (metadata array), \`href?\` (title link), \`footerLinks?\` (bottom-left links), \`copyValue?\` (copy ID button), \`actions?\`, and \`onClick?\` (neutral-hover interactive state). |
| \`DescriptionList\` | Read-only key/value metadata: \`items: [{ label, value }]\`, optional \`stacked\`. |
| \`ExpandableSection\` | Collapsible block: \`title\`, \`icon\`, \`count\`, animated body (\`aria-expanded\` + \`aria-controls\`). |
| \`StatusDot\` | Status indicator dot: \`tone\`, \`label\`, \`pulse\`. |
| \`Banner\` | Page-level announcement bar: \`tone\` (\`default\`\\|\`primary\`\\|\`success\`\\|\`warn\`\\|\`danger\`), \`icon\`, \`title\`, body as children, right-aligned \`actions\`, \`onDismiss\` (renders the dismiss X). For in-form/field messages use \`InfoCard\` or \`Alert\` instead. |
| \`Timeline\` | Vertical event log: \`items: [{ id, title, description?, meta?, tone?, icon? }]\`. Presentational — pass already-formatted timestamps in \`meta\`. |

#### More \`/ui\` primitives (import from \`/ui\` or the package root)

These ship in the same design system but aren't re-exported from \`/app\`. Reach for them before hand-rolling — they're all dependency-free and on the shared tokens / control surface.

| Component | Use for |
|-----------|---------|
| \`Stepper\` | Ordered step indicator for wizards / onboarding (horizontal or vertical; complete / active / upcoming states). |
| \`Rating\` | Star rating — interactive (keyboard + hover preview) or \`readOnly\`; controlled or uncontrolled. |
| \`NumberField\` | Numeric input with −/+ steppers on the control surface; clamps to \`min\`/\`max\`, steps by \`step\`. |
| \`TagInput\` | Chips / token input; commits on Enter/comma, removes on Backspace, optional \`dedupe\`/\`max\`. |
| \`AvatarGroup\` | Overlapping avatar stack with an optional \`+N\` overflow chip (\`max\`, \`spacing\`). |
| \`CircularProgress\` | Lightweight SVG progress ring — determinate (optional center label) or indeterminate. |
| \`Progress\` | Linear progress bar (\`/ui\`) — rides \`--primary\`; size with height utilities (e.g. \`className="h-0.5"\` for a hairline reading-progress line). Never hand-roll a progress div. |
| \`CopyButton\` | Click-to-copy with a transient check confirmation; icon-only or with a label. |
| \`Snippet\` | Single-line code / command on the elevated surface with a built-in copy button. |

Studio chrome (\`StudioSidebar\`, \`ModeToggle\`, …) lives in \`@timbal-ai/timbal-react/studio\` — optional, not required for every dashboard.

### Block recipes — compose these (don't clone wholesale)

Some section patterns are now **importable blocks** (see the **Importable catalog** above): \`FilteredDataTable\`, \`StatGrid\`, \`IntegrationsGrid\`, \`ResourceGallery\`, \`SettingsLayout\`. Prefer importing those over rebuilding. The patterns below that have no block are compositions to assemble in your own domain with your data. Reach for a block before dropping to raw primitives.

**Settings**
- **Project settings** — prefer the **\`SettingsLayout\`** block (stacked \`SettingsSection\`s + \`dangerZone\` + a \`dirty\`-driven floating save bar). Fill sections with \`FieldInput\`/\`FieldSwitch\`/\`FieldRow\`.
- **Settings form** — compact stacked form for one concern (profile, billing). Compose \`FormSection\` + \`FieldInput\`/\`FieldSelect\`/\`FieldTextarea\`.

**Data & metrics**
- **Metrics row** — KPI strip in one elevated card. Compose \`MetricRow\` + \`MetricTile\`. For individual elevated KPI tiles, use the **\`StatGrid\`** block.
- **Analytics card** — selectable KPI tiles driving a shared chart. Compose \`MetricChartCard\` + \`LineAreaChart\`.
- **Charts panel** — embedded chart artifact. Compose \`ChartPanel\` + \`ChartArtifactView\`.
- **Chart catalog** — every chart kind (stacked area, multi-line, step, bar, stacked + horizontal bar, donut, radial, radar) in \`ChartPanel\` cards. Pick a \`chartType\` + options on a \`ChartArtifact\`; theme via \`--chart-N\` (reference tokens **directly** — \`var(--chart-N)\` — never \`hsl(var(--chart-N))\`; they're OKLCH, and wrapping renders a black/empty chart).
- **Two metrics / correlation on one plot** — use a **multi-series** \`ChartArtifact\` (\`series: [{ dataKey: "focus" }, { dataKey: "sleep" }]\` or \`dataKey: ["focus", "sleep"]\`) in a \`ChartPanel\`, or \`LineAreaChart\` with two series. The kit charts share **one** axis — if the metrics have very different ranges (e.g. focus minutes vs. sleep hours), **normalize the values to a common scale (0–1 or 0–100) and pass the real numbers through the tooltip** (label/formatter), rather than reaching for two Y-axes. **Do NOT** drop to raw recharts (\`ComposedChart\`, \`<YAxis>\`, etc.) to fake a dual axis — that abandons the kit's theming, tooltips, and flush layout.
- **Table + filters** — prefer the **\`FilteredDataTable\`** block (search + faceted filters + sortable \`DataTable\` wired for you). Drop to \`FilterBar\` + \`DataTable\` only for bespoke toolbars.

**Collections**
- **Integrations grid** — prefer the **\`IntegrationsGrid\`** block (\`IntegrationCard\` grid + \`ConnectionRowList\`). Pass \`emptyState={<IntegrationsEmptyState … />}\` when empty.
- **Resource gallery** — prefer the **\`ResourceGallery\`** block (\`ResourceCard\` grid). Cards can carry \`StatusDot\` / \`Sparkline\` slots.

**Overlays & flows** (animate automatically)
- **Confirm & destructive** — confirm/cancel modal or destructive alert. Compose \`AppConfirmDialog\` (or \`AlertDialog\`) + \`Button\`; never hand-roll a \`Dialog\` for confirms.
- **Detail sheet** — slide-over edit panel without leaving the list. Compose \`Sheet\` + \`Field*\` + \`Button\` + \`Separator\`.

**States & auth**
- **Empty states** — no-data / no-results / first-run. Compose \`EmptyState\` + \`Card\` + \`Button\`.
- **Sign-in card** — centered auth entry. Compose \`Card\` + \`Input\` + \`Label\` + \`Button\`.

**Shells & layouts**
- **Minimal shell** — \`AppShell\` + \`Page\` (no sidebar/chat).
- **Bento dashboard** — \`Page\` + an asymmetric grid of \`SurfaceCard\` / \`ChartPanel\` / \`StatTile\` (varied spans) for overview/home screens.
- **Split view** — master–detail: \`AppShell contentFill\` + \`Page fill\` + a two-pane flex row (list + detail), each pane \`min-h-0 overflow-y-auto\`.
- **Full-page chat** — \`AppShell contentFill\` + headerless \`Page fill\` + \`TimbalChat className="min-h-0 flex-1"\` (composer pinned; no \`h-[calc(...)]\`).
- **Copilot overlay** — drop a self-mounting \`<AppCopilot workforceId="…" />\` anywhere (no \`AppShell\` wiring).
- **Theme presets** — apply a brand preset programmatically (\`applyThemePreset\` / \`applyTimbalTheme\`); never hand-author OKLCH and don't expose a theme picker to end users.

### Typical compositions

- **Metrics overview** — \`MetricRow\` or \`MetricChartCard\` (not four isolated stat cards with bold numbers).
- **Analytics** — \`MetricChartCard\`; header action: \`Button variant="secondary" size="sm"\`.
- **Table workspace** — \`Page\` + \`FilterBar\` + \`DataTable\` (+ \`StatusBadge\` / \`StatusDot\` in cells).
- **Settings** — \`Page\` + \`SettingsSection\`s + \`DangerZone\` + \`FloatingUnsavedChangesBar\`.
- **Integrations** — grid of \`IntegrationCard\`; \`ConnectionRowList\` for connected providers; \`IntegrationsEmptyState\` when empty.
- **Resource gallery** — grid of \`ResourceCard\`.
- **Copilot-assisted app** — any layout + a self-mounting \`<AppCopilot workforceId="…" context={pageContext} />\`.
- **Motion is automatic** — Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tooltip, Toast, and Accordion/Collapsible animate out of the box (fade/zoom/slide/height) via the engine inlined in \`styles.css\`. Do not add a separate animation library or hand-write \`@keyframes\`.

### Example imports

\`\`\`tsx
import {
  AppShell,
  AppCopilot,
  Page,
  Section,
  MetricRow,
  MetricChartCard,
  FilteredDataTable,
  IntegrationsGrid,
  IntegrationCard,
  ConnectionRow,
  ConnectionRowList,
  Button,
  DataTable,
  FilterBar,
  FilterDropdown,
  AlertCard,
  CatalogCard,
} from "@timbal-ai/timbal-react/app";
\`\`\`

### Examples in this repo (for humans/tools)

| Path | Purpose |
|------|---------|
| \`examples/app-kit/src/recipes/*\` | **Recipes** — one pattern each (~20–80 lines). Use for capability, not layout. |
| \`examples/app-kit/src/reference/operations-dashboard.tsx\` | **Reference only** — full wired app; do not treat as the default generated layout. |

### API gotchas — props that do NOT exist (don't guess, don't retry variations)

The compiler rejects these every time; write against the documented shapes above instead:

- \`FieldInput\` / \`FieldTextarea\` / \`FieldSelect\` / \`FieldSwitch\` **require \`label\`** — TS2741 if omitted. Label-less control → \`FilterField\` or \`SearchInput\`.
- Full-height layout: \`fill\` lives on \`Page\` (paired with \`AppShell contentFill\`) — there is no \`fill\` on \`Section\` or \`AppShell\`.
- \`WorkforceSelector\` (chat subpath / root) is a **controlled** picker: \`workforces\` (e.g. from \`useWorkforces()\`), \`value\`, \`onChange(id)\`, optional \`hideWhenSingle\` / \`placeholder\`. It does **not** fetch and has no \`workforceId\` prop — for a floating assistant use \`AppCopilot workforceId="…"\`.
- There is **no \`Tabs\` export** — section switching uses \`SubNav\` or \`PillSegmentedTabs\`.
- \`Banner\` and \`Timeline\` exist (see menu) — import them from \`/app\`, \`/ui\`, or the root.
- **Import from the right subpath — verify, don't guess.** App-kit **surfaces** (\`StatusBadge\`, \`StatusDot\`, \`EmptyState\`, \`StatTile\`, \`MetricRow\`, \`DataTable\`, \`Page\`, \`Section\`, \`AppShell\`, the blocks) live in **\`/app\`** (or the root), **not** \`/ui\`. \`/ui\` is base primitives (\`Button\`, \`Input\`, \`Select\`, \`Dialog\`, \`Sheet\`, \`Badge\`, …). A wrong subpath import (e.g. \`StatusBadge\` from \`/ui\`) is a runtime "does not provide an export" crash → blank page. When unsure, use the package **root** (\`@timbal-ai/timbal-react\`) which re-exports everything, or check the exact \`importFrom\` in \`APP_KIT_CATALOG\` before writing the import.
- If a prop still type-errors, read the actual definitions in \`node_modules/@timbal-ai/timbal-react/dist/app.d.ts\` once instead of retrying guessed prop names.

### Rules

- Prefer stable props documented above; avoid undocumented \`design/*\` class exports (\`connectionRowListClass\` is exported but \`ConnectionRowList\` is preferred).
- Match the user's domain language in titles and labels.
- For rich in-chat widgets, use **artifacts** (\`ARTIFACT_AGENT_INSTRUCTIONS\`) — app kit is for the **host application shell**.
`.trim();
