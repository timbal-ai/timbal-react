// =============================================================================
// @timbal-ai/timbal-react — public API (root entry)
//
// The root mirrors the subpath entries so it can never drift from them:
//
//   ./ui        UI primitives (Radix-based) + control-surface contract
//   ./chat      chat surfaces, building blocks, runtime/streaming, conversations
//   ./studio    studio shells, sidebar, brand mark, mode toggle
//   ./app       app kit — layout, copilot, blocks, catalog, theme, lint
//   ./site      expressive motion & interaction primitives
//
// Prefer importing from a subpath when you know it (smaller mental surface,
// clearer intent). The root re-exports everything for convenience plus a few
// root-only modules (runtime adapters, auth, hooks, assistant-ui primitives,
// artifacts, `cn`).
//
// Export tiers (documented per subpath / README):
//   • Stable      — components & providers safe to depend on
//   • Composable  — layout/control class helpers & low-level primitives
//   • Agent/codegen — catalog, instructions, lint, theme (for UI agents)
// =============================================================================

// ── Subsystem barrels (root = subpaths, zero hand-maintained drift) ──────────
export * from "./ui";
export * from "./chat";
export * from "./studio";
export * from "./app";
export * from "./site";
export * from "./artifacts";

// ── Collision overrides ──────────────────────────────────────────────────────
// `/app` re-exports a curated slice of `/ui`, `/chat`, and `/artifacts` so a
// dashboard can be built from one import path. Those names are then exported by
// two of the barrels above; ESM marks duplicated names ambiguous and drops them.
// Pin each duplicated name to a single canonical source here.
export {
  Button,
  UntitledButton,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Banner,
  Timeline,
  Kanban,
} from "./ui";
export type {
  ButtonColor,
  UntitledButtonProps,
  UntitledButtonColor,
  UntitledButtonSize,
  BannerProps,
  TimelineProps,
  TimelineItem,
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
} from "./ui";
export { TimbalChat } from "./chat";
export type { TimbalChatProps, ThreadVariant } from "./chat";
export { ChartArtifactView } from "./artifacts";
export type { ChartArtifact, ChartSeriesConfig } from "./artifacts";
// `BreadcrumbItem`: `/ui` ships the breadcrumb component, `/app` ships a data
// type used by `Breadcrumbs`. Keep the component at root; expose the app data
// type as `AppBreadcrumbItem`.
export { BreadcrumbItem } from "./ui";
export type { BreadcrumbItem as AppBreadcrumbItem } from "./app";

// ── Runtime adapters & SDK (root-only) ───────────────────────────────────────
export { parseSSELine } from "@timbal-ai/timbal-sdk";
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

// ── Hooks (root-only) ────────────────────────────────────────────────────────
export { useWorkforces } from "./hooks/use-workforces";
export type {
  UseWorkforcesOptions,
  UseWorkforcesResult,
} from "./hooks/use-workforces";

// ── Auth (root-only) ─────────────────────────────────────────────────────────
export {
  SessionProvider,
  useSession,
  useOptionalSession,
} from "./auth/provider";
export type { ConfigStatus } from "./auth/provider";
export { AuthGuard } from "./auth/guard";
export { TimbalLoginScreen } from "./auth/login-screen";
export type { TimbalLoginScreenProps } from "./auth/login-screen";
export {
  fetchProjectConfig,
  normalizeProjectConfig,
  AUTH_PROVIDERS,
} from "./auth/config";
export type {
  AuthProvider,
  AuthConfig,
  ProjectInfo,
  ProjectConfig,
  ConfigResult,
  FetchProjectConfigOptions,
} from "./auth/config";
export {
  authFetch,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  refreshAccessToken,
  fetchCurrentUser,
  setAuthBaseUrl,
  getAuthBaseUrl,
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

// ── Utils ────────────────────────────────────────────────────────────────────
export { cn } from "./utils";
