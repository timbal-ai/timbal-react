"use client";

import type { FC } from "react";

import { TimbalV2Button } from "../../ui/timbal-v2-button";
import { cn } from "../../utils";
import { useCopilot } from "../copilot/context";

export interface AppShellChatTriggerProps {
  className?: string;
  label?: string;
  /**
   * `floating` — primary pill fixed bottom-right (matches shell default).
   * `inline` — for topbar/actions rows; text only, no icons.
   */
  placement?: "floating" | "inline";
}

const floatingPositionClass =
  "fixed bottom-6 right-6 z-50 max-sm:bottom-4 max-sm:right-4";

/**
 * Text-only custom trigger that opens the copilot. Requires an app-level
 * `<CopilotProvider>` ancestor so it shares state with `<AppCopilot>`.
 * `AppCopilot` ships its own SiriWave trigger, so this is only for bespoke
 * triggers (e.g. in a topbar).
 */
export const AppShellChatTrigger: FC<AppShellChatTriggerProps> = ({
  className,
  label = "Assistant",
  placement = "inline",
}) => {
  const shellChat = useCopilot();
  if (!shellChat || shellChat.open) return null;

  return (
    <TimbalV2Button
      type="button"
      variant={placement === "floating" ? "primary" : "secondary"}
      size="sm"
      className={cn(
        "aui-app-shell-chat-trigger",
        placement === "floating" && floatingPositionClass,
        placement === "floating" && "shadow-card-elevated",
        className,
      )}
      onClick={() => shellChat.setOpen(true)}
      aria-expanded={false}
    >
      {label}
    </TimbalV2Button>
  );
};
