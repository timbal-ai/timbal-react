"use client";

import { type FC, useCallback, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquarePlus } from "lucide-react";
import { useThread } from "@assistant-ui/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { DOM_IDS } from "../../design/tokens";
import { useTimbalRuntime } from "../../runtime/provider";
import { useStudioSidebarLayout } from "./sidebar-context";
import { studioSidebarNavItemClasses } from "./sidebar-layout";

interface StudioSidebarRuntimePortalProps {
  label?: string;
}

/**
 * Renders inside the thread runtime; portals a "New chat" button into the
 * floating studio sidebar so it can clear the conversation without
 * lifting state out of `TimbalChat`.
 *
 * Mounted automatically by `TimbalStudioShell` — apps using the building
 * blocks directly can wire it themselves via the `Composer` slot.
 */
export const StudioSidebarRuntimePortal: FC<StudioSidebarRuntimePortalProps> = ({
  label = "New chat",
}) => {
  const { iconOnlyLayout } = useStudioSidebarLayout();
  const hasMessages = useThread((s) => s.messages.length > 0);
  const { clear } = useTimbalRuntime();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const startNewChat = useCallback(() => {
    clear();
  }, [clear]);

  useLayoutEffect(() => {
    setAnchor(document.getElementById(DOM_IDS.sidebarRuntimeAnchor));
  }, []);

  if (!anchor || !hasMessages) return null;

  const button = (
    <button
      type="button"
      onClick={startNewChat}
      aria-label={label}
      className={studioSidebarNavItemClasses(iconOnlyLayout, false)}
    >
      <MessageSquarePlus className="size-3.5 shrink-0" />
      {!iconOnlyLayout ? (
        <span className="min-w-0 truncate">{label}</span>
      ) : null}
    </button>
  );

  return createPortal(
    iconOnlyLayout ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    ) : (
      button
    ),
    anchor,
  );
};
