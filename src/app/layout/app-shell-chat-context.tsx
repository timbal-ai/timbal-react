"use client";

import { createContext, useContext } from "react";

export interface AppShellChatControls {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  collapsible: boolean;
}

const AppShellChatContext = createContext<AppShellChatControls | null>(null);

export const AppShellChatProvider = AppShellChatContext.Provider;

export function useAppShellChat(): AppShellChatControls | null {
  return useContext(AppShellChatContext);
}
