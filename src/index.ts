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
  AppShellChatTrigger,
  useAppShellChat,
  useAppShellNav,
  AppShellSidebarTrigger,
  AppCopilotProvider,
  useAppCopilotContext,
  AppChatPanel,
  Page,
  PageHeader,
  Section,
  Stack,
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
  FilterField,
  FilterDropdown,
  DataTable,
  ChartPanel,
  MetricTile,
  MetricRow,
  MetricChartCard,
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
  InfoCard,
  StatusDot,
  DescriptionList,
  ExpandableSection,
  ResourceCard,
  SettingsSection,
  SettingsSectionHeader,
  FieldRow,
  FloatingUnsavedChangesBar,
  DangerZone,
  DangerZoneAction,
  IntegrationCard,
  INTEGRATION_CATALOG_CARD_HEIGHT_CLASS,
  IntegrationsEmptyState,
  PlanBadge,
  ConnectionRow,
  ConnectionRowList,
  connectionRowListClass,
  APP_KIT_AGENT_INSTRUCTIONS,
  SEMANTIC_COLOR_TOKENS,
  RESERVED_GRADIENT_TOKENS,
  TAILWIND_PALETTE_COLORS,
  COLOR_UTILITY_PREFIXES,
  SLOP_BUDGETS,
  HOUSE_RULES,
  lintGeneratedUi,
  formatLintReport,
  reviewGeneratedUi,
  UI_REVIEW_AGENT_INSTRUCTIONS,
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
} from "./app/index";
export type {
  AppShellProps,
  AppShellChatTriggerProps,
  AppShellChatControls,
  AppShellNavControls,
  AppShellSidebarTriggerProps,
  AppCopilotProviderProps,
  AppCopilotContextValue,
  AppChatPanelProps,
  PageProps,
  AppPageWidth,
  PageHeaderProps,
  SectionProps,
  StackProps,
  StackGap,
  StackAlign,
  StackJustify,
  SurfaceCardProps,
  SurfaceCardVariant,
  SurfaceCardTone,
  StatTileProps,
  StatTileTone,
  EmptyStateProps,
  StatusBadgeProps,
  StatusBadgeTone,
  AppConfirmDialogProps,
  SubNavProps,
  SubNavItem,
  BreadcrumbsProps,
  BreadcrumbEntry,
  BreadcrumbItem as AppBreadcrumbItem,
  FieldProps,
  FieldInputProps,
  FieldTextareaProps,
  FieldSelectProps,
  FieldSwitchProps,
  SearchInputProps,
  FormSectionProps,
  FilterBarProps,
  FilterFieldProps,
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
  DataTableProps,
  DataTableColumn,
  DataTableSort,
  DataTableSortDirection,
  ChartPanelProps,
  MetricTileProps,
  MetricRowProps,
  MetricRowItem,
  MetricChartCardProps,
  MetricChartMetric,
  LineAreaChartProps,
  ChartSeries,
  ChartVariant,
  ChartTooltipIndicator,
  PieChartProps,
  RadialChartProps,
  RadarChartProps,
  SparklineProps,
  InfoCardProps,
  InfoCardTone,
  StatusDotProps,
  StatusDotTone,
  DescriptionListProps,
  DescriptionItem,
  ExpandableSectionProps,
  ResourceCardProps,
  SettingsSectionProps,
  SettingsSectionHeaderProps,
  FieldRowProps,
  FloatingUnsavedChangesBarProps,
  DangerZoneProps,
  DangerZoneActionProps,
  IntegrationCardProps,
  IntegrationCardStatus,
  IntegrationsEmptyStateProps,
  PlanBadgeProps,
  PlanBadgeTone,
  ConnectionRowProps,
  ConnectionRowListProps,
  TimbalThemeIntent,
  TimbalThemeTokens,
  TimbalThemeTypography,
  ThemeShadow,
  ThemeTokenMap,
  ThemeToCssOptions,
  TimbalThemePreset,
  TimbalThemePresetId,
  TimbalThemeStyleProps,
  SemanticColorToken,
  HouseRule,
  LintFinding,
  LintResult,
  LintOptions,
  LintSeverity,
  ReviewResult,
} from "./app/index";

// ── Hooks ────────────────────────────────────────────────────────────────────

