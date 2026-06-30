// =============================================================================
// App-kit blocks — composed, prop-driven, forkable sections.
//
// Where primitives answer "which control?", blocks answer "which section
// pattern?". Each block is a thin composition you can drop in as-is or fork
// (every file names its own source path). They are indexed in `APP_KIT_CATALOG`
// so agents can discover the exact import path and what each one composes.
// =============================================================================

export { FilteredDataTable } from "./filtered-data-table";
export type {
  FilteredDataTableProps,
  FilterCompareValue,
} from "./filtered-data-table";

export { StatGrid } from "./stat-grid";
export type { StatGridProps, StatGridItem } from "./stat-grid";

export { IntegrationsGrid } from "./integrations-grid";
export type {
  IntegrationsGridProps,
  IntegrationsGridItem,
} from "./integrations-grid";

export { ResourceGallery } from "./resource-gallery";
export type {
  ResourceGalleryProps,
  ResourceGalleryItem,
} from "./resource-gallery";

export { SettingsLayout } from "./settings-layout";
export type {
  SettingsLayoutProps,
  SettingsLayoutSection,
} from "./settings-layout";
