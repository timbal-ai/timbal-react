"use client";

import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";

import { cn } from "../../utils";
import {
  SIDEBAR_INSET_PX_COLLAPSED,
  SIDEBAR_INSET_PX_EXPANDED,
  STORAGE_KEYS,
  studioChromeShellStyle,
} from "../../design/tokens";
import {
  studioPlaygroundGradientClass,
  studioTopbarIconPillClass,
  studioTopbarPillHeightClass,
} from "../../design/classes";
import { studioSidebarWidthTransition } from "../../design/sidebar-motion";
import { Button } from "../../ui/button";
import { TimbalChat, type TimbalChatProps } from "../../chat/chat";
import { Composer } from "../../chat/composer";
import { useWorkforces } from "../../hooks/use-workforces";
import { useSidebarCollapsePhase } from "../../hooks/use-sidebar-collapse-phase";
import { StudioSidebarBackdrop } from "../sidebar/sidebar-backdrop";
import { StudioSidebarContext } from "../sidebar/sidebar-context";
import { StudioSidebarPanel } from "../sidebar/sidebar";
import { StudioSidebarRuntimePortal } from "../sidebar/sidebar-runtime-portal";
import { studioSidebarIconOnlyLayout } from "../sidebar/sidebar-layout";
import { StudioWelcome } from "../sidebar/welcome";
import type { ComposerProps } from "../../chat/composer";
import type { ThreadComponents } from "../../chat/thread";

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
    /* ignore */
  }
}

/**
 * Composer wrapper that also mounts the sidebar runtime portal — needed so
 * the "New chat" button can clear the conversation via the in-thread
 * runtime even when the host overrides the Composer slot.
 */
function makeComposerWithPortal(
  BaseComposer: ThreadComponents["Composer"],
): NonNullable<ThreadComponents["Composer"]> {
  const Resolved = BaseComposer ?? Composer;
  return function StudioComposerWithSidebar(props: ComposerProps) {
    return (
      <>
        <StudioSidebarRuntimePortal />
        <Resolved {...props} />
      </>
    );
  };
}

export interface TimbalStudioShellProps
  extends Omit<TimbalChatProps, "workforceId"> {
  /**
   * Pin the chat to a specific workforce. When omitted, the shell fetches
   * the workforce list via `useWorkforces()` and lets the sidebar drive
   * selection.
   */
  workforceId?: string;
  /**
   * Pre-loaded workforce list. When omitted, the shell fetches it.
   * Useful for stories / SSR / preview environments.
   */
  workforces?: WorkforceItem[];
  /** Custom fetch for the workforce list (mock fetch in preview mode). */
  workforcesFetch?: (url: string, options?: RequestInit) => Promise<Response>;
  /** Base URL for the workforce list. Default: `/api`. */
  workforcesBaseUrl?: string;
  /** Brand mark rendered in the sidebar header. Default: `<TimbalMark />`. */
  brand?: ReactNode;
  /** Logo element rendered in the collapsed sidebar header. Default: uses brand if default, otherwise falls back to the open chevron. */
  logo?: ReactNode;
  /** Extra actions rendered at the right of the floating top bar. */
  headerActions?: ReactNode;
  /** Nodes rendered at the left of the floating top bar (after the menu button). */
  headerStart?: ReactNode;
  /** Initial collapse state when no persisted value exists. Default: false. */
  defaultCollapsed?: boolean;
  /** localStorage key for persisting the collapse state. Default set. */
  persistKey?: string | null;
  /** Pixel breakpoint below which the sidebar becomes a drawer. Default 768. */
  mobileBreakpointPx?: number;
  /** Caption shown in the sidebar footer when no user is signed in. */
  sidebarEmptyCaption?: string | null;
}

/**
 * Opinionated Timbal studio layout — floating sidebar with workforce picker,
 * top bar with optional mode toggle / actions, and a `<TimbalChat />` filling
 * the rest. Manages collapse state, mobile drawer, and workforce selection
 * out of the box. For more control compose `StudioSidebar` + `TimbalChat`
 * directly.
 */
