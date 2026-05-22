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
import { Button } from "../ui/button";
import { cn } from "../utils";

export interface ComposerProps {
  /** Placeholder shown in the textarea. Default: "Send a message..." */
  placeholder?: string;
  /**
   * Show the file-attach button. Default: true. Disable when the agent has
   * no use for attachments to keep the UI clean.
   */
  showAttachments?: boolean;
  /**
   * Extra content rendered inside the toolbar, to the left of the send
   * button. Use for custom buttons (voice, model picker, etc).
   */
  toolbar?: ReactNode;
  /**
   * Tooltip on the send button. Default: "Send message".
   */
  sendTooltip?: string;
  /** Disable autofocus on mount. Default: false (autofocused). */
  noAutoFocus?: boolean;
  /** Extra className applied to the outer composer wrapper. */
  className?: string;
}

/**
 * Composer v2 — auto-resizing textarea, Enter-to-send / Shift+Enter newline,
 * attach button on the left, send/stop on the right. Use as a top-level
 * component inside `<TimbalRuntimeProvider>` (or via `<Thread components={{
 * Composer }}>`).
 */
export const Composer: FC<ComposerProps> = ({
  placeholder = "Send a message...",
  showAttachments = true,
  toolbar,
  sendTooltip = "Send message",
  noAutoFocus,
  className,
}) => {
  return (
    <ComposerPrimitive.Root
      className={cn(
        "aui-composer-root relative mt-3 flex w-full flex-col",
        className,
      )}
    >
      <ComposerPrimitive.AttachmentDropzone
        className="aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50"
      >
        {showAttachments && <ComposerAttachments />}
        <ComposerInput placeholder={placeholder} autoFocus={!noAutoFocus} />
        <ComposerToolbar
          showAttachments={showAttachments}
          toolbar={toolbar}
          sendTooltip={sendTooltip}
        />
      </ComposerPrimitive.AttachmentDropzone>
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
      className="aui-composer-input mb-1 max-h-60 min-h-12 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
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
    <div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center gap-1">
      {showAttachments && <ComposerAddAttachment />}
      {toolbar}
      <div className="flex-1" />
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
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </>
  );
};
