"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState, type FC, type ReactNode } from "react";

import {
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
import { AppShellChatProvider } from "./app-shell-chat-context";

export interface AppShellProps {
  /** Primary navigation (e.g. StudioSidebar or custom rail). */
  sidebar?: ReactNode;
  /**
   * Global top bar (login, theme, account) — spans the full shell width (not
   * the page `max-w-6xl` column). Use `<AppShellTopbar start actions />`.
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
  /** Show floating open/close control. Default: `true`. */
  chatCollapsible?: boolean;
  /** Label on the floating open trigger. Default: `Assistant`. */
  chatTriggerLabel?: string;
  /** Hide the built-in floating trigger (use your own + `useAppShellChat`). */
  hideChatTrigger?: boolean;
  className?: string;
  mainClassName?: string;
}

const floatingTriggerClass = cn(
  "aui-app-shell-chat-trigger-fixed fixed z-50 rounded-full px-5 py-2.5 text-sm font-medium shadow-card-elevated",
  "bg-primary text-primary-foreground transition-colors hover:bg-primary/90",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "bottom-6 right-6 max-sm:bottom-4 max-sm:right-4",
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
  insetPaddingPx,
  insetExpanded,
  children,
}) => {
  const reducedMotion = useReducedMotion();
  const layoutDirection = insetExpanded ? "expand" : "collapse";
  const layoutTransition = studioSidebarWidthTransition(
    !!reducedMotion,
    layoutDirection,
  );
  const insetPadding = sidebar ? insetPaddingPx : 0;

  return (
    <motion.div
      className="aui-app-shell-body relative z-10 flex min-h-0 min-w-0 flex-1 flex-col"
      initial={false}
      animate={{ paddingLeft: insetPadding }}
      transition={layoutTransition}
    >
      <div
        className={cn(
          "aui-app-shell-scroll flex min-h-0 flex-1 flex-col overflow-y-auto",
          !topbarContent && appShellInsetTopClass,
        )}
      >
        {topbarContent ? (
          <header className={cn("aui-app-shell-topbar-region", appShellTopbarStickyClass)}>
            <div className={appShellTopbarInsetClass}>{topbarContent}</div>
          </header>
        ) : null}
        <main className={cn("aui-app-shell-main min-w-0 flex-1", mainClassName)}>
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
  chatCollapsible = true,
  chatTriggerLabel = "Assistant",
  hideChatTrigger = false,
  className,
  mainClassName,
}) => {
  const topbarContent = topbar ?? header;
  const hasChat = Boolean(chat);
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
        {shellBody}
      {hasChat && chatOpen ? (
        <div
          className={floatingPanelClass}
          style={{
            ["--app-shell-chat-width" as string]: chatWidth,
            ...(chatHeight ? { height: chatHeight } : undefined),
          }}
          role="dialog"
          aria-label={typeof chatTriggerLabel === "string" ? chatTriggerLabel : "Assistant"}
        >
          {chat}
        </div>
      ) : null}
      {hasChat && chatCollapsible && !chatOpen && !hideChatTrigger ? (
        <button
          type="button"
          className={floatingTriggerClass}
          onClick={() => setChatOpen(true)}
          aria-expanded={false}
        >
          {chatTriggerLabel}
        </button>
      ) : null}
      </div>
    </ShellInsetProvider>
  );

  if (!hasChat) {
    return tree;
  }

  return (
    <AppShellChatProvider
      value={{
        open: chatOpen,
        setOpen: setChatOpen,
        toggle: toggleChat,
        collapsible: chatCollapsible,
      }}
    >
      {tree}
    </AppShellChatProvider>
  );
};
