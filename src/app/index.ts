export { APP_KIT_AGENT_INSTRUCTIONS } from "./agent-instructions";

// Codegen guardrails — anti-slop vocabulary, linter, and critique loop
export {
  SEMANTIC_COLOR_TOKENS,
  RESERVED_GRADIENT_TOKENS,
  TAILWIND_PALETTE_COLORS,
  COLOR_UTILITY_PREFIXES,
  SLOP_BUDGETS,
  HOUSE_RULES,
} from "../design/ui-vocabulary";
export type {
  SemanticColorToken,
  HouseRule,
} from "../design/ui-vocabulary";
export { lintGeneratedUi, formatLintReport } from "../design/ui-lint";
export type {
  LintFinding,
  LintResult,
  LintOptions,
  LintSeverity,
} from "../design/ui-lint";
export {
  reviewGeneratedUi,
  UI_REVIEW_AGENT_INSTRUCTIONS,
} from "../design/ui-review";
export type { ReviewResult } from "../design/ui-review";

// Theming — generator, presets, apply helpers, preview UI, agent instructions
export {
  createTimbalTheme,
  themeToCss,
  applyTimbalTheme,
  clearTimbalTheme,
  ensureThemeFontLink,
  TIMBAL_THEME_PRESETS,
  getThemePreset,
  applyThemePreset,
  getStoredThemePreset,
  THEME_AGENT_INSTRUCTIONS,
  TimbalThemeStyle,
  ThemePresetGallery,
} from "./theme/index";
export type {
  TimbalThemeIntent,
  TimbalThemeTokens,
  TimbalThemeTypography,
  ThemeShadow,
  ThemeTokenMap,
  ThemeToCssOptions,
  TimbalThemePreset,
  TimbalThemePresetId,
  TimbalThemeStyleProps,
  ThemePresetGalleryProps,
} from "./theme/index";

// Layout
export { AppShell } from "./layout/AppShell";
export type { AppShellProps } from "./layout/AppShell";
export { AppShellTopbar } from "./layout/AppShellTopbar";
export type { AppShellTopbarProps } from "./layout/AppShellTopbar";
export { AppShellChatTrigger } from "./layout/AppShellChatTrigger";
export type { AppShellChatTriggerProps } from "./layout/AppShellChatTrigger";
export { useAppShellChat } from "./layout/app-shell-chat-context";
export type { AppShellChatControls } from "./layout/app-shell-chat-context";
export { Page } from "./layout/Page";
export type { PageProps } from "./layout/Page";
export { PageHeader } from "./layout/PageHeader";
export type { PageHeaderProps } from "./layout/PageHeader";
export { Section } from "./layout/Section";
export type { SectionProps } from "./layout/Section";

// Copilot
export { AppCopilotProvider, useAppCopilotContext } from "./copilot/app-copilot-context";
export type {
  AppCopilotProviderProps,
  AppCopilotContextValue,
} from "./copilot/app-copilot-context";
export { AppChatPanel } from "./chat/AppChatPanel";
export type { AppChatPanelProps } from "./chat/AppChatPanel";

// Surfaces
export { SurfaceCard } from "./surfaces/SurfaceCard";
export type { SurfaceCardProps } from "./surfaces/SurfaceCard";
export { StatTile } from "./surfaces/StatTile";
export type { StatTileProps } from "./surfaces/StatTile";
export { EmptyState } from "./surfaces/EmptyState";
export type { EmptyStateProps } from "./surfaces/EmptyState";
export { StatusBadge } from "./surfaces/StatusBadge";
export type { StatusBadgeProps, StatusBadgeTone } from "./surfaces/StatusBadge";
export { AppConfirmDialog } from "./surfaces/AppConfirmDialog";
export type { AppConfirmDialogProps } from "./surfaces/AppConfirmDialog";
export { InfoCard } from "./surfaces/InfoCard";
export type { InfoCardProps, InfoCardTone } from "./surfaces/InfoCard";
export { StatusDot } from "./surfaces/StatusDot";
export type { StatusDotProps, StatusDotTone } from "./surfaces/StatusDot";
export { DescriptionList } from "./surfaces/DescriptionList";
export type { DescriptionListProps, DescriptionItem } from "./surfaces/DescriptionList";
export { ExpandableSection } from "./surfaces/ExpandableSection";
export type { ExpandableSectionProps } from "./surfaces/ExpandableSection";
export { ResourceCard } from "./surfaces/ResourceCard";
export type { ResourceCardProps } from "./surfaces/ResourceCard";

