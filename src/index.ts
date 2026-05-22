// Runtime
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
export type { AttachmentAdapter } from "@assistant-ui/react";
export { parseSSELine } from "@timbal-ai/timbal-sdk";
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
export {
  resolveAttachmentAdapter,
} from "./runtime/resolve-attachments";
export type {
  TimbalAttachmentsProp,
  TimbalAttachmentsConfig,
  ResolveAttachmentAdapterOptions,
} from "./runtime/resolve-attachments";

// Chat components
export { TimbalChat } from "./components/chat";
export type { TimbalChatProps } from "./components/chat";
export { Thread } from "./components/thread";
export type {
  ThreadProps,
  ThreadComponents,
  ThreadWelcomeConfig,
  ThreadWelcomeProps,
  ThreadArtifactsConfig,
} from "./components/thread";
export { MarkdownText } from "./components/markdown-text";
export { ToolFallback } from "./components/tool-fallback";
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

// Artifacts — rich tool / inline content rendering
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
export {
  UserMessageAttachments,
  ComposerAttachments,
  ComposerAddAttachment,
} from "./components/attachment";
export { TooltipIconButton } from "./components/tooltip-icon-button";
export type { TooltipIconButtonProps } from "./components/tooltip-icon-button";
export { default as SyntaxHighlighter } from "./components/syntax-highlighter";

// Primitives — for building custom component slots
export {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  AssistantRuntimeProvider,
  useThread,
  useThreadRuntime,
  useMessageRuntime,
  useComposerRuntime,
} from "@assistant-ui/react";

// Workforce hooks + components (extracted from the corporate blueprint)
export { useWorkforces } from "./hooks/use-workforces";
export type {
  UseWorkforcesOptions,
  UseWorkforcesResult,
} from "./hooks/use-workforces";
export { WorkforceSelector } from "./components/workforce-selector";
export type { WorkforceSelectorProps } from "./components/workforce-selector";
export { TimbalChatShell } from "./components/chat-shell";
export type { TimbalChatShellProps } from "./components/chat-shell";

// Auth
export { SessionProvider, useSession } from "./auth/provider";
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

// UI primitives
export { Button, buttonVariants } from "./ui/button";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
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

// Utils
export { cn } from "./utils";
