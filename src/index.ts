// =============================================================================
// @timbal-ai/timbal-react — public API (main entry)
//
// Subpath entries: ./chat, ./studio, ./ui, ./app, ./styles.css
// See README for stable / composable / internal API tiers.
// =============================================================================

// ── Runtime + streaming ──────────────────────────────────────────────────────

export {
  TimbalRuntimeProvider,
  useTimbalStream,
  useTimbalRuntime,
} from "./runtime/provider";
export type {
  TimbalRuntimeProviderProps,
  UseTimbalStreamOptions,
  TimbalStreamApi,
  SendOptions,
  ChatAttachment,
  ChatMessage,
  ContentPart,
  TextContentPart,
  ToolCallContentPart,
} from "./runtime/provider";
export type { ThinkingContentPart } from "./runtime/types";
export { parseSSELine } from "@timbal-ai/timbal-sdk";

// ── Attachments ──────────────────────────────────────────────────────────────

export type { AttachmentAdapter } from "@assistant-ui/react";
export {
  createDefaultAttachmentAdapter,
  createUploadAttachmentAdapter,
  DEFAULT_UPLOAD_ACCEPT,
} from "./runtime/upload-adapter";
export type {
  CreateDefaultAttachmentAdapterOptions,
  CreateUploadAttachmentAdapterOptions,
  UploadFetchFn,
} from "./runtime/upload-adapter";
export { resolveAttachmentAdapter } from "./runtime/resolve-attachments";
export type {
  TimbalAttachmentsProp,
  TimbalAttachmentsConfig,
  ResolveAttachmentAdapterOptions,
} from "./runtime/resolve-attachments";

// ── Chat surfaces (three escalating tiers) ───────────────────────────────────

export { TimbalChat } from "./chat/chat";
export type { TimbalChatProps } from "./chat/chat";
export { TimbalChatShell } from "./studio/shell/chat-shell";
export type { TimbalChatShellProps } from "./studio/shell/chat-shell";
export { TimbalStudioShell } from "./studio/shell/studio-shell";
export type { TimbalStudioShellProps } from "./studio/shell/studio-shell";

// ── Chat building blocks ─────────────────────────────────────────────────────

export { Thread } from "./chat/thread";
export type {
  ThreadProps,
  ThreadVariant,
  ThreadComponents,
  ThreadWelcomeConfig,
  ThreadWelcomeProps,
  ThreadArtifactsConfig,
} from "./chat/thread";
export { Composer } from "./chat/composer";
export type { ComposerProps } from "./chat/composer";
export {
  Suggestions,
  useResolvedSuggestions,
} from "./chat/suggestions";
export type {
  ThreadSuggestion,
  ThreadSuggestionsProps,
  SuggestionsSource,
  SuggestionsComponent,
  SuggestionsSlotProps,
} from "./chat/suggestions";
export { MarkdownText } from "./chat/markdown-text";
export { ToolFallback, useToolRunning } from "./chat/tool-fallback";
export { WorkforceSelector } from "./chat/workforce-selector";
export type { WorkforceSelectorProps } from "./chat/workforce-selector";

/** Composable layout classes for custom message slots — also available from `./chat`. */
export {
  THREAD_DEFAULT_MAX_WIDTH,
  threadMessageColumnClass,
  assistantMessageRootClass,
  assistantMessageContentClass,
  userMessageRootClass,
} from "./chat/layout";

// ── Studio extras (sidebar, brand mark, theme toggle) ────────────────────────

export { StudioSidebar } from "./studio/sidebar/sidebar";
export type { StudioSidebarProps } from "./studio/sidebar/sidebar";
export { TimbalMark } from "./studio/sidebar/timbal-mark";
export type { TimbalMarkProps } from "./studio/sidebar/timbal-mark";
export { ModeToggle } from "./studio/sidebar/mode-toggle";
export type {
  ModeToggleProps,
  ModeToggleTheme,
} from "./studio/sidebar/mode-toggle";
export {
  StudioModeSwitch,
  STUDIO_NAV_MODE,
} from "./studio/mode-switch";
export type { StudioModeSwitchProps, StudioNavMode } from "./studio/mode-switch";
export { StudioWelcome } from "./studio/sidebar/welcome";
export type { StudioWelcomeProps } from "./studio/sidebar/welcome";

// ── App kit (dashboards / complex apps) — also available from `./app` ────────

