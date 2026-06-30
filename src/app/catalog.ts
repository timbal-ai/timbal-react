// =============================================================================
// APP_KIT_CATALOG — the single, machine-readable index of everything an agent
// can compose with: primitives/surfaces AND the composed `blocks`. Every entry
// carries an exact `importFrom` path and the symbols it exports, so agents
// import instead of rebuild. Blocks also carry `composedOf` + a `source` path so
// agents can fork them. `APP_KIT_AGENT_INSTRUCTIONS` is generated from this, and
// a contract test asserts every entry resolves to a real export.
// =============================================================================

export type CatalogKind = "primitive" | "block";

export type CatalogImportPath =
  | "@timbal-ai/timbal-react/app"
  | "@timbal-ai/timbal-react/ui"
  | "@timbal-ai/timbal-react/studio";

export interface CatalogEntry {
  /** Stable id (kebab-case). */
  id: string;
  /** Display name (usually the primary export). */
  name: string;
  kind: CatalogKind;
  /** Group label for docs/gallery. */
  category: string;
  description: string;
  /** When an agent or author should reach for this. */
  whenToUse: string;
  importFrom: CatalogImportPath;
  /** Exported symbols (root names) — verified against the barrel by a test. */
  exports: string[];
  /** Blocks only: the primitives/surfaces this composes. */
  composedOf?: string[];
  /** Blocks only: repo-relative source path to read/fork. */
  source?: string;
}

// ── Blocks — composed, prop-driven, forkable sections ────────────────────────

const BLOCKS: CatalogEntry[] = [
  {
    id: "filtered-data-table",
    name: "FilteredDataTable",
    kind: "block",
    category: "Blocks · Data",
    description:
      "Search box + faceted FilterDropdown + sortable, paginated DataTable, with all the search/filter wiring handled.",
    whenToUse:
      "Any list/management workspace where rows are searched and filtered. Replaces the ~100 lines of filter state you'd otherwise rewrite.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["FilteredDataTable"],
    composedOf: ["SearchInput", "FilterBar", "FilterDropdown", "DataTable"],
    source: "src/app/blocks/filtered-data-table.tsx",
  },
  {
    id: "stat-grid",
    name: "StatGrid",
    kind: "block",
    category: "Blocks · Data",
    description: "Responsive grid of elevated StatTiles for an at-a-glance KPI overview.",
    whenToUse:
      "Top-of-page KPI overview when you want individual tiles rather than one unified MetricRow card.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["StatGrid"],
    composedOf: ["StatTile"],
    source: "src/app/blocks/stat-grid.tsx",
  },
  {
    id: "integrations-grid",
    name: "IntegrationsGrid",
    kind: "block",
    category: "Blocks · Collections",
    description:
      "Connector catalog grid of IntegrationCards with an optional 'Connected' ConnectionRowList below.",
    whenToUse: "Integrations / marketplace / connector screens.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["IntegrationsGrid"],
    composedOf: ["IntegrationCard", "ConnectionRowList", "ConnectionRow"],
    source: "src/app/blocks/integrations-grid.tsx",
  },
  {
    id: "resource-gallery",
    name: "ResourceGallery",
    kind: "block",
    category: "Blocks · Collections",
    description: "Responsive grid of ResourceCards (projects, agents, datasets) with an optional empty state.",
    whenToUse: "Resource landing pages — project/agent/dataset overviews.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["ResourceGallery"],
    composedOf: ["ResourceCard"],
    source: "src/app/blocks/resource-gallery.tsx",
  },
  {
    id: "settings-layout",
    name: "SettingsLayout",
    kind: "block",
    category: "Blocks · Settings",
    description:
      "Stacked SettingsSections + optional danger zone + a floating save bar driven by a `dirty` flag.",
    whenToUse: "Project, workspace, or account settings pages.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["SettingsLayout"],
    composedOf: ["SettingsSection", "FloatingUnsavedChangesBar", "DangerZone"],
    source: "src/app/blocks/settings-layout.tsx",
  },
];

// ── Primitives & surfaces ────────────────────────────────────────────────────

