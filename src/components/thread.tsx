import { UserMessageAttachments } from "./attachment";
import { MarkdownText } from "./markdown-text";
import { ToolArtifactFallback } from "../artifacts/tool-artifact";
import { TooltipIconButton } from "./tooltip-icon-button";
import { Composer, type ComposerProps } from "./composer";
import {
  Suggestions,
  type SuggestionsComponent,
  type SuggestionsSource,
} from "./suggestions";
import { Button } from "../ui/button";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
} from "lucide-react";
import { type ComponentType, type FC } from "react";
import { cn } from "../utils";
import {
  ArtifactRegistryProvider,
  type ArtifactRegistry,
} from "../artifacts/registry";
import {
  UiEventProvider,
  type UiEventEnvelope,
} from "../artifacts/ui/registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { ThreadSuggestion, SuggestionsSource } from "./suggestions";

export interface ThreadWelcomeConfig {
  heading?: string;
  subheading?: string;
}

export interface ThreadWelcomeProps {
  config?: ThreadWelcomeConfig;
  suggestions?: SuggestionsSource;
  /**
   * The resolved `Suggestions` component (default or user-overridden via
   * `components.Suggestions`). Custom Welcome implementations should render
   * this and pass their `suggestions` source through.
   */
  Suggestions?: SuggestionsComponent;
}

export interface ThreadComponents {
  /** Replace the user message bubble. Access message content via `MessagePrimitive.Parts`. */
  UserMessage?: ComponentType;
  /** Replace the assistant message bubble. Access message content via `MessagePrimitive.Parts`. */
  AssistantMessage?: ComponentType;
  /** Replace the inline edit composer. */
  EditComposer?: ComponentType;
  /** Replace the composer (input bar). Receives all `ComposerProps` from the parent. */
  Composer?: ComponentType<ComposerProps>;
  /** Replace the welcome / empty state. Receives `config` and `suggestions` props. Controls its own visibility — use `useThread(s => s.isEmpty)` to replicate the default behaviour. */
  Welcome?: ComponentType<ThreadWelcomeProps>;
  /** Replace the suggestion chip block (rendered inside Welcome and inline). */
  Suggestions?: SuggestionsComponent;
  /** Replace the scroll-to-bottom button. */
  ScrollToBottom?: ComponentType;
}

export interface ThreadArtifactsConfig {
  /** Custom artifact renderers, merged on top of the built-in defaults. */
  renderers?: ArtifactRegistry;
  /** Replace the built-in renderers entirely instead of merging. */
  override?: boolean;
}

export type { UiEventEnvelope };

export interface ThreadProps {
  className?: string;
  /** Max width of the message column. Default: "44rem" */
  maxWidth?: string;
  /** Welcome screen text */
  welcome?: ThreadWelcomeConfig;
  /**
   * Welcome-screen suggestion chips. Accepts a static array, a thunk, or an
   * async function for per-user suggestions.
   */
  suggestions?: SuggestionsSource;
  /** Composer input placeholder. Default: "Send a message..." */
  composerPlaceholder?: string;
  /** Override individual UI slots while keeping the rest as defaults. */
  components?: ThreadComponents;
  /**
   * Configure how rich tool/artifact results render. Pass `renderers` to add
   * support for custom artifact `type` values. Built-in types (`chart`,
   * `question`, `html`, `json`, `table`, `ui`) are always available unless
   * `override: true` is set.
   */
  artifacts?: ThreadArtifactsConfig;
  /**
   * Called when a `ui` artifact fires an `{ kind: "emit" }` action. Use this
   * to react to slider commits, drag gestures, or other host-side logic beyond
   * the built-in `message` action (which already appends a user message).
   */
  onArtifactEvent?: (event: UiEventEnvelope) => void;
}

// ---------------------------------------------------------------------------
// Thread
// ---------------------------------------------------------------------------

export const Thread: FC<ThreadProps> = ({
  className,
  maxWidth = "44rem",
  welcome,
  suggestions,
  composerPlaceholder = "Send a message...",
  components,
  artifacts,
  onArtifactEvent,
}) => {
  const WelcomeSlot = components?.Welcome ?? ThreadWelcome;
  const ComposerSlot = components?.Composer ?? Composer;
  const UserMessageSlot = components?.UserMessage ?? UserMessage;
  const AssistantMessageSlot = components?.AssistantMessage ?? AssistantMessage;
  const EditComposerSlot = components?.EditComposer ?? EditComposer;
  const ScrollToBottomSlot = components?.ScrollToBottom ?? ThreadScrollToBottom;
  const SuggestionsSlot: SuggestionsComponent =
    components?.Suggestions ?? Suggestions;

  return (
    <ArtifactRegistryProvider
      renderers={artifacts?.renderers}
      override={artifacts?.override}
    >
    <UiEventProvider onEvent={onArtifactEvent ?? (() => {})}>
    <ThreadPrimitive.Root
      className={cn(
        "aui-root aui-thread-root @container flex h-full flex-col bg-background",
        className,
      )}
      style={{ ["--thread-max-width" as string]: maxWidth }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="bottom"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4 pt-4"
      >
        <WelcomeSlot
          config={welcome}
          suggestions={suggestions}
          Suggestions={SuggestionsSlot}
        />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessageSlot,
            EditComposer: EditComposerSlot,
            AssistantMessage: AssistantMessageSlot,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
          <ScrollToBottomSlot />
          <ComposerSlot placeholder={composerPlaceholder} />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
    </UiEventProvider>
    </ArtifactRegistryProvider>
  );
};

// ---------------------------------------------------------------------------
// Welcome
// ---------------------------------------------------------------------------

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC<ThreadWelcomeProps> = ({
  config,
  suggestions,
  Suggestions: SuggestionsSlot = Suggestions,
}) => {
  return (
    <AuiIf condition={(s) => s.thread.isEmpty}>
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col items-center justify-center px-4 text-center">
          <div className="fade-in animate-in fill-mode-both relative mb-6 flex size-14 items-center justify-center duration-300">
            <div className="animate-ai-ring-glow absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15" />
            <div className="animate-ai-pulse-ring absolute inset-0" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ai-breathe relative size-7 text-primary/75"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
          </div>
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
            {config?.heading ?? "How can I help you today?"}
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground mt-2 delay-75 duration-200">
            {config?.subheading ?? "Send a message to start a conversation."}
          </p>
        </div>
      </div>
      {suggestions && <SuggestionsSlot suggestions={suggestions} />}
    </div>
    </AuiIf>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { Fallback: ToolArtifactFallback },
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 ml-2 flex">
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
          <UserActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};
