/**
 * Shared chrome class composites for Timbal chat surfaces.
 *
 * Every entry is a pure Tailwind class string composed via `cn(...)` so it
 * can be merged with caller overrides at zero runtime cost. All colours
 * resolve through semantic CSS variables declared in `styles.css` — there
 * are NO hardcoded palette literals or `dark:` Tailwind variants here.
 *
 * Layout sizes (sidebar widths, gaps, pill height …) live in
 * [./tokens.ts](./tokens.ts) — this module owns only class strings.
 */

import { cn } from "../utils";
import {
  TIMBAL_V2_PILL_SURFACE,
  TIMBAL_V2_SECONDARY_CHROME,
} from "./button-tokens";

// ---------------------------------------------------------------------------
// Topbar pills
// ---------------------------------------------------------------------------

export const studioTopbarPillHeightClass =
  "h-[var(--studio-chrome-pill-height)] min-h-[var(--studio-chrome-pill-height)]";

export const studioTopbarIconPillClass =
  "shrink-0 flex-none size-[var(--studio-chrome-pill-height)] min-h-[var(--studio-chrome-pill-height)] min-w-[var(--studio-chrome-pill-height)]";

/** Soft playground gradient behind the message column. */
export const studioPlaygroundGradientClass =
  "bg-gradient-to-b from-playground-from via-playground-via to-playground-to";

// ---------------------------------------------------------------------------
// Composer + cards
// ---------------------------------------------------------------------------

/** Composer outer shell — rounded surface with focus-within affordances. */
export const studioComposeInputShellClass = cn(
  "flex w-full flex-col rounded-2xl bg-composer-bg shadow-card-elevated outline-none",
  "border border-composer-border",
  "transition-[box-shadow,border-color]",
  "focus-within:border-composer-border-focus focus-within:ring-2 focus-within:ring-foreground/5",
);

/** Resting pill surface — sidebars, badges. */
export const studioPillSurfaceClass = TIMBAL_V2_PILL_SURFACE;

/** Interactive secondary chrome — select triggers, search shells. */
export const studioSecondaryChromeClass = TIMBAL_V2_SECONDARY_CHROME;

/**
 * Solid integration-card surface — used for in-thread tool / artifact cards
 * so they read on the playground gradient.
 */
export const studioIntegrationSurfaceSolid =
  "bg-gradient-to-b from-elevated-from to-elevated-to shadow-card";

export const studioIntegrationBorder = "border border-border";

export const studioIntegrationCardClass = cn(
  "rounded-xl",
  studioIntegrationSurfaceSolid,
  studioIntegrationBorder,
);

export const studioIntegrationIconTileClass = cn(
  "flex size-9 shrink-0 items-center justify-center rounded-lg",
  studioIntegrationSurfaceSolid,
  studioIntegrationBorder,
);

/**
 * Full-width selectable row — used by `Suggestions` and any settings-style
 * list cards. Mirrors `roleListRowSurfaceClass` in timbal-platform.
 */
