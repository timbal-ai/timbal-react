"use client";

import { createContext, useContext, type FC, type ReactNode } from "react";

// =============================================================================
// Copilot subsystem context — a single home for the floating assistant.
//
// Two orthogonal contexts live here:
//   1. Controls   — open / expand state, shared with custom triggers.
//   2. Page data  — `AppCopilotProvider` page context read by agent tooling.
//
// `AppShell` no longer owns any of this; `AppCopilot` self-mounts and provides
// the controls to its own subtree (and reads an optional app-level provider).
// =============================================================================

/**
 * Where the floating trigger pill sits — its center, as fractions (0–1) of the
 * viewport width/height so the position survives window resizes. `null` means
 * the default bottom-right corner.
 */
export interface CopilotTriggerPosition {
  x: number;
  y: number;
}

/** Open / expand controls for the floating copilot. */
export interface CopilotControls {
  /** Whether the floating panel is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Whether the open/close affordances are shown. */
  collapsible: boolean;
  /** Whether the panel is in its full-bleed expanded layout. */
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  /**
   * User-dragged trigger pill position, or `null` for the default corner.
   * Persisted to `localStorage` so it survives reloads. Optional so custom
   * `CopilotControls` implementations predating drag support keep compiling —
   * the built-in trigger simply isn't draggable without it.
   */
  triggerPosition?: CopilotTriggerPosition | null;
  setTriggerPosition?: (position: CopilotTriggerPosition | null) => void;
  /** Move the trigger pill back to its default corner and clear persistence. */
  resetTriggerPosition?: () => void;
}

const CopilotControlsContext = createContext<CopilotControls | null>(null);

/**
 * Optional app-level provider. Wrap your app with `<CopilotProvider>` when you
 * want custom triggers anywhere in the tree to drive the same `<AppCopilot>`
 * via `useCopilot()`. Omit it for the common drop-in case — `<AppCopilot>`
 * supplies its own controls to its portal subtree.
 */
export const CopilotControlsProvider = CopilotControlsContext.Provider;

/** Read the copilot controls, or `null` when no copilot is mounted/provided. */
export function useCopilot(): CopilotControls | null {
  return useContext(CopilotControlsContext);
}

// ── Page context (data for agent tooling) ────────────────────────────────────

export type AppCopilotContextValue = Record<string, unknown>;

const AppCopilotPageContext = createContext<AppCopilotContextValue | null>(null);

export interface AppCopilotProviderProps {
  value: AppCopilotContextValue;
  children: ReactNode;
}

/** Supplies page/dashboard context for `AppCopilot` and agent tools. */
export const AppCopilotProvider: FC<AppCopilotProviderProps> = ({
  value,
  children,
}) => (
  <AppCopilotPageContext.Provider value={value}>
    {children}
  </AppCopilotPageContext.Provider>
);

export function useAppCopilotContext(): AppCopilotContextValue {
  return useContext(AppCopilotPageContext) ?? {};
}

// ── Deprecated aliases (removed next major) ──────────────────────────────────

/** @deprecated Renamed to {@link CopilotControls}. */
export type AppShellChatControls = CopilotControls;

/** @deprecated Use {@link useCopilot}. */
export const useAppShellChat = useCopilot;

/** @deprecated Use {@link CopilotControlsProvider}. */
export const AppShellChatProvider = CopilotControlsProvider;
