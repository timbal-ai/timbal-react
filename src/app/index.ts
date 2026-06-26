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
} from "./theme/index";

// Layout
export { AppShell } from "./layout/AppShell";
export type { AppShellProps } from "./layout/AppShell";
export { AppShellChatTrigger } from "./layout/AppShellChatTrigger";
export type { AppShellChatTriggerProps } from "./layout/AppShellChatTrigger";
export { useAppShellChat } from "./layout/app-shell-chat-context";
export type { AppShellChatControls } from "./layout/app-shell-chat-context";
export { useAppShellNav } from "./layout/app-shell-nav-context";
export type { AppShellNavControls } from "./layout/app-shell-nav-context";
export { AppShellSidebarTrigger } from "./layout/AppShellSidebarTrigger";
export type { AppShellSidebarTriggerProps } from "./layout/AppShellSidebarTrigger";
export { Page } from "./layout/Page";
export type { PageProps, AppPageWidth } from "./layout/Page";
export { PageHeader } from "./layout/PageHeader";
export type { PageHeaderProps } from "./layout/PageHeader";
export { Section } from "./layout/Section";
export type { SectionProps } from "./layout/Section";
export { Stack } from "./layout/Stack";
export type {
  StackProps,
  StackGap,
  StackAlign,
  StackJustify,
} from "./layout/Stack";
export {
  AppDensityProvider,
  useAppDensity,
  useAppDensityClass,
} from "./layout/app-density-context";
export type { AppDensityProviderProps } from "./layout/app-density-context";
export {
  APP_DENSITY_CHART_HEIGHT,
  APP_DENSITY_CLASSES,
  appDensityClass,
  type AppDensity,
  type AppDensityClassKey,
} from "../design/app-density";

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
export type {
  SurfaceCardProps,
  SurfaceCardVariant,
  SurfaceCardTone,
} from "./surfaces/SurfaceCard";
export { StatTile } from "./surfaces/StatTile";
export type { StatTileProps, StatTileTone } from "./surfaces/StatTile";
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
export { AlertCard } from "./surfaces/AlertCard";
export type { AlertCardProps } from "./surfaces/AlertCard";
export { CatalogCard } from "./surfaces/CatalogCard";
export type { CatalogCardProps } from "./surfaces/CatalogCard";

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
export { FilterField } from "./data/FilterField";
export type { FilterFieldProps } from "./data/FilterField";
export { FilterDropdown } from "./data/FilterDropdown";
export type {
  FilterDropdownProps,
  FilterFieldDef,
  FilterFieldType,
  FilterSelectOption,
  FilterDatePreset,
  FilterNumericOperatorOption,
  FilterValue,
  FilterValues,
  FilterDateRangeValue,
  FilterNumericValue,
  NumericOperator,
} from "./data/FilterDropdown";
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

// Hooks — live/polling data for dashboards
export { useLiveQuery, useInterval } from "../hooks/use-live-query";
export type {
  UseLiveQueryOptions,
  UseLiveQueryResult,
} from "../hooks/use-live-query";

// Charts (shared engine — also powers chart artifacts)
export {
  LineAreaChart,
  PieChart,
  RadialChart,
  RadarChart,
  Sparkline,
  CHART_PALETTE,
  resolveChartMargin,
  resolveTooltipCategory,
  flushBarCategoryGap,
  flushLineAreaEdgeToEdge,
} from "../charts/index";
export type {
  LineAreaChartProps,
  ChartSeries,
  ChartVariant,
  ChartLayout,
  ChartTooltipIndicator,
  ChartMargin,
  PieChartProps,
  RadialChartProps,
  RadarChartProps,
  SparklineProps,
} from "../charts/index";

// Re-exports — single import path for dashboard + copilot apps
export { Button } from "../ui/button";
export type { ButtonColor } from "../ui/button";
export { UntitledButton } from "../ui/untitled-button";
export type {
  UntitledButtonProps,
  UntitledButtonColor,
  UntitledButtonSize,
} from "../ui/untitled-button";
export { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
export type { AvatarVariant } from "../ui/avatar";
export { Banner } from "../ui/banner";
export type { BannerProps } from "../ui/banner";
export { Timeline } from "../ui/timeline";
export type { TimelineProps, TimelineItem } from "../ui/timeline";
export { Kanban } from "../ui/kanban";
export type {
  KanbanProps,
  KanbanColumnData,
  KanbanCardData,
  KanbanMoveEvent,
  KanbanLocation,
  KanbanRenderCardContext,
  KanbanTone,
  KanbanDensity,
  KanbanCardVariant,
  KanbanDragHandleProps,
} from "../ui/kanban";
export { TimbalChat } from "../chat/chat";
export type { TimbalChatProps } from "../chat/chat";
export type { ThreadVariant } from "../chat/thread";
export { ChartArtifactView } from "../artifacts/chart-artifact";
export type { ChartArtifact, ChartSeriesConfig } from "../artifacts/types";

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