export const studioListRowButtonClass = cn(
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left",
  studioIntegrationCardClass,
  "transition-[background-color,box-shadow,border-color] duration-200 ease-in-out",
  "hover:border-foreground/20",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/** Compose tool drawer / trace payload well — opaque so JSON reads on the gradient. */
export const studioComposerIoWellClass = cn(
  "rounded-lg",
  studioIntegrationSurfaceSolid,
  studioIntegrationBorder,
);

/** Collapsible tool-call card shell. */
export const studioToolCardShellClass = cn(
  studioIntegrationCardClass,
  "my-2 min-h-0 overflow-hidden",
);

// ---------------------------------------------------------------------------
// Sidebar chrome (StudioSidebar / TimbalStudioShell)
// ---------------------------------------------------------------------------

/** Floating sidebar shell — fully opaque (no glass / alpha gradients). */
export const studioSidebarPanelClass = cn(
  "bg-sidebar text-sidebar-foreground",
  "border border-sidebar-border",
  "shadow-card-elevated",
);

/** Sidebar nav rows — agents, new chat, sign out (shared chrome). */
export const studioSidebarNavItemClass = cn(
  "flex items-center rounded-lg text-sm",
  "transition-[color,background-color,box-shadow,border-color] duration-200 ease-in-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2",
);

export function studioSidebarNavItemLayout(iconOnly: boolean) {
  return iconOnly
    ? "box-border size-8 min-h-8 min-w-8 shrink-0 justify-center rounded-lg p-0 focus-visible:ring-offset-0"
    : "w-full gap-2 px-2.5 py-2";
}

/** Opaque Timbal v2 secondary — same border/shadow as chrome buttons. */
export const studioSidebarNavItemSurfaceClass = cn(
  "bg-gradient-to-b from-elevated-from to-elevated-to text-foreground",
  "border border-border",
  "shadow-card",
);

export const studioSidebarNavItemIdleClass = cn(
  "border border-transparent text-muted-foreground shadow-none",
  "hover:text-foreground",
  "hover:bg-gradient-to-b hover:from-elevated-from hover:to-elevated-to",
  "hover:border-border hover:shadow-card",
);

export const studioSidebarCollapsedRailItemClass = cn(
  "border border-border shadow-card bg-sidebar-accent",
);

export const studioSidebarCollapsedRailItemIdleClass = cn(
  studioSidebarCollapsedRailItemClass,
  "text-muted-foreground hover:text-foreground",
);

export const studioSidebarCollapsedRailItemActiveClass = cn(
  studioSidebarCollapsedRailItemClass,
  studioSidebarNavItemSurfaceClass,
  "text-foreground",
);

/** Selected agent — same opaque secondary button surface as sign-out hover. */
export const studioSidebarNavItemActiveClass = studioSidebarNavItemSurfaceClass;

// ---------------------------------------------------------------------------
// Tool timeline rows (Used / Failed / Thought / Using …)
// ---------------------------------------------------------------------------

export const studioTimelineRowButtonClass =
  "group flex w-full min-w-0 cursor-pointer items-center justify-start rounded-md border-0 bg-transparent py-1 text-left shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2";

export const studioTimelineTextClass = "text-xs font-normal leading-snug";

export const studioTimelineActionClass = cn(
  studioTimelineTextClass,
  "shrink-0 text-foreground/70 transition-colors duration-150 group-hover:text-foreground/80",
);

/** Shimmer action word — text-transparent inherits its colour from the bg clip. */
export const studioTimelineShimmerActionClass = cn(
  studioTimelineTextClass,
  "shrink-0",
);

export const studioTimelineDetailClass = cn(
  studioTimelineTextClass,
  "min-w-0 truncate text-muted-foreground transition-colors duration-150",
);

export function studioTimelineChevronClass(expanded: boolean) {
  return cn(
    "ml-0.5 size-3 min-h-3 min-w-3 shrink-0 transition-all duration-150",
    expanded
      ? "rotate-90 text-foreground opacity-60"
      : "text-muted-foreground opacity-0 group-hover:opacity-70",
  );
}

/** Padding for the expanded payload under a timeline toggle. */
export const studioTimelineBodyPadClass = "flex flex-col gap-2 pt-0.5 pb-0.5";

// ---------------------------------------------------------------------------
// Artifacts (question option rows, in-thread shells)
// ---------------------------------------------------------------------------

export const studioArtifactShellClass = cn(
  studioIntegrationCardClass,
  "my-2 w-full min-w-0 overflow-hidden",
);

export const studioQuestionOptionClass =
  "flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition-[background-color,border-color,box-shadow] duration-200 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2";

export const studioQuestionOptionSelectedClass = cn(
  studioQuestionOptionClass,
  "border-border bg-accent ring-1 ring-foreground/10",
);
