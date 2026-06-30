"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { CopilotPanel, type CopilotPanelProps } from "./copilot-panel";
import { CopilotOverlay } from "./copilot-overlay";
import {
  AppCopilotProvider,
  CopilotControlsProvider,
  useCopilot,
  type AppCopilotContextValue,
  type CopilotControls,
} from "./context";

export interface AppCopilotProps extends CopilotPanelProps {
  // ── Open state ──
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. Default: `false`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // ── Expanded (full-bleed) state ──
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state. Defaults to expanded on small screens. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  // ── Trigger ──
  /** Show the built-in open/close affordances. Default: `true`. */
  collapsible?: boolean;
  /** Label on the floating open trigger + panel `aria-label`. Default: `Assistant`. */
  triggerLabel?: string;
  /** Hide the built-in floating trigger (drive open state via props or `useCopilot`). */
  hideTrigger?: boolean;
  /** Page context for agent tooling — read by descendants via `useAppCopilotContext`. */
  context?: AppCopilotContextValue;
}

interface CopilotStateOptions {
  open?: boolean;
  defaultOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapsible: boolean;
}

/** Self-contained open/expand state machine (controlled or uncontrolled). */
function useCopilotControlsState({
  open: openProp,
  defaultOpen,
  onOpenChange,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  collapsible,
}: CopilotStateOptions): CopilotControls {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpenControlled = openProp !== undefined;
  const open = isOpenControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  // On phones the floating card has no room to breathe, so default to the
  // full-bleed expanded layout unless the caller explicitly opted out.
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(() => {
    if (defaultExpanded) return true;
    if (typeof window !== "undefined") return window.innerWidth < 640;
    return false;
  });
  const isExpandedControlled = expandedProp !== undefined;
  const expanded = isExpandedControlled ? expandedProp : uncontrolledExpanded;

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isExpandedControlled) setUncontrolledExpanded(next);
      onExpandedChange?.(next);
    },
    [isExpandedControlled, onExpandedChange],
  );

  return useMemo(
    () => ({ open, setOpen, toggle, collapsible, expanded, setExpanded }),
    [open, setOpen, toggle, collapsible, expanded, setExpanded],
  );
}

/**
 * Self-contained floating copilot. Drop it anywhere — it portals a fixed glass
 * panel + SiriWave trigger to `document.body`, owns its own open/expand state,
 * and mounts the conversation runtime. No `AppShell` wiring required.
 *
 * ```tsx
 * <AppCopilot workforceId="ops" />
 * ```
 *
 * Custom trigger via controlled state:
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <button onClick={() => setOpen(true)}>Ask</button>
 * <AppCopilot workforceId="ops" open={open} onOpenChange={setOpen} hideTrigger />
 * ```
 *
 * Shared state across many triggers: wrap the app in `<CopilotProvider>` and
 * read `useCopilot()` from any trigger.
 */
export const AppCopilot: FC<AppCopilotProps> = ({
  open,
  defaultOpen = false,
  onOpenChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  collapsible = true,
  triggerLabel = "Assistant",
  hideTrigger = false,
  context,
  ...panelProps
}) => {
  // Prefer app-level CopilotProvider controls unless this instance owns open state.
  const parentControls = useCopilot();
  const internal = useCopilotControlsState({
    open,
    defaultOpen,
    onOpenChange,
    expanded,
    defaultExpanded,
    onExpandedChange,
    collapsible,
  });
  const ownsOpenState = open !== undefined || onOpenChange !== undefined;
  const controls = parentControls && !ownsOpenState ? parentControls : internal;

  // Portal target only exists in the browser — wait for mount to avoid SSR mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;

  // Always provide controls inside the portal subtree — portaled nodes must not
  // rely on context from outside AppCopilot when the parent tree omits a provider.
  let tree = (
    <CopilotControlsProvider value={controls}>
      <CopilotOverlay
        controls={controls}
        triggerLabel={triggerLabel}
        hideTrigger={hideTrigger}
      >
        <CopilotPanel {...panelProps} />
      </CopilotOverlay>
    </CopilotControlsProvider>
  );

  // Page context for agent tooling, when supplied inline.
  if (context) {
    tree = <AppCopilotProvider value={context}>{tree}</AppCopilotProvider>;
  }

  return createPortal(tree, document.body);
};

export interface CopilotProviderProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapsible?: boolean;
  children: ReactNode;
}

/**
 * App-level copilot state. Wrap your app with this when you want **custom
 * triggers anywhere** in the tree to open the same `<AppCopilot>` via
 * `useCopilot()`. Most apps don't need it — `<AppCopilot>` owns its own state.
 *
 * ```tsx
 * <CopilotProvider>
 *   <Topbar /> // a button that calls useCopilot()?.setOpen(true)
 *   <AppCopilot workforceId="ops" hideTrigger />
 * </CopilotProvider>
 * ```
 */
export const CopilotProvider: FC<CopilotProviderProps> = ({
  open,
  defaultOpen = false,
  onOpenChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  collapsible = true,
  children,
}) => {
  const controls = useCopilotControlsState({
    open,
    defaultOpen,
    onOpenChange,
    expanded,
    defaultExpanded,
    onExpandedChange,
    collapsible,
  });
  return (
    <CopilotControlsProvider value={controls}>{children}</CopilotControlsProvider>
  );
};
