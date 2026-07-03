"use client";

import { useLayoutEffect, type FC } from "react";

import {
  SIDEBAR_INSET_PX_COLLAPSED,
  SIDEBAR_INSET_PX_EXPANDED,
  SIDEBAR_INSET_PX_FLUSH_COLLAPSED,
  SIDEBAR_INSET_PX_FLUSH_EXPANDED,
} from "../../design/tokens";
import { useShellInsetReporter } from "../../layout/shell-inset-context";
import { useStudioSidebarLayout } from "./sidebar-context";

export interface StudioSidebarShellInsetBridgeProps {
  /** Public hook for custom shells to track the sidebar inset width (px). */
  onInsetChange?: (insetPx: number) => void;
  /** Flush rail (no floating gap) — the inset is exactly the rail width. */
  flush?: boolean;
}

/**
 * Reports the live sidebar inset so a sibling shell's main column can track
 * collapse width (siblings cannot share React context directly). Pushes to both
 * the neutral `ShellInsetProvider` channel (used by `AppShell`) and the public
 * `onInsetChange` callback. No-ops safely when neither is present.
 */
export const StudioSidebarShellInsetBridge: FC<StudioSidebarShellInsetBridgeProps> = ({
  onInsetChange,
  flush = false,
}) => {
  const reportInset = useShellInsetReporter();
  const { isMobile, isCollapsedRail } = useStudioSidebarLayout();

  useLayoutEffect(() => {
    const insetPx = isMobile
      ? 0
      : isCollapsedRail
        ? flush
          ? SIDEBAR_INSET_PX_FLUSH_COLLAPSED
          : SIDEBAR_INSET_PX_COLLAPSED
        : flush
          ? SIDEBAR_INSET_PX_FLUSH_EXPANDED
          : SIDEBAR_INSET_PX_EXPANDED;
    reportInset?.(insetPx);
    onInsetChange?.(insetPx);
  }, [reportInset, onInsetChange, isMobile, isCollapsedRail, flush]);

  return null;
};
