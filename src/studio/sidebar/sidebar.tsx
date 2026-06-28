"use client";

import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../utils";
import { studioSidebarPanelClass } from "../../design/classes";
import {
  DOM_IDS,
  SIDEBAR_MOBILE_PX,
  SIDEBAR_WIDTH_COLLAPSED_PX,
  SIDEBAR_WIDTH_PX,
  STORAGE_KEYS,
} from "../../design/tokens";
import { useWorkforces } from "../../hooks/use-workforces";
import { useSidebarCollapsePhase } from "../../hooks/use-sidebar-collapse-phase";
import { StudioSidebarContext } from "./sidebar-context";
import { StudioSidebarEntries } from "./sidebar-entries";
import { StudioSidebarFooter } from "./sidebar-footer";
import { StudioSidebarHeader } from "./sidebar-header";
import {
  studioSidebarDrawerTransition,
  studioSidebarWidthTransition,
} from "../../design/sidebar-motion";
import { StudioSidebarNav } from "./sidebar-nav";
import { TimbalMark } from "./timbal-mark";
import { studioSidebarIconOnlyLayout } from "./sidebar-layout";
import { StudioSidebarShellInsetBridge } from "./shell-inset-bridge-context";

const DEFAULT_BREAKPOINT_PX = 768;

function readPersistedCollapsed(key: string | null): boolean {
  if (!key || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writePersistedCollapsed(key: string | null, collapsed: boolean): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, collapsed ? "1" : "0");
  } catch {
    /* ignore — private mode / quota / disabled storage */
  }
}

export interface StudioSidebarPanelProps {
  workforces: WorkforceItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  /** Collapse phase, e.g. from `useSidebarCollapsePhase`. */
  widthCollapsed: boolean;
  entriesVisible: boolean;
  onEntriesBlurOutComplete: () => void;
  onPanelWidthComplete: () => void;
  brand?: ReactNode;
  logo?: ReactNode;
  emptyCaption?: string | null;
}

/**
 * Fully-controlled sidebar panel. Use this when you're orchestrating
 * collapse state from a parent shell (e.g. `TimbalStudioShell`). For
 * most apps prefer the simpler `StudioSidebar` wrapper below.
 */
