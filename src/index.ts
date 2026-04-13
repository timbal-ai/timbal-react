// Runtime
export { TimbalRuntimeProvider } from "./runtime/provider";
export type { TimbalRuntimeProviderProps } from "./runtime/provider";

// Chat components
export { TimbalChat } from "./components/chat";
export type { TimbalChatProps } from "./components/chat";
export { Thread } from "./components/thread";
export type {
  ThreadProps,
  ThreadComponents,
  ThreadSuggestion,
  ThreadWelcomeConfig,
  ThreadWelcomeProps,
} from "./components/thread";
export { MarkdownText } from "./components/markdown-text";
export { ToolFallback } from "./components/tool-fallback";
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
  useThread,
  useThreadRuntime,
  useMessageRuntime,
  useComposerRuntime,
} from "@assistant-ui/react";

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
