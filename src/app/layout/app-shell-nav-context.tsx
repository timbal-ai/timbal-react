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
 * Read the `AppShell`-owned mobile nav controls — only to wire a **custom**
 * hamburger/trigger that is itself rendered **inside** `AppShell`.
 *
 * Most apps never need this: inside `AppShell`, `StudioSidebar` already syncs to
 * these controls automatically (no `mobileOpen` wiring), and `AppShell` renders
 * the mobile hamburger itself when there's no topbar.
 *
 * ⚠️ **Footgun:** this reads React context, so when called **outside** an
 * `AppShell` it returns a silent no-op (`open` permanently `false`). Calling it
 * in the component that *renders* `<AppShell>` and then passing
 * `mobileOpen={nav.open}` / `onMobileOpenChange={nav.setOpen}` into
 * `StudioSidebar` forces the drawer into controlled mode pinned shut — the
 * backdrop toggles but the drawer never slides in. Don't wire the sidebar's
 * `mobileOpen` from here; let `StudioSidebar` (as `AppShell`'s `sidebar`)
 * auto-sync instead.
 *
 * @example
 * ```tsx
 * // A custom trigger, rendered INSIDE AppShell (e.g. in a topbar slot):
 * function MenuButton() {
 *   const nav = useAppShellNav();
 *   return <button onClick={nav.toggle}>Menu</button>;
 * }
 * ```
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
