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

// Navigation
export { SubNav } from "./navigation/SubNav";
export type { SubNavProps, SubNavItem } from "./navigation/SubNav";
export { Breadcrumbs } from "./navigation/Breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbItem } from "./navigation/Breadcrumbs";

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

// Re-exports — single import path for dashboard + copilot apps
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