const PRIMITIVES: CatalogEntry[] = [
  // Layout
  {
    id: "app-shell",
    name: "AppShell",
    kind: "primitive",
    category: "Layout",
    description: "Sidebar + main layout shell (no topbar — global actions go in Page.actions). Layout-only (the copilot is separate).",
    whenToUse: "The root of any dashboard/operations app. Pair with StudioSidebar for nav.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["AppShell"],
  },
  {
    id: "page",
    name: "Page",
    kind: "primitive",
    category: "Layout",
    description: "Centered page column with an optional title/description header. `fill` for full-height.",
    whenToUse: "Wrap every routed view. Use `fill` + AppShell `contentFill` for full-bleed pages.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Page", "PageHeader"],
  },
  {
    id: "section",
    name: "Section",
    kind: "primitive",
    category: "Layout",
    description: "Titled content section with consistent vertical rhythm.",
    whenToUse: "Group related content within a Page.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Section"],
  },
  {
    id: "stack",
    name: "Stack",
    kind: "primitive",
    category: "Layout",
    description: "Flex stack with token gaps + alignment — avoids ad-hoc flex utility soup.",
    whenToUse: "Vertical/horizontal spacing between a few elements.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Stack"],
  },
  {
    id: "breadcrumbs",
    name: "Breadcrumbs",
    kind: "primitive",
    category: "Layout",
    description: "Breadcrumb trail for nested navigation.",
    whenToUse: "Detail pages nested under a list.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Breadcrumbs"],
  },
  {
    id: "studio-sidebar",
    name: "StudioSidebar",
    kind: "primitive",
    category: "Layout",
    description: "Collapsible product nav rail with auto mobile drawer (syncs to AppShell).",
    whenToUse: "The `sidebar` slot of AppShell for multi-section apps.",
    importFrom: "@timbal-ai/timbal-react/studio",
    exports: ["StudioSidebar"],
  },
  // Data & tables
  {
    id: "data-table",
    name: "DataTable",
    kind: "primitive",
    category: "Data & tables",
    description: "Sortable, selectable, paginated table. Data prop is `rows`; `getRowKey` required.",
    whenToUse: "Tabular data. For search+filters, prefer the FilteredDataTable block.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["DataTable"],
  },
  {
    id: "filter-dropdown",
    name: "FilterDropdown",
    kind: "primitive",
    category: "Data & tables",
    description: "Data-driven faceted filter popover (multiselect/text/numeric/daterange) with active pills.",
    whenToUse: "Filtering a list. Usually via the FilteredDataTable block.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["FilterDropdown", "FilterBar"],
  },
  {
    id: "metric-row",
    name: "MetricRow",
    kind: "primitive",
    category: "Data & tables",
    description: "KPI strip of MetricTiles inside one elevated card, with inline trends + sparklines.",
    whenToUse: "Top-of-page overview numbers as a single unified card.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["MetricRow", "MetricTile"],
  },
  {
    id: "metric-chart-card",
    name: "MetricChartCard",
    kind: "primitive",
    category: "Data & tables",
    description: "Selectable KPI tiles driving a shared chart — the platform analytics pattern.",
    whenToUse: "Analytics views where picking a metric updates one chart.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["MetricChartCard"],
  },
  {
    id: "chart-panel",
    name: "ChartPanel",
    kind: "primitive",
    category: "Data & tables",
    description: "Titled card wrapper for an embedded chart.",
    whenToUse: "Dashboards surfacing a single chart.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["ChartPanel"],
  },
  {
    id: "kanban",
    name: "Kanban",
    kind: "primitive",
    category: "Data & tables",
    description: "Accessible drag-and-drop board (columns + cards, cross-column moves).",
    whenToUse: "Status/triage workflows: pipelines, sprint boards, review queues.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Kanban"],
  },
  // Charts
  {
    id: "line-area-chart",
    name: "LineAreaChart",
    kind: "primitive",
    category: "Charts",
    description: "Line/area chart on the shared chart engine; colors from --chart-N tokens.",
    whenToUse: "Time series and trends.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["LineAreaChart"],
  },
  {
    id: "pie-radial-radar",
    name: "PieChart / RadialChart / RadarChart",
    kind: "primitive",
    category: "Charts",
    description: "Donut, radial, and radar charts on the same engine + palette.",
    whenToUse: "Composition, progress, and multi-axis comparisons.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["PieChart", "RadialChart", "RadarChart"],
  },
  {
    id: "sparkline",
    name: "Sparkline",
    kind: "primitive",
    category: "Charts",
    description: "Tiny inline trend line for tiles and table cells.",
    whenToUse: "Inline trends inside StatTile/MetricTile/cards.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Sparkline"],
  },
  // Surfaces
  {
    id: "surface-card",
    name: "SurfaceCard",
    kind: "primitive",
    category: "Surfaces",
    description: "Elevated, on-token content card — the default container for grouped content.",
    whenToUse: "Wrap content that needs a card. Never hand-roll bg-card.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["SurfaceCard"],
  },
  {
    id: "stat-tile",
    name: "StatTile",
    kind: "primitive",
    category: "Surfaces",
    description: "Single label/value/hint tile with tone tinting.",
    whenToUse: "One KPI. Grid several via the StatGrid block.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["StatTile"],
  },
  {
    id: "status-badge",
    name: "StatusBadge / StatusDot",
    kind: "primitive",
    category: "Surfaces",
    description: "Toned status pill and dot.",
    whenToUse: "Row/record status (active, paused, error).",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["StatusBadge", "StatusDot"],
  },
  {
    id: "description-list",
    name: "DescriptionList",
    kind: "primitive",
    category: "Surfaces",
    description: "Key/value pairs for record detail panes.",
    whenToUse: "Detail/summary metadata.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["DescriptionList"],
  },
  {
    id: "empty-state",
    name: "EmptyState",
    kind: "primitive",
    category: "Surfaces",
    description: "Zero-data state with title, description, and an action slot.",
    whenToUse: "No data, no results, or first-run prompts.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["EmptyState"],
  },
  {
    id: "info-alert-card",
    name: "InfoCard / AlertCard",
    kind: "primitive",
    category: "Surfaces",
    description: "Toned informational and alert cards.",
    whenToUse: "Inline guidance, warnings, or callouts.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["InfoCard", "AlertCard"],
  },
  {
    id: "banner",
    name: "Banner",
    kind: "primitive",
    category: "Surfaces",
    description: "Full-width page-level notice.",
    whenToUse: "Top-of-page status (degraded, trial ending).",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Banner"],
  },
  {
    id: "timeline",
    name: "Timeline",
    kind: "primitive",
    category: "Surfaces",
    description: "Vertical event timeline.",
    whenToUse: "Activity logs, audit trails, status history.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Timeline"],
  },
  {
    id: "resource-card",
    name: "ResourceCard / CatalogCard",
    kind: "primitive",
    category: "Surfaces",
    description: "Project/agent/dataset cards on the elevated surface. Grid via ResourceGallery.",
    whenToUse: "Cards in a collection grid.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["ResourceCard", "CatalogCard"],
  },
  // Integrations
  {
    id: "integration-card",
    name: "IntegrationCard / PlanBadge",
    kind: "primitive",
    category: "Integrations",
    description: "Connector catalog tile with logo, status, and an optional plan badge.",
    whenToUse: "Integration catalogs. Grid via IntegrationsGrid.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["IntegrationCard", "PlanBadge"],
  },
  {
    id: "connection-row",
    name: "ConnectionRow / ConnectionRowList",
    kind: "primitive",
    category: "Integrations",
    description: "Connected-integration row + elevated list panel.",
    whenToUse: "List of active connections under a catalog.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["ConnectionRow", "ConnectionRowList"],
  },
  // Forms
  {
    id: "field",
    name: "Field* inputs",
    kind: "primitive",
    category: "Forms",
    description: "Self-labeled form controls (input, textarea, select, switch) — require a `label`.",
    whenToUse: "Forms. Don't hand-wire Label + Input; use Field*.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["Field", "FieldInput", "FieldTextarea", "FieldSelect", "FieldSwitch"],
  },
  {
    id: "form-section",
    name: "FormSection / SearchInput",
    kind: "primitive",
    category: "Forms",
    description: "Stacked form group; pill search field for toolbars.",
    whenToUse: "A focused form panel; search box in FilterBar.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["FormSection", "SearchInput"],
  },
  // Settings
  {
    id: "settings-section",
    name: "SettingsSection",
    kind: "primitive",
    category: "Settings",
    description: "Two-column settings block (title rail + controls). Compose via SettingsLayout.",
    whenToUse: "Settings pages.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["SettingsSection", "SettingsSectionHeader"],
  },
  {
    id: "danger-zone",
    name: "DangerZone / FloatingUnsavedChangesBar",
    kind: "primitive",
    category: "Settings",
    description: "Destructive-actions container + viewport-fixed discard/save pill.",
    whenToUse: "Settings forms with dirty state and destructive actions.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["DangerZone", "DangerZoneAction", "FloatingUnsavedChangesBar"],
  },
  // Overlays
  {
    id: "confirm-dialog",
    name: "AppConfirmDialog",
    kind: "primitive",
    category: "Overlays",
    description: "Confirm/cancel dialog for reversible actions.",
    whenToUse: "Confirm a non-destructive action.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["AppConfirmDialog"],
  },
  {
    id: "dialog-sheet",
    name: "Dialog / Sheet / AlertDialog",
    kind: "primitive",
    category: "Overlays",
    description: "Radix dialog, slide-over sheet, and destructive alert dialog primitives.",
    whenToUse: "Modals, detail drawers (Sheet), and destructive confirms (AlertDialog).",
    importFrom: "@timbal-ai/timbal-react/ui",
    exports: ["Dialog", "Sheet", "AlertDialog"],
  },
  // Copilot
  {
    id: "app-copilot",
    name: "AppCopilot",
    kind: "primitive",
    category: "Copilot",
    description: "Self-contained floating assistant — portals its own glass panel + trigger; owns state.",
    whenToUse: "Add a page copilot. Just drop <AppCopilot workforceId=… /> anywhere.",
    importFrom: "@timbal-ai/timbal-react/app",
    exports: ["AppCopilot", "CopilotProvider", "useCopilot"],
  },
];

/** The full catalog — blocks first, then primitives/surfaces. */
export const APP_KIT_CATALOG: CatalogEntry[] = [...BLOCKS, ...PRIMITIVES];

/** Look up a catalog entry by id. */
export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return APP_KIT_CATALOG.find((entry) => entry.id === id);
}
