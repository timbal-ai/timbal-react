"use client";

import { createContext, useContext } from "react";

export interface StudioSidebarContextValue {
  collapsed: boolean;
  isMobile: boolean;
  isCollapsedRail: boolean;
  iconOnlyLayout: boolean;
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
