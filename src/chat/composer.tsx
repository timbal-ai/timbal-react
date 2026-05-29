"use client";

import { type FC, type ReactNode } from "react";
import {
  AuiIf,
  ComposerPrimitive,
  useComposerRuntime,
} from "@assistant-ui/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

import { ComposerAddAttachment, ComposerAttachments } from "./attachment";
import { TooltipIconButton } from "./tooltip-icon-button";
import { studioComposeInputShellClass } from "../design/classes";
import { useTimbalAttachmentsEnabled } from "../runtime/attachments-context";
import { cn } from "../utils";

export interface ComposerProps {
  /** Placeholder shown in the textarea. Default: "Send a message..." */
  placeholder?: string;
  /**
   * Show the file-attach button and dropzone. Default: follow the runtime
   * (`attachments` on `TimbalChat`). Pass `false` to hide even when uploads
   * are enabled; pass `true` to show only when an attachment adapter is active.
   */
  showAttachments?: boolean;
  /** Extra content rendered inside the toolbar, left of the send button. */
  toolbar?: ReactNode;
  /** Tooltip shown on the send button. Default: "Send message". */
  sendTooltip?: string;
  /** Disable autofocus on mount. Default: false. */
  noAutoFocus?: boolean;
  /** Extra className applied to the outer composer wrapper. */
  className?: string;
}

/**
 * Default chat composer — auto-resizing textarea with Enter-to-send,
 * Shift+Enter for newline, attach pill on the left, and a circular send /
 * cancel button on the right. Wraps `ComposerPrimitive` so consumers can
 * override individual slots without losing the Studio chrome.
 */
export const Composer: FC<ComposerProps> = ({
  placeholder = "Send a message...",
  showAttachments,
  toolbar,
  sendTooltip = "Send message",
  noAutoFocus,
  className,
}) => {
  const attachmentsEnabled = useTimbalAttachmentsEnabled();
  const attachUi = showAttachments !== false && attachmentsEnabled;

  const shell = (
    <>
      {attachUi && <ComposerAttachments />}
      <ComposerInput placeholder={placeholder} autoFocus={!noAutoFocus} />
      <ComposerToolbar
        showAttachments={attachUi}
        toolbar={toolbar}
        sendTooltip={sendTooltip}
      />
    </>
  );

  return (
    <ComposerPrimitive.Root
      className={cn(
        "aui-composer-root relative flex w-full flex-col",
        className,
      )}
    >
      {attachUi ? (
        <ComposerPrimitive.AttachmentDropzone
          className={cn(
            studioComposeInputShellClass,
            "data-[dragging=true]:border-2 data-[dragging=true]:border-dashed data-[dragging=true]:border-primary data-[dragging=true]:bg-accent/50",
          )}
        >
          {shell}
        </ComposerPrimitive.AttachmentDropzone>
      ) : (
        <div className={studioComposeInputShellClass}>{shell}</div>
      )}
    </ComposerPrimitive.Root>
  );
};

// ---------------------------------------------------------------------------
// Input — auto-resizing, Enter to send, Shift+Enter for newline
// ---------------------------------------------------------------------------

const ComposerInput: FC<{ placeholder: string; autoFocus: boolean }> = ({
  placeholder,
  autoFocus,
}) => {
  const composer = useComposerRuntime();

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      composer.send();
    }
  };

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  };

  return (
    <ComposerPrimitive.Input
      placeholder={placeholder}
      className="aui-composer-input max-h-60 min-h-14 w-full resize-none bg-composer-bg px-3 pt-3 pb-1 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
      rows={1}
      autoFocus={autoFocus}
      aria-label="Message input"
      onKeyDown={onKeyDown}
      onInput={onInput}
    />
  );
};

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const ComposerToolbar: FC<{
  showAttachments: boolean;
  toolbar: ReactNode;
  sendTooltip: string;
}> = ({ showAttachments, toolbar, sendTooltip }) => {
  return (
    <div className="aui-composer-action-wrapper relative z-[1] flex items-center justify-between gap-1 bg-composer-bg px-2.5 pb-2.5">
      <div className="flex items-center gap-1">
        {showAttachments && <ComposerAddAttachment />}
        {toolbar}
      </div>
      <ComposerSendOrCancel sendTooltip={sendTooltip} />
    </div>
  );
};

const ComposerSendOrCancel: FC<{ sendTooltip: string }> = ({ sendTooltip }) => {
  return (
    <>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip={sendTooltip}
            variant="primary"
            type="submit"
            className="aui-composer-send shrink-0 disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Stop generating"
            variant="primary"
            className="aui-composer-cancel shrink-0"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </>
  );
};
