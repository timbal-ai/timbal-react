"use client";

import { MenuIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";

import {
  appShellInsetBottomClass,
  appShellInsetTopClass,
  appShellTopbarInsetClass,
  appShellTopbarStickyClass,
} from "../../design/app-classes";
import { studioSidebarWidthTransition } from "../../design/sidebar-motion";
import {
  SIDEBAR_INSET_PX_EXPANDED,
  studioChromeShellStyle,
} from "../../design/tokens";
import {
  ShellInsetProvider,
  type ShellInsetReporter,
} from "../../layout/shell-inset-context";
import { cn } from "../../utils";

import { AppShellNavProvider } from "./app-shell-nav-context";

export interface AppShellProps {
  /** Primary navigation (e.g. StudioSidebar or custom rail). */
  sidebar?: ReactNode;
  /**
   * Global top bar (login, theme, account) — spans the full shell width (not
   * the page `max-w-6xl` column).
   */
  topbar?: ReactNode;
  /** @deprecated Use `topbar`. */
  header?: ReactNode;
  /** Main routed content. */
  children: ReactNode;
  /** Controlled mobile-nav drawer open state. */
  navOpen?: boolean;
  /** Uncontrolled initial mobile-nav open state. Default: `false`. */
  defaultNavOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /**
   * How the mobile hamburger that opens the `sidebar` drawer is provided.
   * - `"auto"` (default): the shell renders a floating hamburger (top-left,
   *   `md:hidden`) whenever there's a `sidebar` but no `topbar` — so a sidebar
   *   dashboard works on mobile with **no topbar and no wiring**.
   * - `"topbar"`: you place `<AppShellSidebarTrigger />` in the `topbar`
   *   yourself; the shell renders no floating hamburger.
   * - `"none"`: the shell renders no hamburger (you provide your own via
   *   `useAppShellNav()`).
   *
   * When a `topbar` is present, `"auto"` behaves like `"topbar"` (the topbar is
   * assumed to host the trigger) to avoid a duplicate control.
   */
  mobileSidebarTrigger?: "auto" | "topbar" | "none";
  className?: string;
  mainClassName?: string;
  /**
   * Make the content region a bounded, non-scrolling flex column instead of the
   * default padded scroll area. Use for full-bleed pages that own their own
   * scroll — a full-page chat (`TimbalChat` / `Thread`), a canvas, a map, an
   * editor — so a `h-full` / `flex-1 min-h-0` child fills exactly and a pinned
   * footer (e.g. the chat composer) stays put instead of riding down on scroll.
   * Do **not** combine with `h-[calc(100dvh-…)]` guesses on the child.
   */
  contentFill?: boolean;
}

// Floating mobile nav hamburger — only shown when the shell owns the trigger
// (sidebar present, no topbar). Sits below the backdrop (z-40) and drawer
// (z-60) so it's covered while the drawer is open, and hidden on `md+` where
// the sidebar is persistent.
const floatingNavTriggerClass = cn(
  "aui-app-shell-nav-trigger-fixed fixed left-4 top-4 z-30 inline-flex size-10 items-center justify-center rounded-xl md:hidden",
  "border border-border/60 bg-card/85 text-foreground shadow-card-elevated backdrop-blur-xl supports-backdrop-filter:bg-card/75",
  "transition-colors hover:bg-card",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

interface AppShellBodyProps {
  sidebar?: ReactNode;
  topbarContent?: ReactNode;
  mainClassName?: string;
  contentFill?: boolean;
  insetPaddingPx: number;
  insetExpanded: boolean;
  children: ReactNode;
}

/**
 * Main column — inset tracks `StudioSidebar` collapse (same motion as studio
 * shell). Only the left edge is offset to clear the sidebar; the page column
 * (`appPageColumnClass`) centers itself within this content canvas.
 */
const AppShellBody: FC<AppShellBodyProps> = ({
  sidebar,
  topbarContent,
  mainClassName,
  contentFill = false,
  insetPaddingPx,
  insetExpanded,
  children,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const reducedMotion = useReducedMotion();
  const layoutDirection = insetExpanded ? "expand" : "collapse";
  const layoutTransition = studioSidebarWidthTransition(
    !!reducedMotion,
    layoutDirection,
  );
  const insetPadding = sidebar && !isMobile ? insetPaddingPx : 0;

  return (
    <motion.div
      className="aui-app-shell-body relative z-10 flex min-h-0 min-w-0 flex-1 flex-col"
      initial={false}
      animate={{ paddingLeft: insetPadding }}
      transition={layoutTransition}
    >
      <div
        className={cn(
          "aui-app-shell-scroll flex min-h-0 flex-1 flex-col",
          // Padded scroll region by default; a full-bleed page (chat / canvas) owns
          // its own scroll, so clip here and let the bounded `main` fill exactly.
          contentFill ? "overflow-hidden" : "overflow-y-auto",
          !topbarContent && appShellInsetTopClass,
        )}
      >
        {topbarContent ? (
          <header className={cn("aui-app-shell-topbar-region", appShellTopbarStickyClass)}>
            <div className={appShellTopbarInsetClass}>{topbarContent}</div>
          </header>
        ) : null}
        <main
          className={cn(
            // Bounded flex column by default so `h-full` / `flex-1 min-h-0` children
            // (full-page chat, canvas) resolve a height without `mainClassName` surgery.
            "aui-app-shell-main flex min-h-0 min-w-0 flex-1 flex-col",
            // Bottom breathing room for scrolling content; full-bleed pages skip it.
            !contentFill && appShellInsetBottomClass,
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
    </motion.div>
  );
};

/**
 * App-first layout: sidebar + topbar + main. Layout-only — the floating
 * assistant is a self-contained `<AppCopilot>` you drop anywhere (it portals
 * its own overlay), not a prop on the shell.
 */
export const AppShell: FC<AppShellProps> = ({
  sidebar,
  topbar,
  header,
  children,
  navOpen: navOpenProp,
  defaultNavOpen = false,
  onNavOpenChange,
  mobileSidebarTrigger = "auto",
  className,
  mainClassName,
  contentFill = false,
}) => {
  const topbarContent = topbar ?? header;
  // A floating hamburger is only needed when the shell itself must surface the
  // mobile nav control — i.e. there's a sidebar, no topbar to host a trigger,
  // and the caller hasn't opted out. `md:hidden` keeps it phone-only.
  const showFloatingNavTrigger =
    Boolean(sidebar) &&
    mobileSidebarTrigger !== "none" &&
    !(mobileSidebarTrigger === "topbar") &&
    !topbarContent;

  const [uncontrolledNavOpen, setUncontrolledNavOpen] = useState(defaultNavOpen);
  const isNavControlled = navOpenProp !== undefined;
  const navOpen = isNavControlled ? navOpenProp : uncontrolledNavOpen;
  const setNavOpen = useCallback(
    (open: boolean) => {
      if (!isNavControlled) setUncontrolledNavOpen(open);
      onNavOpenChange?.(open);
    },
    [isNavControlled, onNavOpenChange],
  );
  const toggleNav = useCallback(() => setNavOpen(!navOpen), [navOpen, setNavOpen]);
  const navControls = useMemo(
    () => ({ open: navOpen, setOpen: setNavOpen, toggle: toggleNav }),
    [navOpen, setNavOpen, toggleNav],
  );

  const [insetPaddingPx, setInsetPaddingPx] = useState(
    sidebar ? SIDEBAR_INSET_PX_EXPANDED : 0,
  );
  const reportShellInset = useCallback<ShellInsetReporter>((insetPx) => {
    setInsetPaddingPx(insetPx);
  }, []);
  const insetExpanded = insetPaddingPx >= SIDEBAR_INSET_PX_EXPANDED;

  const shellBody = (
    <AppShellBody
      sidebar={sidebar}
      topbarContent={topbarContent}
      mainClassName={mainClassName}
      contentFill={contentFill}
      insetPaddingPx={insetPaddingPx}
      insetExpanded={insetExpanded}
    >
      {children}
    </AppShellBody>
  );

  const tree = (
    <ShellInsetProvider value={sidebar ? reportShellInset : null}>
      <div
        className={cn(
          "aui-app-shell relative flex h-dvh overflow-hidden bg-background",
          className,
        )}
        style={studioChromeShellStyle}
      >
        {sidebar}
        {showFloatingNavTrigger && !navOpen ? (
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={false}
            onClick={() => setNavOpen(true)}
            className={floatingNavTriggerClass}
          >
            <MenuIcon className="size-5" aria-hidden />
          </button>
        ) : null}
        {sidebar && navOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden"
          />
        ) : null}
        {shellBody}
      </div>
    </ShellInsetProvider>
  );

  return <AppShellNavProvider value={navControls}>{tree}</AppShellNavProvider>;
};