// Settings
export { SettingsSection, SettingsSectionHeader } from "./settings/SettingsSection";
export type {
  SettingsSectionProps,
  SettingsSectionHeaderProps,
} from "./settings/SettingsSection";
export { FieldRow } from "./settings/FieldRow";
export type { FieldRowProps } from "./settings/FieldRow";
export { FloatingUnsavedChangesBar } from "./settings/FloatingUnsavedChangesBar";
export type { FloatingUnsavedChangesBarProps } from "./settings/FloatingUnsavedChangesBar";
export { DangerZone, DangerZoneAction } from "./settings/DangerZone";
export type { DangerZoneProps, DangerZoneActionProps } from "./settings/DangerZone";

// Integrations
export {
  IntegrationCard,
  INTEGRATION_CATALOG_CARD_HEIGHT_CLASS,
} from "./integrations/IntegrationCard";
export type {
  IntegrationCardProps,
  IntegrationCardStatus,
} from "./integrations/IntegrationCard";
export { IntegrationsEmptyState } from "./integrations/IntegrationsEmptyState";
export type { IntegrationsEmptyStateProps } from "./integrations/IntegrationsEmptyState";
export { PlanBadge } from "./integrations/PlanBadge";
export type { PlanBadgeProps, PlanBadgeTone } from "./integrations/PlanBadge";
export { ConnectionRow, connectionRowListClass } from "./integrations/ConnectionRow";
export type { ConnectionRowProps } from "./integrations/ConnectionRow";
export { ConnectionRowList } from "./integrations/ConnectionRowList";
export type { ConnectionRowListProps } from "./integrations/ConnectionRowList";

// Navigation
export { SubNav } from "./navigation/SubNav";
export type { SubNavProps, SubNavItem } from "./navigation/SubNav";
export { Breadcrumbs } from "./navigation/Breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbEntry, BreadcrumbItem } from "./navigation/Breadcrumbs";

// Forms
export { Field, FieldInput } from "./forms/Field";
export type { FieldProps, FieldInputProps } from "./forms/Field";
export { FieldTextarea } from "./forms/FieldTextarea";
export type { FieldTextareaProps } from "./forms/FieldTextarea";
export { FieldSelect } from "./forms/FieldSelect";
export type { FieldSelectProps } from "./forms/FieldSelect";
export { FieldSwitch } from "./forms/FieldSwitch";
export type { FieldSwitchProps } from "./forms/FieldSwitch";
export { SearchInput } from "./forms/SearchInput";
export type { SearchInputProps } from "./forms/SearchInput";
export { FormSection } from "./forms/FormSection";
export type { FormSectionProps } from "./forms/FormSection";

// Data
export { FilterBar } from "./data/FilterBar";
export type { FilterBarProps } from "./data/FilterBar";
export { DataTable } from "./data/DataTable";
export type {
  DataTableProps,
  DataTableColumn,
  DataTableSort,
  DataTableSortDirection,
} from "./data/DataTable";
export { ChartPanel } from "./data/ChartPanel";
export type { ChartPanelProps } from "./data/ChartPanel";
export { MetricTile } from "./data/MetricTile";
export type { MetricTileProps } from "./data/MetricTile";
export { MetricRow } from "./data/MetricRow";
export type { MetricRowProps, MetricRowItem } from "./data/MetricRow";
export { MetricChartCard } from "./data/MetricChartCard";
export type { MetricChartCardProps, MetricChartMetric } from "./data/MetricChartCard";

// Charts (shared engine — also powers chart artifacts)
export { LineAreaChart, Sparkline, CHART_PALETTE } from "../charts/index";
export type {
  LineAreaChartProps,
  ChartSeries,
  ChartVariant,
  ChartLayout,
  SparklineProps,
} from "../charts/index";

// Re-exports — single import path for dashboard + copilot apps
export { Button } from "../ui/button";
export { TimbalChat } from "../chat/chat";
export type { TimbalChatProps } from "../chat/chat";
export type { ThreadVariant } from "../chat/thread";
export { ChartArtifactView } from "../artifacts/chart-artifact";
export type { ChartArtifact } from "../artifacts/types";

// Layout class helpers for custom app chrome
export {
  appPageColumnClass,
  appSurfaceCardClass,
  appStatTileClass,
  appFilterBarClass,
  appSearchInputClass,
  appShellInsetTopClass,
  appShellTopbarInsetClass,
} from "../design/app-classes";
