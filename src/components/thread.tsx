"use client";

import { type ComponentType, type FC, type ReactNode, useEffect } from "react";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useThread,
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
import { motion } from "motion/react";

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
import { TimbalV2Button } from "../ui/timbal-v2-button";
import { scheduleThemeSanityCheck } from "../design/theme-sanity";
import { luxuryEase } from "./motion";
import {
  ArtifactRegistryProvider,
  type ArtifactRegistry,
} from "../artifacts/registry";
import {
  UiEventProvider,
  type UiEventEnvelope,
} from "../artifacts/ui/registry";
import { cn } from "../utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { ThreadSuggestion, SuggestionsSource } from "./suggestions";

export interface ThreadWelcomeConfig {
  heading?: string;
  subheading?: string;
  /**
   * Optional brand icon rendered above the heading. Pass any ReactNode — the
   * SDK no longer ships a default sparkle icon so apps can drop in their
   * own logo or stay minimal.
   */
  icon?: ReactNode;
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
  /** Replace the user message bubble. Access content via `MessagePrimitive.Parts`. */
  UserMessage?: ComponentType;
  /** Replace the assistant message bubble. Access content via `MessagePrimitive.Parts`. */
  AssistantMessage?: ComponentType;
  /** Replace the inline edit composer. */
  EditComposer?: ComponentType;
  /** Replace the composer (input bar). Receives all `ComposerProps` from the parent. */
  Composer?: ComponentType<ComposerProps>;
  /** Replace the welcome / empty state. Renders only while the thread is empty. */
  Welcome?: ComponentType<ThreadWelcomeProps>;
  /** Replace the suggestion list (rendered inside Welcome). */
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
  /** Max width of the message column. Default: "44rem". */
  maxWidth?: string;
  /** Welcome screen text + optional brand icon. */
  welcome?: ThreadWelcomeConfig;
  /**
   * Welcome-screen suggestion rows. Accepts a static array, a thunk, or an
   * async function for per-user suggestions.
   */
  suggestions?: SuggestionsSource;
  /** Composer input placeholder. Default: "Send a message...". */
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
   * to react to slider commits, drag gestures, or other host-side logic
   * beyond the built-in `message` action (which already appends a user
   * message).
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

  useEffect(() => {
    scheduleThemeSanityCheck();
  }, []);

  return (
    <ArtifactRegistryProvider
      renderers={artifacts?.renderers}
      override={artifacts?.override}
    >
      <UiEventProvider onEvent={onArtifactEvent ?? (() => {})}>
        <ThreadPrimitive.Root
          className={cn(
            "aui-root aui-thread-root @container flex h-full flex-col bg-transparent",
            className,
          )}
          style={{ ["--thread-max-width" as string]: maxWidth }}
        >
          <ThreadPrimitive.Viewport
            turnAnchor="bottom"
            className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-pb-4 px-4 pt-4"
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

            <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 z-10 mx-auto mt-auto flex w-full max-w-(--thread-max-width) isolate flex-col gap-4 bg-transparent pt-2 pb-4 md:pb-6">
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
// Scroll-to-bottom
// ---------------------------------------------------------------------------

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="secondary"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center disabled:invisible"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

// ---------------------------------------------------------------------------
// Welcome
// ---------------------------------------------------------------------------

const welcomeStagger = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.16, delayChildren: 0.12 },
  },
};

const welcomeItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: luxuryEase },
  },
};

const welcomeIcon = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.1, ease: luxuryEase },
  },
};

/**
 * Default empty-state. Renders only while the thread has no messages and
 * mirrors the Studio welcome — soft staggered fade-up, optional brand icon
 * (pass `welcome.icon` to use your own logo), and a single H1/subhead pair.
 */
