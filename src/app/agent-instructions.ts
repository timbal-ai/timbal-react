import { HOUSE_RULES, SLOP_BUDGETS } from "../design/ui-vocabulary";

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
- **Do not** treat \`examples/app-kit/reference/\` as a template to clone (no default "Operations" dashboard with sidebar + three KPI tiles + SubNav + table unless the user asked for that).
- **Do** use \`examples/app-kit/recipes/\` as **short grammar examples** (one concern per file), not as a full app blueprint.

When in doubt: compose from the **component menu** + **guidelines**, then adapt creatively to the request.

### Layout archetypes — pick the shape that fits (don't default to one)

The most common failure is shipping the **same** layout every time: sidebar + topbar + \`Page\` + one \`MetricRow\` + one full-width \`DataTable\`. That is *one* archetype, not *the* layout. Choose deliberately — different domains want different shapes, and varying the shell/page composition is encouraged.

| Archetype | When | Compose |
|-----------|------|---------|
| **Sidebar dashboard** | Multi-section product (CRM, billing, ops) with nav | \`StudioSidebar\` in \`AppShell.sidebar\` + \`Page\` → \`Section\` |
| **Focused / no-chrome** | A single tool or one-screen utility | \`AppShell\` (no sidebar) + \`Page width="narrow"\` / \`"prose"\` (optionally with a custom topbar) for a centered focused column |
| **Bento overview** | Home / at-a-glance dashboards | \`Page\` + an **asymmetric grid** of \`SurfaceCard\` / \`ChartPanel\` / \`StatTile\` spanning different widths (not a uniform row + table) |
| **Split master–detail** | Inbox, triage queue, record browser, log explorer | \`AppShell contentFill\` + \`Page fill\` + a two-column flex row, each pane \`min-h-0 overflow-y-auto\` |
| **Full-page chat / canvas** | Chat-first app, editor, map, single full-bleed surface | \`AppShell contentFill\` + headerless \`Page fill\` + a \`min-h-0 flex-1\` child (e.g. \`TimbalChat\`) |
| **Copilot overlay** | A data app that also wants an assistant | any of the above + \`AppShell chat={<AppChatPanel />}\` (floating, never a second column) |
| **Section-switcher** | One page, several views | \`SubNav\` / \`PillSegmentedTabs\` (\`trackVariant="flush"\`) switching panels with state/router |

Mix them: vary the grid columns, density, header placement (\`Page\` actions vs. a global topbar), and whether there's a sidebar at all. Two dashboards for two domains should not look identical.

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
When creating a full-page assistant/chat page, let the chat component own the layout and welcome state completely.
- **Never wrap** \`<TimbalChat>\` or \`<AppChatPanel>\` inside standard card or section elements (like \`<Card>\`, \`<Section>\`, or custom bordered/padded panels). Wrapping degrades the viewport height calculations and wastes valuable layout estate.
- **Never add custom headings, titles, descriptions, or status badges** (e.g., "Asistente Virtual", "Online", or subtitle text blocks) inside the page. The assistant page context is already implicit. If you need a customized title or greeting, pass it through the \`welcome\` prop config: e.g., \`<TimbalChat welcome={{ heading: "Hola, soy el Concierge de TIBA", subheading: "Pregúntame sobre..." }} />\`.

### Module layout (source folders)

Presentational groups — import from the package root, not from these paths:

| Folder | Components |
|--------|------------|
| \`data/\` | \`MetricRow\`, \`MetricChartCard\`, \`MetricTile\`, \`DataTable\`, \`FilterBar\`, \`FilterField\`, \`FilterDropdown\`, \`ChartPanel\` |
| \`integrations/\` | \`IntegrationCard\`, \`ConnectionRow\`, \`ConnectionRowList\`, \`IntegrationsEmptyState\`, \`PlanBadge\` |
| \`settings/\` | \`SettingsSection\`, \`FieldRow\`, \`DangerZone\`, \`FloatingUnsavedChangesBar\` |
| \`surfaces/\` | \`StatTile\`, \`InfoCard\`, \`AlertCard\`, \`CatalogCard\`, \`ResourceCard\`, \`DescriptionList\`, \`ExpandableSection\`, \`StatusDot\`, \`StatusBadge\`, \`EmptyState\` |
| \`layout/\` | \`AppShell\`, \`Page\` (auto-stacks children; \`width\` ladder), \`Section\`, \`Stack\` |
| \`charts\` (re-exported) | \`LineAreaChart\`, \`PieChart\`, \`RadialChart\`, \`RadarChart\`, \`Sparkline\`, \`CHART_PALETTE\` |

Also re-exported from \`/app\`: \`Button\`, \`Avatar\` / \`AvatarImage\` / \`AvatarFallback\`, \`Banner\`, \`Timeline\`, \`Kanban\` (drag-and-drop board), \`TimbalChat\`, \`ChartArtifactView\`, \`APP_KIT_AGENT_INSTRUCTIONS\`. Other UI primitives used in block recipes (\`Card\`, \`Input\`, \`Label\`, \`Sheet\`, \`Separator\`, \`AlertDialog\`, \`Badge\`, \`Select\`, …) import from \`@timbal-ai/timbal-react/ui\` or the package root — **not** from \`/app\`.

Theming helpers (import from the package root or \`/app\`): \`createTimbalTheme\`, \`themeToCss\`, \`applyTimbalTheme\`, \`TIMBAL_THEME_PRESETS\`, \`applyThemePreset\`, \`TimbalThemeStyle\`, \`THEME_AGENT_INSTRUCTIONS\`. Theming is **configured by the developer**, not surfaced as an end-user theme picker.

### Design guidelines (required)

| Area | Rule |
|------|------|
| **Copilot** | Use \`AppCopilotProvider\` for page context (\`useAppCopilotContext\`). Copilot is a **floating overlay** via \`AppShell\` \`chat={<AppChatPanel />}\` — not a sidebar column that shrinks main content. |
| **Chat panel** | \`AppChatPanel\` only; \`Thread\` uses \`variant="panel"\` internally. Dismiss with **X**; trigger is a **text-only** pill (e.g. "Assistant") — **no** MessageSquare or chat icons on the shell trigger. |
| **Context** | Do not show raw JSON context in the panel header; keep context in \`AppCopilotProvider\` only. |
| **Theming** | Use semantic Tailwind tokens (\`bg-background\`, \`text-foreground\`, \`border-border\`, \`bg-elevated-from\`, etc.) from the host app's \`styles.css\`. To rebrand, **never hand-author OKLCH** — call \`createTimbalTheme({ brand })\` + \`themeToCss\`/\`applyTimbalTheme\`, or apply a catalog preset (\`TIMBAL_THEME_PRESETS\` / \`applyThemePreset\`). Apply the theme **programmatically** — do **not** add an end-user theme selector to generated apps. See \`THEME_AGENT_INSTRUCTIONS\`. |
| **Layout chrome** | \`Page\` → \`Section\` for main content hierarchy. Default to **no global topbar** — put account/theme/global actions in the \`Page\` \`actions\` slot (or the sidebar). Add a topbar only when a full-width global bar is explicitly requested. |
| **Spacing / gaps** | \`Page\` **auto-stacks its direct children with a vertical gap** — drop blocks straight in (e.g. \`Page\` → \`FilterBar\` + \`DataTable\`, or \`MetricRow\` + \`ChartPanel\`) and they breathe; do **not** wrap every block in an extra \`<div>\` (that collapses the gap). For ad-hoc clusters inside a card/row use \`Stack\` (\`gap\`, \`direction\`) instead of bare flex with no gap. Grids still need their own \`gap-*\`. |
| **Width** | \`Page\` defaults to a wide centered column. For focused / reading / form pages pass \`width\` (\`default\`, \`centered\`, \`narrow\`, \`prose\`) instead of always running full-bleed — not everything needs the full width. \`width="full"\` opts into edge-to-edge. For full-height pages that should stay centered use \`fill\` + \`fillPadded\`. |
| **Density** | Set \`density="compact"\` on \`Page\` for tighter dashboards (full-width column, smaller section gaps, card padding, metric tiles, default chart height 220). Default is \`"default"\` (platform spacing). Wrap custom layouts with \`AppDensityProvider\` when not using \`Page\`. Per-section override: \`Section density="compact"\`. Do **not** hand-tune five layers of \`className\` padding when density covers the need. |
| **Data** | Prefer \`DataTable\` with typed \`columns\` / \`rows\` / \`getRowKey\`; use \`ChartPanel\` with a \`ChartArtifact\` for charts (set \`chartType\` + options — see the chart catalog). Chart colors come from the theme \`--chart-1..6\` tokens; pass \`series[].color\` / \`colors\` only to override, never raw hex on every series. |
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
| \`AppShell\` | Shell: optional \`sidebar\`, \`topbar\`, main \`children\`, optional floating \`chat\`. Props: \`chatTriggerLabel\`, \`chatCollapsible\`, \`chatWidth\`, \`chatHeight\`, controlled \`chatOpen\`, **\`contentFill\`** (bounded non-scrolling content region for full-bleed pages — chat/canvas/split view). |
| \`AppCopilotProvider\` | React context for copilot-aware tools (page, filters, selection, etc.). |
| \`AppChatPanel\` | Floating thread: \`workforceId\`, \`welcome\`, \`debug\`. |
| \`useAppShellChat\` | Custom open/close trigger when \`hideChatTrigger\` on shell. |
| \`Page\` | Page title, description, \`breadcrumbs\`, \`actions\`, \`density\` (\`"default"\` \| \`"compact"\`), children. **\`title\` is optional** — omit it for a headerless page (no \`<h1>\`). **\`fill\`** makes it a \`min-h-0 flex-1\` column for full-height content (pair with \`AppShell contentFill\`). |
| \`Section\` | Titled block inside a page. Optional \`density\` overrides inherited page density. |
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

Charts run on **recharts** with shadcn \`ChartContainer\` / \`ChartTooltipContent\` chrome (see \`src/ui/chart.tsx\`). Series colors default to \`--chart-1..6\`; override those CSS tokens to rebrand every chart.

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
| \`CopyButton\` | Click-to-copy with a transient check confirmation; icon-only or with a label. |
| \`Snippet\` | Single-line code / command on the elevated surface with a built-in copy button. |

Studio chrome (\`StudioSidebar\`, \`ModeToggle\`, …) lives in \`@timbal-ai/timbal-react/studio\` — optional, not required for every dashboard.

### Block recipes — compose these (don't clone wholesale)

Ready-made **section patterns** assembled from the components above. Each is a composition to rebuild in your own domain with your data — **not** an importable component. Reach for a block before dropping to raw primitives.

**Settings**
- **Project settings** — General / Usage / Danger sections; the floating save bar appears on first edit. Compose \`SettingsSection\` + \`FieldInput\`/\`FieldSwitch\` + \`FieldRow\` + \`InfoCard\` + \`DangerZone\` + \`FloatingUnsavedChangesBar\`.
- **Settings form** — compact stacked form for one concern (profile, billing). Compose \`FormSection\` + \`FieldInput\`/\`FieldSelect\`/\`FieldTextarea\`.

**Data & metrics**
- **Metrics row** — KPI strip in one elevated card. Compose \`MetricRow\` + \`MetricTile\`.
- **Analytics card** — selectable KPI tiles driving a shared chart. Compose \`MetricChartCard\` + \`LineAreaChart\`.
- **Charts panel** — embedded chart artifact. Compose \`ChartPanel\` + \`ChartArtifactView\`.
- **Chart catalog** — every chart kind (stacked area, multi-line, step, bar, stacked + horizontal bar, donut, radial, radar) in \`ChartPanel\` cards. Pick a \`chartType\` + options on a \`ChartArtifact\`; theme via \`--chart-N\`.
- **Table + filters** — \`FilterBar\` above a sortable \`DataTable\` (+ \`StatusBadge\` in cells).

**Collections**
- **Integrations grid** — connector catalog + connected list. Compose \`IntegrationCard\` + \`PlanBadge\` + \`ConnectionRowList\` (\`IntegrationsEmptyState\` when empty).
- **Resource gallery** — project / agent / dataset cards. Compose \`ResourceCard\` + \`StatusDot\` + \`Sparkline\`.

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
- **Copilot overlay** — \`AppShell\` + floating \`AppChatPanel\`.
- **Theme presets** — apply a brand preset programmatically (\`applyThemePreset\` / \`applyTimbalTheme\`); never hand-author OKLCH and don't expose a theme picker to end users.

### Typical compositions

- **Metrics overview** — \`MetricRow\` or \`MetricChartCard\` (not four isolated stat cards with bold numbers).
- **Analytics** — \`MetricChartCard\`; header action: \`Button variant="secondary" size="sm"\`.
- **Table workspace** — \`Page\` + \`FilterBar\` + \`DataTable\` (+ \`StatusBadge\` / \`StatusDot\` in cells).
- **Settings** — \`Page\` + \`SettingsSection\`s + \`DangerZone\` + \`FloatingUnsavedChangesBar\`.
- **Integrations** — grid of \`IntegrationCard\`; \`ConnectionRowList\` for connected providers; \`IntegrationsEmptyState\` when empty.
- **Resource gallery** — grid of \`ResourceCard\`.
- **Copilot-assisted app** — \`AppCopilotProvider\` + \`AppShell\` with \`chat={<AppChatPanel workforceId="…" />}\`.
- **Motion is automatic** — Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tooltip, Toast, and Accordion/Collapsible animate out of the box (fade/zoom/slide/height) via the engine inlined in \`styles.css\`. Do not add a separate animation library or hand-write \`@keyframes\`.

### Example imports

\`\`\`tsx
import {
  AppShell,
  AppCopilotProvider,
  AppChatPanel,
  Page,
  Section,
  MetricRow,
  MetricChartCard,
  IntegrationCard,
  ConnectionRow,
  ConnectionRowList,
  Button,
  DataTable,
  FilterBar,
  FilterField,
  FilterDropdown,
  AlertCard,
  CatalogCard,
} from "@timbal-ai/timbal-react/app";
\`\`\`

### Examples in this repo (for humans/tools)

| Path | Purpose |
|------|---------|
| \`examples/app-kit/recipes/*\` | **Recipes** — one pattern each (~20–80 lines). Use for capability, not layout. |
| \`examples/app-kit/reference/operations-dashboard.tsx\` | **Reference only** — full wired app; do not treat as the default generated layout. |

### API gotchas — props that do NOT exist (don't guess, don't retry variations)

The compiler rejects these every time; write against the documented shapes above instead:

- \`FieldInput\` / \`FieldTextarea\` / \`FieldSelect\` / \`FieldSwitch\` **require \`label\`** — TS2741 if omitted. Label-less control → \`FilterField\` or \`SearchInput\`.
- Full-height layout: \`fill\` lives on \`Page\` (paired with \`AppShell contentFill\`) — there is no \`fill\` on \`Section\` or \`AppShell\`.
- \`WorkforceSelector\` (chat subpath / root) is a **controlled** picker: \`workforces\` (e.g. from \`useWorkforces()\`), \`value\`, \`onChange(id)\`, optional \`hideWhenSingle\` / \`placeholder\`. It does **not** fetch and has no \`workforceId\` prop — for an embedded assistant use \`AppChatPanel workforceId="…"\`.
- There is **no \`Tabs\` export** — section switching uses \`SubNav\` or \`PillSegmentedTabs\`.
- \`Banner\` and \`Timeline\` exist (see menu) — import them from \`/app\`, \`/ui\`, or the root.
- If a prop still type-errors, read the actual definitions in \`node_modules/@timbal-ai/timbal-react/dist/app.d.ts\` once instead of retrying guessed prop names.

### Rules

- Prefer stable props documented above; avoid undocumented \`design/*\` class exports (\`connectionRowListClass\` is exported but \`ConnectionRowList\` is preferred).
- Match the user's domain language in titles and labels.
- For rich in-chat widgets, use **artifacts** (\`ARTIFACT_AGENT_INSTRUCTIONS\`) — app kit is for the **host application shell**.
`.trim();
