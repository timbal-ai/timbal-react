"use client";

import { createContext, useContext } from "react";

export interface StudioSidebarContextValue {
  collapsed: boolean;
  isMobile: boolean;
  isCollapsedRail: boolean;
  iconOnlyLayout: boolean;
  /** Close the mobile drawer (no-op on desktop). Used by portal slots. */
  closeMobile?: () => void;
}

export const StudioSidebarContext = createContext<StudioSidebarContextValue>({
  collapsed: false,
  isMobile: false,
  isCollapsedRail: false,
  iconOnlyLayout: false,
});

/** Read the current sidebar layout state. Mostly used by portal slots. */
export function useStudioSidebarLayout() {
  return useContext(StudioSidebarContext);
}

export function useStudioSidebarCollapsed() {
  return useStudioSidebarLayout().collapsed;
}
