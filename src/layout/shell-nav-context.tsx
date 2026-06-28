"use client";

import { createContext, useContext } from "react";

/** Mobile-nav drawer controls owned by an enclosing shell (e.g. `AppShell`). */
export interface ShellNavControls {
  /** Mobile nav drawer open state. */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const ShellNavContext = createContext<ShellNavControls | null>(null);

/**
 * Neutral channel that lets a sidebar share mobile-nav open state with a sibling
 * shell (e.g. `StudioSidebar` <-> `AppShell`). Lives outside `./app` and
 * `./studio` so neither subpath bundle imports the other's internals, and tsup
 * hoists it into a shared chunk so both bundles observe the same context
 * instance.
 */
export const ShellNavProvider = ShellNavContext.Provider;

/** Read the shell-owned mobile-nav controls, or `null` when not inside a shell. */
export function useOptionalShellNav(): ShellNavControls | null {
  return useContext(ShellNavContext);
}
