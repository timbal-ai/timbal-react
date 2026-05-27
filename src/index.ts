// =============================================================================
// @timbal-ai/timbal-react — public API
//
// Everything below is what application code (e.g. the blueprint apps under
// `blueprint-*`) is expected to import. Internal design tokens, class
// composites, sidebar sub-components, motion easings, and the V2 button
// token bag live under `src/design/` and `src/components/studio/` and are
// deliberately NOT re-exported — they are implementation details that can
// change between minor versions.
//
// If you need to extend the studio shell or reproduce its chrome in your
// own component, prefer overriding CSS variables in `:root` / `.dark`
// (see styles.css) over reaching into internal modules.
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

export { TimbalChat } from "./components/chat";
export type { TimbalChatProps } from "./components/chat";
export { TimbalChatShell } from "./components/chat-shell";
export type { TimbalChatShellProps } from "./components/chat-shell";
export { TimbalStudioShell } from "./components/studio/studio-shell";
export type { TimbalStudioShellProps } from "./components/studio/studio-shell";

// ── Chat building blocks ─────────────────────────────────────────────────────

export { Thread } from "./components/thread";
export type {
  ThreadProps,
  ThreadComponents,
  ThreadWelcomeConfig,
  ThreadWelcomeProps,
  ThreadArtifactsConfig,
} from "./components/thread";
export { Composer } from "./components/composer";
export type { ComposerProps } from "./components/composer";
export {
  Suggestions,
  useResolvedSuggestions,
} from "./components/suggestions";
export type {
  ThreadSuggestion,
  ThreadSuggestionsProps,
  SuggestionsSource,
  SuggestionsComponent,
  SuggestionsSlotProps,
} from "./components/suggestions";
export { MarkdownText } from "./components/markdown-text";
export { ToolFallback, useToolRunning } from "./components/tool-fallback";
export { WorkforceSelector } from "./components/workforce-selector";
export type { WorkforceSelectorProps } from "./components/workforce-selector";

// ── Studio extras (sidebar, brand mark, theme toggle) ────────────────────────

export { StudioSidebar } from "./components/studio/sidebar";
export type { StudioSidebarProps } from "./components/studio/sidebar";
export { TimbalMark } from "./components/studio/timbal-mark";
export type { TimbalMarkProps } from "./components/studio/timbal-mark";
export { ModeToggle } from "./components/studio/mode-toggle";
export type {
  ModeToggleProps,
  ModeToggleTheme,
} from "./components/studio/mode-toggle";
export { StudioWelcome } from "./components/studio/welcome";
export type { StudioWelcomeProps } from "./components/studio/welcome";

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
export { TooltipIconButton } from "./components/tooltip-icon-button";
export type { TooltipIconButtonProps } from "./components/tooltip-icon-button";

// ── Utils ────────────────────────────────────────────────────────────────────

export { cn } from "./utils";