export { useWorkforces } from "./hooks/use-workforces";
export type {
  UseWorkforcesOptions,
  UseWorkforcesResult,
} from "./hooks/use-workforces";
export { useLiveQuery, useInterval } from "./hooks/use-live-query";
export type {
  UseLiveQueryOptions,
  UseLiveQueryResult,
} from "./hooks/use-live-query";

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
  ChartSeriesConfig,
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
export type { ButtonColor } from "./ui/button";
export { UntitledButton, untitledButtonVariants } from "./ui/untitled-button";
export type {
  UntitledButtonProps,
  UntitledButtonColor,
  UntitledButtonSize,
} from "./ui/untitled-button";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AVATAR_PRIMARY_FALLBACK_CLASS,
  avatarChartVariantClass,
} from "./ui/avatar";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "./ui/popover";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./ui/select";
export { Input } from "./ui/input";
export { Textarea } from "./ui/textarea";
export { Label } from "./ui/label";
export { Checkbox } from "./ui/checkbox";
export { Switch } from "./ui/switch";
export { RadioGroup, RadioGroupItem } from "./ui/radio-group";
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormSubmit,
} from "./ui/form";
export { AspectRatio } from "./ui/aspect-ratio";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./ui/breadcrumb";
export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./ui/pagination";
export {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  ToolbarLink,
} from "./ui/toolbar";
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "./ui/menubar";
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./ui/command";
export { Calendar, CalendarDayButton } from "./ui/calendar";
export {
  Combobox,
  ComboboxTrigger,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxCommand,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxShortcut,
} from "./ui/combobox";
export {
  DatePicker,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerCalendar,
  DatePickerButton,
  formatPickerDate,
} from "./ui/date-picker";
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPHiddenInput,
  InputOTPSeparator,
} from "./ui/input-otp";
export { Kbd, KbdGroup } from "./ui/kbd";
export { Spinner } from "./ui/spinner";
export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "./ui/input-group";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";
export { Separator } from "./ui/separator";
export { Slider } from "./ui/slider";
export { Progress } from "./ui/progress";
export { Badge, badgeVariants } from "./ui/badge";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
export { ScrollArea, ScrollBar } from "./ui/scroll-area";
export { Toggle, toggleVariants } from "./ui/toggle";
export { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "./ui/context-menu";
export { Alert, AlertTitle, AlertDescription, alertVariants } from "./ui/alert";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
export { Skeleton } from "./ui/skeleton";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./ui/table";
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "./ui/toast";
export { Toaster } from "./ui/toaster";
export { toast, useToast } from "./ui/use-toast";
export type { ToastProps } from "./ui/use-toast";
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
export { AvatarGroup } from "./ui/avatar-group";
export type { AvatarGroupProps } from "./ui/avatar-group";
export { Stepper } from "./ui/stepper";
export type { StepperProps, StepperStep } from "./ui/stepper";
export { Timeline } from "./ui/timeline";
export type { TimelineProps, TimelineItem, TimelineSize } from "./ui/timeline";
export { Rating } from "./ui/rating";
export type { RatingProps, RatingTone } from "./ui/rating";
export { NumberField } from "./ui/number-field";
export type { NumberFieldProps } from "./ui/number-field";
export { TagInput } from "./ui/tag-input";
export type { TagInputProps, TagInputSize } from "./ui/tag-input";
export { Banner } from "./ui/banner";
export type {
  BannerProps,
  BannerTone,
  BannerVariant,
  BannerSize,
} from "./ui/banner";
export { CopyButton } from "./ui/copy-button";
export type { CopyButtonProps } from "./ui/copy-button";
export { Snippet } from "./ui/snippet";
export type { SnippetProps, SnippetVariant, SnippetSize } from "./ui/snippet";
export { CircularProgress } from "./ui/circular-progress";
export type { CircularProgressProps } from "./ui/circular-progress";
export { Kanban } from "./ui/kanban";
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
} from "./ui/kanban";
export { TooltipIconButton } from "./chat/tooltip-icon-button";
export type { TooltipIconButtonProps } from "./chat/tooltip-icon-button";

/** Control-surface contract — compose to build custom controls that match the kit. */
export {
  controlClass,
  controlSurfaceClass,
  overlaySurfaceClass,
  overlayListPanelClass,
  overlayItemClass,
  overlayAnimationClass,
  CONTROL_SIZE,
} from "./design/control-surface";
export type {
  ControlSize,
  ControlShape,
  ControlClassOptions,
} from "./design/control-surface";

// ── Site (expressive motion & interaction primitives) ────────────────────────

export { Reveal } from "./site/Reveal";
export type { RevealProps, RevealVariant } from "./site/Reveal";
export { TextReveal } from "./site/TextReveal";
export type { TextRevealProps } from "./site/TextReveal";
export { Parallax } from "./site/Parallax";
export type { ParallaxProps } from "./site/Parallax";
export { Marquee } from "./site/Marquee";
export type { MarqueeProps } from "./site/Marquee";
export { Magnetic } from "./site/Magnetic";
export type { MagneticProps } from "./site/Magnetic";
export { EASE, DURATION, SPRING } from "./site/easing";
export { SITE_AGENT_INSTRUCTIONS } from "./site/agent-instructions";

// ── Utils ────────────────────────────────────────────────────────────────────

export { cn } from "./utils";