export const StudioSidebarPanel: FC<StudioSidebarPanelProps> = ({
  workforces,
  selectedId,
  onSelect,
  collapsed,
  onCollapsedChange,
  isMobile,
  mobileOpen,
  onMobileOpenChange,
  widthCollapsed,
  entriesVisible,
  onEntriesBlurOutComplete,
  onPanelWidthComplete,
  brand,
  logo,
  emptyCaption = null,
}) => {
  const reducedMotion = useReducedMotion();

  const isCollapsedRail = widthCollapsed && !isMobile;
  const iconOnlyLayout = studioSidebarIconOnlyLayout(isMobile, isCollapsedRail);
  const isDrawerOpen = isMobile && mobileOpen;
  const widthDirection = widthCollapsed ? "collapse" : "expand";
  const widthTransition = studioSidebarWidthTransition(
    !!reducedMotion,
    widthDirection,
  );

  const handleToggle = () => {
    if (isMobile) {
      onMobileOpenChange(false);
      return;
    }
    onCollapsedChange(!collapsed);
  };

  const panelWidthPx = isMobile
    ? SIDEBAR_MOBILE_PX
    : widthCollapsed
      ? SIDEBAR_WIDTH_COLLAPSED_PX
      : SIDEBAR_WIDTH_PX;

  const isCustomBrand = brand !== undefined;
  const fallbackToChevron = isCustomBrand && !logo;
  const brandNode = brand ?? <TimbalMark size={32} />;
  const logoNode = logo ?? (isCustomBrand ? null : brandNode);

  const panel = (
    <motion.div
      data-sidebar-collapsed={isCollapsedRail ? "" : undefined}
      className={cn(
        "flex h-full flex-col overflow-hidden",
        studioSidebarPanelClass,
        isMobile ? "rounded-none rounded-r-2xl" : "rounded-2xl",
      )}
      initial={false}
      animate={{ width: panelWidthPx }}
      transition={widthTransition}
      style={{ willChange: entriesVisible ? undefined : "width" }}
      onAnimationComplete={
        isMobile || entriesVisible ? undefined : () => onPanelWidthComplete()
      }
    >
      <StudioSidebarHeader
        isCollapsedRail={isCollapsedRail}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        brand={brandNode}
        logo={logoNode}
        fallbackToChevron={fallbackToChevron}
      />

      <StudioSidebarEntries
        visible={entriesVisible}
        onBlurOutComplete={onEntriesBlurOutComplete}
      >
        <div
          id={DOM_IDS.sidebarRuntimeAnchor}
          className={cn(
            "min-h-0 shrink-0 empty:hidden",
            iconOnlyLayout ? "px-1.5 pt-1.5" : "px-2 pt-1.5",
          )}
        />

        <StudioSidebarNav
          workforces={workforces}
          selectedId={selectedId}
          onSelect={onSelect}
          iconOnlyLayout={iconOnlyLayout}
          showTooltips={isCollapsedRail}
        />

        {workforces.length === 0 ? <div className="min-h-0 flex-1" /> : null}

        <StudioSidebarFooter
          iconOnlyLayout={iconOnlyLayout}
          showTooltips={isCollapsedRail}
          onSignOut={isMobile ? () => onMobileOpenChange(false) : undefined}
          emptyCaption={emptyCaption}
        />
      </StudioSidebarEntries>
    </motion.div>
  );

  if (isMobile) {
    return (
      <motion.aside
        className="fixed inset-y-0 left-0 z-[60] flex"
        aria-label="Studio navigation"
        aria-hidden={!mobileOpen}
        initial={false}
        animate={{
          x: isDrawerOpen ? 0 : -(SIDEBAR_MOBILE_PX + 32),
        }}
        transition={studioSidebarDrawerTransition(!!reducedMotion)}
        style={{ pointerEvents: isDrawerOpen ? "auto" : "none" }}
      >
        {panel}
      </motion.aside>
    );
  }

  return (
    <aside
      className="absolute inset-y-0 left-0 z-[60] flex py-[var(--studio-sidebar-gap)] pl-[var(--studio-sidebar-gap)]"
      aria-label="Studio navigation"
    >
      {panel}
    </aside>
  );
};

// ---------------------------------------------------------------------------
// Uncontrolled high-level wrapper
// ---------------------------------------------------------------------------

export interface StudioSidebarProps {
  /**
   * Workforces to display. When omitted, the sidebar fetches them via the
   * shared `useWorkforces()` hook.
   */
  workforces?: WorkforceItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Initial collapse state when no persisted value exists. Default: false. */
  defaultCollapsed?: boolean;
  /**
   * localStorage key for persisting the collapse state. Pass `null` to
   * disable persistence. Default: `"timbal-studio-sidebar-collapsed"`.
   */
  persistKey?: string | null;
  /**
   * Pixel breakpoint below which the sidebar becomes a drawer.
   * Default: 768.
   */
  mobileBreakpointPx?: number;
  /** Brand element rendered in the sidebar header. Default: `<TimbalMark />`. */
  brand?: ReactNode;
  /** Logo element rendered in the collapsed sidebar header. Default: uses brand if default, otherwise falls back to the open chevron. */
  logo?: ReactNode;
  /** Caption shown in the footer when no user is signed in. */
  emptyCaption?: string | null;
  /** External control over the mobile drawer (used by `TimbalStudioShell`). */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  /**
   * Notified with the sidebar inset width (px) whenever collapse state changes.
   * Use to inset a sibling main column. `AppShell` wires this automatically.
   */
  onInsetChange?: (insetPx: number) => void;
}

/**
 * Floating, collapsible workforce sidebar. Manages its own collapse state
 * (persisted to localStorage by default) and mobile drawer behaviour. For
 * a fully composed shell with the chat already wired use
 * `TimbalStudioShell`.
 */
