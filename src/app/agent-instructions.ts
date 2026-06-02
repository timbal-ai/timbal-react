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

### Module layout (source folders)

Presentational groups — import from the package root, not from these paths:

| Folder | Components |
|--------|------------|
| \`data/\` | \`MetricRow\`, \`MetricChartCard\`, \`MetricTile\`, \`DataTable\`, \`FilterBar\`, \`ChartPanel\` |
| \`integrations/\` | \`IntegrationCard\`, \`ConnectionRow\`, \`ConnectionRowList\`, \`IntegrationsEmptyState\`, \`PlanBadge\` |
| \`settings/\` | \`SettingsSection\`, \`FieldRow\`, \`DangerZone\`, \`FloatingUnsavedChangesBar\` |
| \`surfaces/\` | \`StatTile\`, \`InfoCard\`, \`ResourceCard\`, \`DescriptionList\`, \`ExpandableSection\`, \`StatusDot\`, \`StatusBadge\`, \`EmptyState\` |
| \`layout/\` | \`AppShell\`, \`Page\`, \`Section\` |
| \`charts\` (re-exported) | \`LineAreaChart\`, \`Sparkline\`, \`CHART_PALETTE\` |

Also re-exported: \`Button\`, \`TimbalChat\`, \`ChartArtifactView\`, \`APP_KIT_AGENT_INSTRUCTIONS\`.

### Design guidelines (required)

| Area | Rule |
|------|------|
| **Copilot** | Use \`AppCopilotProvider\` for page context (\`useAppCopilotContext\`). Copilot is a **floating overlay** via \`AppShell\` \`chat={<AppChatPanel />}\` — not a sidebar column that shrinks main content. |
| **Chat panel** | \`AppChatPanel\` only; \`Thread\` uses \`variant="panel"\` internally. Dismiss with **X**; trigger is a **text-only** pill (e.g. "Assistant") — **no** MessageSquare or chat icons on the shell trigger. |
| **Context** | Do not show raw JSON context in the panel header; keep context in \`AppCopilotProvider\` only. |
| **Theming** | Use semantic Tailwind tokens (\`bg-background\`, \`text-foreground\`, \`border-border\`, \`bg-elevated-from\`, etc.) from the host app's \`styles.css\`. Optional: \`import "@timbal-ai/timbal-react/styles.css"\`. |
| **Layout chrome** | \`Page\` → \`Section\` for main content hierarchy. \`AppShellTopbar\` for global actions (auth, theme). |
| **Data** | Prefer \`DataTable\` with typed \`columns\` / \`rows\` / \`getRowKey\`; use \`ChartPanel\` with \`ChartArtifact\` for charts. |
| **Modals** | Use \`AppConfirmDialog\` for destructive/export confirmations. |
| **Metrics** | Overview KPIs → \`MetricRow\` or \`MetricChartCard\` (not four separate heavy cards). Values use **normal** font weight, not bold. |
| **Integrations** | Catalog → \`IntegrationCard\` grid; connected list → \`ConnectionRow\` inside \`ConnectionRowList\`. Footer CTAs: \`Button variant="secondary"\`. |
| **Anti-slop** | No loud green/red trend pills on every tile; no \`bg-card\` flat grids when platform chrome exists; avoid recycling demo names ("Operations", mock workforce lists). |

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
| \`AppShell\` | Shell: optional \`sidebar\`, \`topbar\`, main \`children\`, optional floating \`chat\`. Props: \`chatTriggerLabel\`, \`chatCollapsible\`, \`chatWidth\`, \`chatHeight\`, controlled \`chatOpen\`. |
| \`AppShellTopbar\` | Full-width top bar: \`start\`, \`actions\` slots. |
| \`AppCopilotProvider\` | React context for copilot-aware tools (page, filters, selection, etc.). |
| \`AppChatPanel\` | Floating thread: \`workforceId\`, \`welcome\`, \`debug\`. |
| \`useAppShellChat\` | Custom open/close trigger when \`hideChatTrigger\` on shell. |
| \`Page\` | Page title, description, \`breadcrumbs\`, \`actions\`, children. |
| \`Section\` | Titled block inside a page. |
| \`SubNav\` | In-page tabs: \`items\`, \`activeId\`, \`onChange\`. |
| \`Breadcrumbs\` | Trail: \`items: [{ label, href? }]\`. |
| \`Button\` | Actions — \`variant="secondary"\` for catalog/secondary CTAs; \`variant="default"\` for primary. |
| \`StatTile\` | Single KPI in its own card (grid of scattered stats). Prefer \`MetricRow\` for a unified overview strip. |
| \`StatusBadge\` | Status pill: \`tone\` (\`success\`, \`warn\`, …), children. |
| \`FilterBar\` | Horizontal filter row (wraps \`SearchInput\`, buttons, etc.). |
| \`SearchInput\` | Filter field with consistent app styling. |
| \`DataTable\` | Sortable table: \`columns\`, \`rows\`, \`getRowKey\`, optional \`sort\` / \`onSortChange\`, \`emptyTitle\`, \`showRowCount\`, \`caption\` for screen readers. |
| \`ChartPanel\` | Same shell as \`MetricChartCard\`: title row (\`px-4 pt-4\`), flush plot (\`pt-2\` only). Pass \`title\` + \`artifact\` (omit \`artifact.title\` to avoid duplicates) or \`children\`. |
| \`FieldInput\`, \`FieldTextarea\`, \`FieldSelect\`, \`FieldSwitch\` | Settings-style forms with labels and hints. |
| \`FormSection\` | Grouped form block. |
| \`AppConfirmDialog\` | Confirm/cancel modal: \`open\`, \`onOpenChange\`, \`title\`, \`description\`, \`onConfirm\`. |
| \`SurfaceCard\`, \`EmptyState\` | Generic surfaces when needed. |
| \`TimbalChat\` | Re-export if you need chat outside \`AppChatPanel\`. |

#### Charts & metrics

| Component | Use for |
|-----------|---------|
| \`LineAreaChart\` | Chart engine. Props: \`data\`, \`xKey\`, \`series\`, \`variant\` (\`"area"\`), \`layout\` (\`"flush"\`), \`height\`, \`ariaLabel\`, \`formatX\`, \`formatValue\`. |
| \`Sparkline\` | Tiny inline trend (table cells): \`data\`, \`color\`, \`area\`. |
| \`MetricTile\` | Low-level KPI cell — prefer \`MetricRow\` / \`MetricChartCard\` instead of hand-wiring tiles. |
| \`MetricRow\` | KPI strip in one elevated card (no chart). Props: \`metrics: [{ id, label, value, unit?, trend? }]\`, optional \`onMetricChange\`, \`metricsAriaLabel\`. |
| \`MetricChartCard\` | KPI strip + flush chart; tile click swaps series. Same metrics shape + \`data\` per metric. Default chart height 300. |

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
| \`DescriptionList\` | Read-only key/value metadata: \`items: [{ label, value }]\`, optional \`stacked\`. |
| \`ExpandableSection\` | Collapsible block: \`title\`, \`icon\`, \`count\`, animated body (\`aria-expanded\` + \`aria-controls\`). |
| \`StatusDot\` | Status indicator dot: \`tone\`, \`label\`, \`pulse\`. |

Studio chrome (\`StudioSidebar\`, \`ModeToggle\`, …) lives in \`@timbal-ai/timbal-react/studio\` — optional, not required for every dashboard.

### Recipe index (\`examples/app-kit/recipes/\`)

| Recipe file | Components to study |
|-------------|---------------------|
| \`metrics-row.tsx\` | \`Page\`, \`MetricRow\` |
| \`analytics-card.tsx\` | \`MetricChartCard\`, \`Button\` |
| \`integrations-grid.tsx\` | \`IntegrationCard\`, \`ConnectionRowList\`, \`PlanBadge\` |
| \`table-with-filters.tsx\` | \`FilterBar\`, \`DataTable\` |
| \`settings-page.tsx\` | \`SettingsSection\`, \`DangerZone\`, \`FloatingUnsavedChangesBar\` |
| \`resource-gallery.tsx\` | \`ResourceCard\`, \`StatusDot\`, \`Sparkline\` |
| \`charts-panel.tsx\` | \`ChartPanel\`, \`ChartArtifact\` |
| \`copilot-overlay.tsx\` | \`AppShell\`, \`AppChatPanel\` |

### Typical compositions

- **Metrics overview** — \`MetricRow\` or \`MetricChartCard\` (not four isolated stat cards with bold numbers).
- **Analytics** — \`MetricChartCard\`; header action: \`Button variant="secondary" size="sm"\`.
- **Table workspace** — \`Page\` + \`FilterBar\` + \`DataTable\` (+ \`StatusBadge\` / \`StatusDot\` in cells).
- **Settings** — \`Page\` + \`SettingsSection\`s + \`DangerZone\` + \`FloatingUnsavedChangesBar\`.
- **Integrations** — grid of \`IntegrationCard\`; \`ConnectionRowList\` for connected providers; \`IntegrationsEmptyState\` when empty.
- **Resource gallery** — grid of \`ResourceCard\`.
- **Copilot-assisted app** — \`AppCopilotProvider\` + \`AppShell\` with \`chat={<AppChatPanel workforceId="…" />}\`.

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
} from "@timbal-ai/timbal-react/app";
\`\`\`

### Examples in this repo (for humans/tools)

| Path | Purpose |
|------|---------|
| \`examples/app-kit/recipes/*\` | **Recipes** — one pattern each (~20–80 lines). Use for capability, not layout. |
| \`examples/app-kit/reference/operations-dashboard.tsx\` | **Reference only** — full wired app; do not treat as the default generated layout. |

### Rules

- Prefer stable props documented above; avoid undocumented \`design/*\` class exports (\`connectionRowListClass\` is exported but \`ConnectionRowList\` is preferred).
- Match the user's domain language in titles and labels.
- For rich in-chat widgets, use **artifacts** (\`ARTIFACT_AGENT_INSTRUCTIONS\`) — app kit is for the **host application shell**.
`.trim();