export const TimbalStudioShell: FC<TimbalStudioShellProps> = ({
  workforceId,
  workforces: workforcesProp,
  workforcesFetch,
  workforcesBaseUrl,
  brand,
  logo,
  headerActions,
  headerStart,
  defaultCollapsed = false,
  persistKey = STORAGE_KEYS.sidebarCollapsed,
  mobileBreakpointPx = DEFAULT_BREAKPOINT_PX,
  sidebarEmptyCaption = null,
  welcome,
  components,
  ...chatProps
}) => {
  const reducedMotion = useReducedMotion();
  const shouldFetchWorkforces = !workforceId && workforcesProp === undefined;

  const fetched = useWorkforces({
    enabled: shouldFetchWorkforces,
    fetch: workforcesFetch,
    baseUrl: workforcesBaseUrl,
  });

  const workforces = workforcesProp ?? fetched.workforces;
  const [internalSelected, setInternalSelected] = useState<string>(
    workforceId ?? "",
  );
  useEffect(() => {
    if (workforceId) return;
    if (internalSelected) return;
    const first = workforces[0]?.id ?? workforces[0]?.uid ?? workforces[0]?.name;
    if (first) setInternalSelected(first);
  }, [workforces, workforceId, internalSelected]);

  const activeWorkforceId =
    workforceId ?? internalSelected ?? fetched.selectedId ?? "";

  // ----- sidebar collapse / mobile drawer state -----

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const persisted = readPersistedCollapsed(persistKey);
    return persisted || defaultCollapsed;
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < mobileBreakpointPx;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < mobileBreakpointPx);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileBreakpointPx]);

  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileSidebarOpen]);

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
  const layoutDirection = widthCollapsed ? "collapse" : "expand";
  const layoutTransition = studioSidebarWidthTransition(
    !!reducedMotion,
    layoutDirection,
  );
  const desktopInsetPx = widthCollapsed
    ? SIDEBAR_INSET_PX_COLLAPSED
    : SIDEBAR_INSET_PX_EXPANDED;

  const onCollapsedChange = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      writePersistedCollapsed(persistKey, next);
    },
    [persistKey],
  );

  const handleSelectWorkforce = useCallback(
    (id: string) => {
      if (!workforceId) setInternalSelected(id);
      if (isMobile) setMobileSidebarOpen(false);
    },
    [workforceId, isMobile],
  );

  const sidebarContext = useMemo(
    () => ({
      collapsed: effectiveCollapsed,
      isMobile,
      isCollapsedRail,
      iconOnlyLayout,
      closeMobile: () => setMobileSidebarOpen(false),
    }),
    [effectiveCollapsed, isMobile, isCollapsedRail, iconOnlyLayout],
  );

  // ----- compose chat components -----

  const resolvedComponents: ThreadComponents = useMemo(() => {
    const next: ThreadComponents = { Welcome: StudioWelcome, ...components };
    next.Composer = makeComposerWithPortal(components?.Composer);
    return next;
  }, [components]);

  return (
    <StudioSidebarContext.Provider value={sidebarContext}>
      <div
        className={cn(
          "relative h-dvh overflow-hidden bg-background",
          isMobile && mobileSidebarOpen && "max-md:overflow-hidden",
        )}
        style={studioChromeShellStyle}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-background"
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            studioPlaygroundGradientClass,
          )}
          aria-hidden
        />

        <StudioSidebarBackdrop
          open={isMobile && mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <StudioSidebarPanel
          workforces={workforces}
          selectedId={activeWorkforceId}
          onSelect={handleSelectWorkforce}
          collapsed={effectiveCollapsed}
          onCollapsedChange={onCollapsedChange}
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
          widthCollapsed={widthCollapsed}
          entriesVisible={entriesVisible}
          onEntriesBlurOutComplete={onEntriesBlurOutComplete}
          onPanelWidthComplete={onPanelWidthComplete}
          brand={brand}
          logo={logo}
          emptyCaption={sidebarEmptyCaption}
        />

        <motion.header
          className={cn(
            "absolute top-0 right-0 z-40 flex items-start justify-between gap-2",
            "px-3 pt-[var(--studio-topbar-gap)] md:px-4",
            "left-0",
          )}
          initial={false}
          animate={{ left: isMobile ? 0 : desktopInsetPx }}
          transition={layoutTransition}
        >
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2",
              studioTopbarPillHeightClass,
            )}
          >
            {isMobile && !mobileSidebarOpen ? (
              <Button
                variant="secondary"
                size="icon-sm"
                shape="pill"
                className={studioTopbarIconPillClass}
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={false}
              >
                <Menu className="size-4" />
              </Button>
            ) : null}
            {headerStart}
          </div>

          {headerActions ? (
            <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
          ) : null}
        </motion.header>

        <motion.main
          className={cn(
            "relative z-10 flex h-full min-w-0 flex-col",
            "pt-[var(--studio-inset-top)]",
            "px-3 md:px-0",
          )}
          initial={false}
          animate={{ paddingLeft: isMobile ? 12 : desktopInsetPx }}
          transition={layoutTransition}
        >
          {activeWorkforceId ? (
            <TimbalChat
              {...chatProps}
              workforceId={activeWorkforceId}
              key={activeWorkforceId}
              welcome={welcome}
              components={resolvedComponents}
              className={cn("min-h-0 flex-1", chatProps.className)}
            />
          ) : null}
        </motion.main>
      </div>
    </StudioSidebarContext.Provider>
  );
};
