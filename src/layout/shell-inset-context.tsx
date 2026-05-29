"use client";

import { createContext, useContext } from "react";

/** Reports the current sidebar inset width (px) to an enclosing shell. */
export type ShellInsetReporter = (insetPx: number) => void;

const ShellInsetContext = createContext<ShellInsetReporter | null>(null);

/**
 * Neutral channel that lets a sidebar report its live inset to a sibling shell
 * (e.g. `StudioSidebar` -> `AppShell`). Lives outside `./app` and `./studio` so
 * neither subpath bundle imports the other's internals, and tsup hoists it into
 * a shared chunk so both bundles observe the same context instance.
 */
export const ShellInsetProvider = ShellInsetContext.Provider;

/** Read the inset reporter supplied by an enclosing shell, or `null` if none. */
export function useShellInsetReporter(): ShellInsetReporter | null {
  return useContext(ShellInsetContext);
}
