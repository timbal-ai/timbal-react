"use client";

import { createContext, useContext } from "react";

export interface AppShellNavControls {
  /** Mobile nav drawer open state. */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const AppShellNavContext = createContext<AppShellNavControls | null>(null);

export const AppShellNavProvider = AppShellNavContext.Provider;

/**
 * Read the `AppShell`-owned mobile nav controls. Use to wire `StudioSidebar`'s
 * `mobileOpen` / `onMobileOpenChange` (and any custom trigger) without
 * re-implementing the open-state + resize boilerplate:
 *
 * ```tsx
 * const nav = useAppShellNav();
 * <StudioSidebar mobileOpen={nav.open} onMobileOpenChange={nav.setOpen} … />
 * ```
 *
 * Returns a no-op fallback when used outside `AppShell`, so it's always safe to call.
 */
export function useAppShellNav(): AppShellNavControls {
  return (
    useContext(AppShellNavContext) ?? {
      open: false,
      setOpen: () => {},
      toggle: () => {},
    }
  );
}
