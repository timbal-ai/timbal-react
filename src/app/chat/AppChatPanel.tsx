"use client";

import { XIcon } from "lucide-react";
import type { FC } from "react";

import { Thread, type ThreadProps } from "../../chat/thread";
import {
  TimbalRuntimeProvider,
  type TimbalRuntimeProviderProps,
} from "../../runtime/provider";
import { cn } from "../../utils";
import { useAppShellChat } from "../layout/app-shell-chat-context";

const shellClass =
  "aui-app-chat-panel flex h-full min-h-0 flex-col overflow-hidden";

/** Dedicated top band — messages never share this row with the close control. */
const chromeClass = cn(
  "aui-app-chat-panel-chrome relative z-20 flex min-h-12 shrink-0 items-center justify-end",
  "bg-card/90 px-2 pt-3 pb-3 backdrop-blur-sm",
);

const closeButtonClass = cn(
  "aui-app-chat-panel-close flex size-8 shrink-0 items-center justify-center rounded-md",
  "text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
);

const bodyClass = cn(
  "aui-app-chat-panel-body relative min-h-0 flex-1 overflow-hidden",
  "[&_.aui-thread-root]:h-full",
  "[&_.aui-thread-viewport]:scrollbar-thin",
  "[&_.aui-thread-viewport]:[scrollbar-color:var(--border)_transparent]",
  // Reserve the scrollbar gutter on BOTH edges so the composer + messages
  // stay symmetric (otherwise the right-side scrollbar adds a phantom inset).
  "[&_.aui-thread-viewport]:[scrollbar-gutter:stable_both-edges]",
  // Tighter symmetric horizontal inset for panel + composer
  "[&_.aui-thread-viewport]:!px-2",
  "[&_.aui-thread-viewport]:!pt-2",
  "[&_.aui-user-message-root]:!px-0",
  "[&_.aui-composer-input]:!px-2",
  "[&_.aui-composer-action-wrapper]:!px-2",
);

export interface AppChatPanelProps
  extends Omit<TimbalRuntimeProviderProps, "children">,
    Omit<ThreadProps, "variant" | "maxWidth"> {
  className?: string;
}

/**
 * Floating copilot body — `TimbalRuntimeProvider` + compact `Thread`.
 * Render inside `AppShell` `chat`; open/close via shell trigger or `useAppShellChat`.
 */
export const AppChatPanel: FC<AppChatPanelProps> = ({
  className,
  workforceId,
  baseUrl,
  fetch,
  attachments,
  attachmentsUploadUrl,
  attachmentsAccept,
  debug,
  welcome,
  suggestions,
  composerPlaceholder,
  components,
  artifacts,
  onArtifactEvent,
  ...rest
}) => {
  const shellChat = useAppShellChat();

  return (
    <div className={cn(shellClass, className)}>
      {shellChat?.collapsible ? (
        <div className={chromeClass}>
          <button
            type="button"
            className={closeButtonClass}
            onClick={() => shellChat.setOpen(false)}
            aria-label="Close assistant"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className={bodyClass}>
        <TimbalRuntimeProvider
          workforceId={workforceId}
          baseUrl={baseUrl}
          fetch={fetch}
          attachments={attachments}
          attachmentsUploadUrl={attachmentsUploadUrl}
          attachmentsAccept={attachmentsAccept}
          debug={debug}
        >
          <Thread
            variant="panel"
            className="aui-app-chat-panel-thread"
            welcome={welcome}
            suggestions={suggestions}
            composerPlaceholder={composerPlaceholder}
            components={components}
            artifacts={artifacts}
            onArtifactEvent={onArtifactEvent}
            {...rest}
          />
        </TimbalRuntimeProvider>
      </div>
    </div>
  );
};
