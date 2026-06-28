"use client";

import { MenuIcon } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FC, type ReactNode } from "react";

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
import LiquidGlass from "liquid-glass-react";

import { AppShellChatProvider } from "./app-shell-chat-context";
import { AppShellNavProvider } from "./app-shell-nav-context";
import { SiriWave } from "../../../components/ui/siri-wave";

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
  /**
   * Floating copilot panel (e.g. `<AppChatPanel />`). Overlays the dashboard;
   * does not shrink the main column.
   */
  chat?: ReactNode;
  /** Floating panel width. Default: `24rem`. */
  chatWidth?: string;
  /**
   * Floating panel height. Omit to stretch between vertical shell insets
   * (full page height with `top` / `bottom` margins).
   */
  chatHeight?: string;
  /** Controlled open state for the floating panel. */
  chatOpen?: boolean;
  /** Uncontrolled initial open state. Default: `false`. */
  defaultChatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
  /** Controlled expanded state for the floating panel. */
  chatExpanded?: boolean;
  /** Uncontrolled initial expanded state. Default: `false`. */
  defaultChatExpanded?: boolean;
  onChatExpandedChange?: (expanded: boolean) => void;
  /** Show floating open/close control. Default: `true`. */
  chatCollapsible?: boolean;
  /** Label on the floating open trigger. Default: `Assistant`. */
  chatTriggerLabel?: string;
  /** Hide the built-in floating trigger (use your own + `useAppShellChat`). */
  hideChatTrigger?: boolean;
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

// Apple-style "liquid glass" surface: heavy blur + saturation for vibrancy,
// a darker top fading to a more translucent (glassy) bottom, a soft color pool
// rising from the bottom, plus an inset top highlight so the rim reads as glass.
const SIRI_GLASS_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(to bottom, rgba(18,18,22,0.92) 0%, rgba(20,20,26,0.74) 55%, rgba(46,46,58,0.42) 100%), radial-gradient(120% 80% at 50% 120%, rgba(168,85,247,0.20) 0%, rgba(59,130,246,0.12) 45%, transparent 75%)",
  backdropFilter: "blur(44px) saturate(180%)",
  WebkitBackdropFilter: "blur(44px) saturate(180%)",
  boxShadow:
    "0 30px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.08)",
  // Neutralize the light theme tokens inside the panel so child surfaces
  // (thread footer `bg-card`, composer `bg-composer-bg`) read as glass, not white.
  ["--card" as string]: "transparent",
  ["--background" as string]: "transparent",
  ["--composer-bg" as string]: "transparent",
  transformOrigin: "100% 100%",
};

const SIRI_PANEL_BASE = cn(
  "aui-app-shell-chat-float dark fixed z-50 flex flex-col overflow-hidden",
  "bottom-6 right-6 max-sm:bottom-3 max-sm:right-3",
  // width/height/radius transition between collapsed and expanded — CSS handles
  // rem↔calc interpolation on computed lengths (no Framer `auto` breakage).
  "transition-[width,height,border-radius] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
);

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