const ThreadWelcome: FC<ThreadWelcomeProps> = ({
  config,
  suggestions,
  Suggestions: SuggestionsSlot = Suggestions,
}) => {
  const isEmpty = useThread((s) => s.messages.length === 0);
  if (!isEmpty) return null;

  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <motion.div
          className="aui-thread-welcome-message flex flex-col items-center justify-center px-4 text-center"
          variants={welcomeStagger}
          initial="initial"
          animate="animate"
        >
          {config?.icon && (
            <motion.div variants={welcomeIcon} className="mb-5">
              {config.icon}
            </motion.div>
          )}
          <motion.h1
            variants={welcomeItem}
            className="aui-thread-welcome-message-inner font-semibold text-2xl"
          >
            {config?.heading ?? "How can I help you today?"}
          </motion.h1>
          <motion.p
            variants={welcomeItem}
            className="aui-thread-welcome-message-inner mt-2 text-muted-foreground"
          >
            {config?.subheading ?? "Send a message to start a conversation."}
          </motion.p>
        </motion.div>
      </div>
      {suggestions && (
        <div className="aui-thread-welcome-suggestions mx-auto w-full max-w-(--thread-max-width) px-2">
          <SuggestionsSlot suggestions={suggestions} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
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
            // `Override` (not `Fallback`) replaces the default tool renderer
            // entirely so we never fall back to the assistant-ui boilerplate.
            tools: { Override: ToolArtifactFallback },
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 mb-3 ml-1 flex">
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const ASSISTANT_ACTION_ICON_CLASS = cn(
  "size-6 min-h-6 min-w-6 text-muted-foreground/45 hover:text-muted-foreground/80",
  // The v2 fill span sits inside `group/tbv2 > span:first-child`. We mute it
  // here so action-bar buttons read as subtle icons rather than full pills.
  "[&>span:first-child]:bg-transparent",
  "[&>span:first-child]:group-hover/tbv2:bg-muted/70",
);

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="aui-assistant-action-bar-root flex items-center gap-0 bg-transparent px-0 py-0.5 text-muted-foreground/60"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton
          tooltip="Copy"
          variant="ghost"
          className={ASSISTANT_ACTION_ICON_CLASS}
        >
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className="size-3" />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className="size-3" />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton
          tooltip="Regenerate"
          variant="ghost"
          className={ASSISTANT_ACTION_ICON_CLASS}
        >
          <RefreshCwIcon className="size-3" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            variant="ghost"
            className={cn(
              ASSISTANT_ACTION_ICON_CLASS,
              "data-[state=open]:text-muted-foreground/80",
            )}
          >
            <MoreHorizontalIcon className="size-3" />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-card-elevated"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted">
              <DownloadIcon className="size-4 shrink-0" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------

/**
 * Inline text wrapper used inside the user bubble. The default `Parts` text
 * renderer wraps content in a block `<p>`, which would stretch the bubble to
 * full width; this keeps the bubble snug around its content.
 */
const UserMessageText: FC = () => {
  return (
    <span className="whitespace-pre-wrap">
      <MessagePartPrimitive.Text smooth={false} />
    </span>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root mx-auto flex w-full max-w-(--thread-max-width) flex-col items-end gap-2 px-2 py-3"
      data-role="user"
    >
      <UserMessageAttachments />
      <motion.div
        className="aui-user-message-content relative inline-block max-w-[80%] rounded-2xl bg-bubble-user px-4 py-2.5 text-bubble-user-foreground"
        initial={{ opacity: 0, y: 8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: luxuryEase }}
      >
        <MessagePrimitive.Parts components={{ Text: UserMessageText }} />
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
          <UserActionBar />
        </div>
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton
          tooltip="Edit"
          variant="ghost"
          className={ASSISTANT_ACTION_ICON_CLASS}
        >
          <PencilIcon className="size-3" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

// ---------------------------------------------------------------------------
// Edit composer
// ---------------------------------------------------------------------------

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
            <TimbalV2Button variant="ghost" size="sm">
              Cancel
            </TimbalV2Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <TimbalV2Button variant="primary" size="sm">
              Update
            </TimbalV2Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};
