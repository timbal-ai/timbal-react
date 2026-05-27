/**
 * Single source of truth for studio chrome sizing.
 *
 * All layout numbers (sidebar width, gaps, topbar height, pill height) are
 * declared once in pixels here. Every other shape — the rem strings used in
 * Tailwind class names, the CSS variable bag spread on the shell root, and
 * the numeric values consumed by Framer Motion `animate` props — is derived
 * from these constants. Bumping any size is a one-line change.
 *
 * Colour tokens still live in `styles.css` (the canonical home for
 * shadcn-style `:root` / `.dark` palettes). This module only owns sizing.
 */

import type { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Pixel source of truth
// ---------------------------------------------------------------------------

export const SIDEBAR_WIDTH_PX = 224;
export const SIDEBAR_WIDTH_COLLAPSED_PX = 52;
export const SIDEBAR_MOBILE_PX = 272;
export const SIDEBAR_GAP_PX = 12;
export const SIDEBAR_CONTENT_GAP_PX = 8;

export const TOPBAR_GAP_PX = 8;
export const TOPBAR_HEIGHT_PX = 48;
export const PILL_HEIGHT_PX = 40;

// Derived insets — distance from the viewport's left edge to the chat column.
export const SIDEBAR_INSET_PX_EXPANDED =
  SIDEBAR_GAP_PX + SIDEBAR_WIDTH_PX + SIDEBAR_CONTENT_GAP_PX;
export const SIDEBAR_INSET_PX_COLLAPSED =
  SIDEBAR_GAP_PX + SIDEBAR_WIDTH_COLLAPSED_PX + SIDEBAR_CONTENT_GAP_PX;

// ---------------------------------------------------------------------------
// Derived rem strings (used by inline CSS-var bag below + Tailwind arbitrary
// values via `var(--studio-*)`)
// ---------------------------------------------------------------------------

const px = (n: number) => `${n / 16}rem`;

export const SIDEBAR_WIDTH = px(SIDEBAR_WIDTH_PX);
export const SIDEBAR_WIDTH_COLLAPSED = px(SIDEBAR_WIDTH_COLLAPSED_PX);
export const SIDEBAR_GAP = px(SIDEBAR_GAP_PX);
export const SIDEBAR_CONTENT_GAP = px(SIDEBAR_CONTENT_GAP_PX);
export const TOPBAR_GAP = px(TOPBAR_GAP_PX);
export const TOPBAR_HEIGHT = px(TOPBAR_HEIGHT_PX);
export const PILL_HEIGHT = px(PILL_HEIGHT_PX);
export const SIDEBAR_INSET_EXPANDED = px(SIDEBAR_INSET_PX_EXPANDED);
export const SIDEBAR_INSET_COLLAPSED = px(SIDEBAR_INSET_PX_COLLAPSED);

// ---------------------------------------------------------------------------
// CSS variable bag — spread on the shell root so helper classes that read
// `var(--studio-sidebar-width)` etc. resolve regardless of whether the
// consumer imported `styles.css` (which also declares the same defaults).
// ---------------------------------------------------------------------------

export const studioChromeShellStyle: CSSProperties = {
  "--studio-topbar-gap": TOPBAR_GAP,
  "--studio-topbar-height": TOPBAR_HEIGHT,
  "--studio-chrome-pill-height": PILL_HEIGHT,
  "--studio-inset-top": `calc(${TOPBAR_GAP} + ${TOPBAR_HEIGHT})`,
  "--studio-sidebar-gap": SIDEBAR_GAP,
  "--studio-sidebar-width": SIDEBAR_WIDTH,
  "--studio-sidebar-width-collapsed": SIDEBAR_WIDTH_COLLAPSED,
  "--studio-sidebar-content-gap": SIDEBAR_CONTENT_GAP,
  "--studio-inset-left": SIDEBAR_INSET_EXPANDED,
  "--studio-inset-left-collapsed": SIDEBAR_INSET_COLLAPSED,
} as CSSProperties;

export function studioChromeInsetLeft(collapsed: boolean, isMobile = false) {
  if (isMobile) return "0px";
  return collapsed ? SIDEBAR_INSET_COLLAPSED : SIDEBAR_INSET_EXPANDED;
}

export function studioChromeSidebarWidth(collapsed: boolean) {
  return collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;
}

// ---------------------------------------------------------------------------
// DOM ids + storage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  sidebarCollapsed: "timbal-studio-sidebar-collapsed",
} as const;

export const DOM_IDS = {
  sidebarRuntimeAnchor: "timbal-studio-sidebar-runtime-anchor",
  topbarBrandAnchor: "timbal-studio-topbar-brand-anchor",
} as const;