export const StudioSidebar: FC<StudioSidebarProps> = ({
  workforces: workforcesProp,
  selectedId: selectedIdProp,
  onSelect,
  defaultCollapsed = false,
  persistKey = STORAGE_KEYS.sidebarCollapsed,
  mobileBreakpointPx = DEFAULT_BREAKPOINT_PX,
  brand,
  logo,
  emptyCaption,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange: onMobileOpenChangeProp,
  onInsetChange,
}) => {
  const reducedMotion = useReducedMotion();

  const fetched = useWorkforces({ enabled: workforcesProp === undefined });
  const workforces = workforcesProp ?? fetched.workforces;

  const [internalSelected, setInternalSelected] = useState<string>(
    selectedIdProp ?? "",
  );
  useEffect(() => {
    if (selectedIdProp !== undefined) return;
    if (internalSelected) return;
    const first =
      workforces[0]?.id ?? workforces[0]?.uid ?? workforces[0]?.name;
    if (first) setInternalSelected(first);
  }, [workforces, selectedIdProp, internalSelected]);

  const selectedId =
    selectedIdProp ??
    internalSelected ??
    workforces[0]?.id ??
    workforces[0]?.uid ??
    workforces[0]?.name ??
    "";

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const persisted = readPersistedCollapsed(persistKey);
    return persisted || defaultCollapsed;
  });
  const handleCollapsedChange = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      writePersistedCollapsed(persistKey, next);
    },
    [persistKey],
  );

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < mobileBreakpointPx;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < mobileBreakpointPx);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileBreakpointPx]);

  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = mobileOpenProp ?? internalMobileOpen;
  const setMobileOpen = useCallback(
    (next: boolean) => {
      if (mobileOpenProp === undefined) setInternalMobileOpen(next);
      onMobileOpenChangeProp?.(next);
    },
    [mobileOpenProp, onMobileOpenChangeProp],
  );

  // Selecting a workforce closes the mobile drawer — otherwise it stays stuck
  // open over the freshly selected content (bad mobile UX).
  const handleSelect = useCallback(
    (id: string) => {
      if (selectedIdProp === undefined) setInternalSelected(id);
      onSelect?.(id);
      if (isMobile) setMobileOpen(false);
    },
    [selectedIdProp, onSelect, isMobile, setMobileOpen],
  );

  // Returning to a desktop viewport collapses the drawer back into the rail.
  useEffect(() => {
    if (!isMobile && mobileOpen) setMobileOpen(false);
  }, [isMobile, mobileOpen, setMobileOpen]);

  // Escape closes the open mobile drawer.
  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, mobileOpen, setMobileOpen]);

  const effectiveCollapsed = isMobile ? false : collapsed;
  const {
    widthCollapsed,
    entriesVisible: phaseEntriesVisible,
    onEntriesBlurOutComplete,
    onPanelWidthComplete,
  } = useSidebarCollapsePhase(effectiveCollapsed, !!reducedMotion);
  const entriesVisible = isMobile || phaseEntriesVisible;
  const isCollapsedRail = widthCollapsed && !isMobile;
  const iconOnlyLayout = studioSidebarIconOnlyLayout(isMobile, isCollapsedRail);

  const contextValue = useMemo(
    () => ({
      collapsed: effectiveCollapsed,
      isMobile,
      isCollapsedRail,
      iconOnlyLayout,
      closeMobile: () => setMobileOpen(false),
    }),
    [effectiveCollapsed, isMobile, isCollapsedRail, iconOnlyLayout, setMobileOpen],
  );

  return (
    <StudioSidebarContext.Provider value={contextValue}>
      <StudioSidebarShellInsetBridge onInsetChange={onInsetChange} />
      <StudioSidebarPanel
        workforces={workforces}
        selectedId={selectedId}
        onSelect={handleSelect}
        collapsed={effectiveCollapsed}
        onCollapsedChange={handleCollapsedChange}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        widthCollapsed={widthCollapsed}
        entriesVisible={entriesVisible}
        onEntriesBlurOutComplete={onEntriesBlurOutComplete}
        onPanelWidthComplete={onPanelWidthComplete}
        brand={brand}
        logo={logo}
        emptyCaption={emptyCaption}
      />
    </StudioSidebarContext.Provider>
  );
};