const floatingPanelClass = cn(
  "aui-app-shell-chat-float fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/60 shadow-card-elevated",
  "bg-card/85 backdrop-blur-xl supports-backdrop-filter:bg-card/75",
  // Mobile: stretch between insets (no fixed width — avoids a wide empty strip on the right)
  "max-sm:inset-x-3 max-sm:top-3 max-sm:bottom-3 max-sm:w-auto",
  "sm:top-6 sm:right-6 sm:bottom-6 sm:w-[var(--app-shell-chat-width)] sm:max-w-[calc(100vw-3rem)]",
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
 * App-first layout: sidebar + topbar + main, with optional **floating** copilot.
 */
export const AppShell: FC<AppShellProps> = ({
  sidebar,
  topbar,
  header,
  children,
  chat,
  chatWidth = "24rem",
  chatHeight,
  chatOpen: chatOpenProp,
  defaultChatOpen = false,
  onChatOpenChange,
  chatExpanded: chatExpandedProp,
  defaultChatExpanded = false,
  onChatExpandedChange,
  chatCollapsible = true,
  chatTriggerLabel = "Assistant",
  hideChatTrigger = false,
  navOpen: navOpenProp,
  defaultNavOpen = false,
  onNavOpenChange,
  mobileSidebarTrigger = "auto",
  className,
  mainClassName,
  contentFill = false,
}) => {
  const topbarContent = topbar ?? header;
  const hasChat = Boolean(chat);
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
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultChatOpen);
  const isChatControlled = chatOpenProp !== undefined;
  const chatOpen = isChatControlled ? chatOpenProp : uncontrolledOpen;

  const setChatOpen = useCallback(
    (open: boolean) => {
      if (!isChatControlled) {
        setUncontrolledOpen(open);
      }
      onChatOpenChange?.(open);
    },
    [isChatControlled, onChatOpenChange],
  );

  const toggleChat = useCallback(() => {
    setChatOpen(!chatOpen);
  }, [chatOpen, setChatOpen]);

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultChatExpanded);
  const isChatExpandedControlled = chatExpandedProp !== undefined;
  const chatExpanded = isChatExpandedControlled ? chatExpandedProp : uncontrolledExpanded;

  const setChatExpanded = useCallback(
    (expanded: boolean) => {
      if (!isChatExpandedControlled) {
        setUncontrolledExpanded(expanded);
      }
      onChatExpandedChange?.(expanded);
    },
    [isChatExpandedControlled, onChatExpandedChange],
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
      <AnimatePresence>
        {hasChat && chatOpen ? (
          <motion.div
            className={cn(
              SIRI_PANEL_BASE,
              chatExpanded
                ? "w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] max-sm:w-[calc(100vw-1.5rem)] max-sm:h-[calc(100vh-1.5rem)] rounded-[32px]"
                : "w-[30rem] h-[40rem] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] max-sm:w-[calc(100vw-1.5rem)] max-sm:h-[calc(100vh-1.5rem)] rounded-[28px]",
            )}
            style={SIRI_GLASS_STYLE}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-label={typeof chatTriggerLabel === "string" ? chatTriggerLabel : "Assistant"}
          >
            {chat}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {hasChat && chatCollapsible && !chatOpen && !hideChatTrigger ? (
        <LiquidGlass
          onClick={() => setChatOpen(true)}
          cornerRadius={999}
          padding="6px 20px 6px 6px"
          blurAmount={0.08}
          displacementScale={64}
          saturation={140}
          aberrationIntensity={2}
          elasticity={0.3}
          className="aui-app-shell-chat-trigger-fixed z-50 cursor-pointer"
          style={{
            position: "fixed",
            // The library centers on its top/left anchor (translate -50%,-50%),
            // so anchor at the pill's center near the bottom-right corner.
            top: "calc(100dvh - 1.5rem - 26px)",
            left: "calc(100dvw - 1.5rem - 78px)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-black">
            <SiriWave
              variant="wave"
              size={40}
              renderScale={1.5}
              className="rounded-full shrink-0 bg-transparent"
              style={{ width: 40, height: 40, background: "transparent" }}
            />
            <span>{chatTriggerLabel}</span>
          </div>
        </LiquidGlass>
      ) : null}
      </div>
    </ShellInsetProvider>
  );

  const withNav = (
    <AppShellNavProvider value={navControls}>{tree}</AppShellNavProvider>
  );

  if (!hasChat) {
    return withNav;
  }

  return (
    <AppShellChatProvider
      value={{
        open: chatOpen,
        setOpen: setChatOpen,
        toggle: toggleChat,
        collapsible: chatCollapsible,
        expanded: chatExpanded,
        setExpanded: setChatExpanded,
      }}
    >
      {withNav}
    </AppShellChatProvider>
  );
};