export {
  AppShell,
  AppShellTopbar,
  AppShellChatTrigger,
  useAppShellChat,
  AppCopilotProvider,
  useAppCopilotContext,
  AppChatPanel,
  Page,
  PageHeader,
  Section,
  SurfaceCard,
  StatTile,
  EmptyState,
  StatusBadge,
  AppConfirmDialog,
  SubNav,
  Breadcrumbs,
  Field,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  FieldSwitch,
  SearchInput,
  FormSection,
  FilterBar,
  DataTable,
  ChartPanel,
} from "./app/index";
export type {
  AppShellProps,
  AppShellTopbarProps,
  AppShellChatTriggerProps,
  AppShellChatControls,
  AppCopilotProviderProps,
  AppCopilotContextValue,
  AppChatPanelProps,
  PageProps,
  PageHeaderProps,
  SectionProps,
  SurfaceCardProps,
  StatTileProps,
  EmptyStateProps,
  StatusBadgeProps,
  StatusBadgeTone,
  AppConfirmDialogProps,
  SubNavProps,
  SubNavItem,
  BreadcrumbsProps,
  BreadcrumbItem,
  FieldProps,
  FieldInputProps,
  FieldTextareaProps,
  FieldSelectProps,
  FieldSwitchProps,
  SearchInputProps,
  FormSectionProps,
  FilterBarProps,
  DataTableProps,
  DataTableColumn,
  DataTableSort,
  DataTableSortDirection,
  ChartPanelProps,
} from "./app/index";

// ── Hooks ────────────────────────────────────────────────────────────────────

export { useWorkforces } from "./hooks/use-workforces";
export type {
  UseWorkforcesOptions,
  UseWorkforcesResult,
} from "./hooks/use-workforces";

// ── Artifacts ────────────────────────────────────────────────────────────────

export {
  ArtifactRegistryProvider,
  ArtifactView,
  defaultArtifactRenderers,
  useArtifactRegistry,
  ArtifactCard,
  ChartArtifactView,
  QuestionArtifactView,
  HtmlArtifactView,
  JsonArtifactView,
  TableArtifactView,
  ToolArtifactFallback,
  isArtifact,
  parseArtifactFromToolResult,
  findMarkdownArtifacts,
  splitMarkdownByArtifacts,
  ARTIFACT_FENCE_LANGUAGES,
  isArtifactFenceLanguage,
  ARTIFACT_AGENT_INSTRUCTIONS,
  UiEventProvider,
  UiCustomNodeRegistryProvider,
  UiArtifactView,
  UiNodeView,
  isUiBinding,
  getPath,
  setPath,
  resolveBindable,
  useUiState,
  useUiDispatch,
  useUiEventEmitter,
  useUiCustomNodeRegistry,
} from "./artifacts";
export type {
  TimbalArtifact,
  AnyArtifact,
  ChartArtifact,
  QuestionArtifact,
  QuestionOption,
  HtmlArtifact,
  JsonArtifact,
  TableArtifact,
  UiArtifact,
  UiNode,
  UiAction,
  UiEventEnvelope,
  ArtifactRegistry,
  ArtifactRenderer,
  ArtifactRendererProps,
  MarkdownArtifactMatch,
  MarkdownSegment,
} from "./artifacts";

// ── Auth ─────────────────────────────────────────────────────────────────────

export {
  SessionProvider,
  useSession,
  useOptionalSession,
} from "./auth/provider";
export { AuthGuard } from "./auth/guard";
export {
  authFetch,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  refreshAccessToken,
  fetchCurrentUser,
} from "./auth/tokens";

// ── @assistant-ui/react primitives (for custom thread slots) ─────────────────

export {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  AuiIf,
  AssistantRuntimeProvider,
  useThread,
  useThreadRuntime,
  useMessageRuntime,
  useComposerRuntime,
} from "@assistant-ui/react";

// ── UI primitives (Radix-based) ──────────────────────────────────────────────

export { Button } from "./ui/button";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
export { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export { Shimmer } from "./ui/shimmer";
export type { TextShimmerProps } from "./ui/shimmer";
export {
  PillSegmentedTabs,
  MemoPillSegmentedTabs,
} from "./ui/pill-segmented-tabs";
export type {
  PillSegmentedTab,
  PillSegmentedTabsProps,
} from "./ui/pill-segmented-tabs";
export { TooltipIconButton } from "./chat/tooltip-icon-button";
export type { TooltipIconButtonProps } from "./chat/tooltip-icon-button";

// ── Utils ────────────────────────────────────────────────────────────────────

export { cn } from "./utils";
