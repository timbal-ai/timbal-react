"use client";

import {
  ShellNavProvider,
  useOptionalShellNav,
  type ShellNavControls,
} from "../../layout/shell-nav-context";

/** Mobile-nav drawer controls exposed by `AppShell`. */
export type AppShellNavControls = ShellNavControls;

/** Provider for the `AppShell`-owned mobile-nav controls. */
export const AppShellNavProvider = ShellNavProvider;

const NAV_NOOP: AppShellNavControls = {
  open: false,
  setOpen: () => {},
  toggle: () => {},
};

/**
 * Read the `AppShell`-owned mobile nav controls. Use to wire a custom hamburger
 * or a sidebar that doesn't auto-detect the shell.
 *
 * Note: inside `AppShell`, `StudioSidebar` already syncs to these controls
 * automatically (no `mobileOpen` wiring needed), and `AppShell` renders the
 * mobile hamburger itself when there's no topbar — so most apps never call this.
 *
 * @example
 * ```tsx
 * const nav = useAppShellNav();
 * <button onClick={nav.toggle}>Menu</button>
 * ```
 *
 * Returns a no-op fallback when used outside `AppShell`, so it's always safe to call.
 */
export function useAppShellNav(): AppShellNavControls {
  return useOptionalShellNav() ?? NAV_NOOP;
}

/**
 * Like {@link useAppShellNav} but returns `null` when not inside an `AppShell`.
 * Internal — lets a component tell whether a real shell owns the mobile-nav
 * state and defer to it instead of running its own.
 */
export function useOptionalAppShellNav(): AppShellNavControls | null {
  return useOptionalShellNav();
}
