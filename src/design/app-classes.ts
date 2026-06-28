/**
 * Class composites for the `app` kit (dashboards, settings, data views).
 * Colours via semantic tokens in styles.css — no hardcoded palette literals.
 */

import { cn } from "../utils";
import { controlClass } from "./control-surface";
import {
  studioIntegrationCardClass,
  studioTopbarPillHeightClass,
} from "./classes";

/**
 * App page column — centered within the shell content area (right of the
 * sidebar inset). Wide cap so dashboards use the available width instead of
 * leaving large side gutters; the cap only kicks in on ultra-wide displays.
 */
export const appPageColumnClass = "mx-auto w-full max-w-[100rem] px-4 md:px-6 lg:px-8";

/**
 * Page content width ladder. Every option is a centered column with lateral
 * padding — pick a narrower cap for focused / reading pages instead of always
 * running full-bleed.
 */
export type AppPageWidth =
  | "full"
  | "wide"
  | "default"
  | "centered"
  | "narrow"
  | "prose";

const PAGE_WIDTH_MAXW: Record<AppPageWidth, string> = {
  full: "max-w-none",
  wide: "max-w-[100rem]",
  default: "max-w-7xl",
  centered: "max-w-5xl",
  narrow: "max-w-3xl",
  prose: "max-w-2xl",
};

/**
 * Build the page column class for a given width + density. When `width` is
 * omitted the column falls back to the density default (wide cap on `default`,
 * full-bleed on `compact`), preserving the historical `appPageColumnClass`
 * behavior. Lateral padding always tracks density so pages never run edge-to-edge.
 */
export function appPageColumn(
  width?: AppPageWidth,
  density: "default" | "compact" = "default",
): string {
  const lateral =
    density === "compact" ? "px-3 md:px-4" : "px-4 md:px-6 lg:px-8";
  const maxW = width
    ? PAGE_WIDTH_MAXW[width]
    : density === "compact"
      ? "max-w-none"
      : "max-w-[100rem]";
  return cn("mx-auto w-full", maxW, lateral);
}

/**
 * Topbar horizontal inset — aligned with the page column's max-width and
 * lateral padding so controls line up perfectly with the page content.
 */
export const appShellTopbarInsetClass = "mx-auto w-full max-w-[100rem] px-4 md:px-6 lg:px-8";

/** Top breathing room for `AppShell` — matches timbal-platform list pages (`pt-4 md:pt-6`). */
export const appShellInsetTopClass = "pt-4 md:pt-6";

/**
 * Bottom breathing room for `AppShell` main content — so the last section /
 * card never runs flush against the bottom of the scroll area.
 */
export const appShellInsetBottomClass = "pb-8 md:pb-10";

/** Global topbar row — same height as studio chrome pills. */
export const appShellTopbarRowClass = cn(
  studioTopbarPillHeightClass,
  "flex w-full items-center justify-between gap-2",
);

/** Shell topbar region — scrolls with the main column (not pinned). */
export const appShellTopbarStickyClass = cn(
  "shrink-0 bg-background pb-2",
  appShellInsetTopClass,
);

/** Page header row — title + trailing actions. */
export const appPageHeaderClass = cn(
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  "pb-4 pt-2",
);

/** Section block inside a page. */
export const appSectionClass = "flex flex-col gap-4 py-4";

export const appSectionTitleClass = "text-lg font-semibold text-foreground";

export const appSectionDescriptionClass = "text-sm text-muted-foreground";

/** Card surface — same elevated integration look as in-thread artifacts. */
export const appSurfaceCardClass = cn(
  studioIntegrationCardClass,
  "p-4 md:p-5",
);

/** Metric / stat tile. */
export const appStatTileClass = cn(
  appSurfaceCardClass,
  "flex flex-col gap-1 px-4 py-3 shadow-none",
);

export const appStatValueClass =
  "text-2xl font-normal tracking-tight text-foreground tabular-nums";

export const appStatLabelClass = "text-xs font-normal text-muted-foreground";

/**
 * Filter bar chrome — horizontal controls row.
 * Bottom-aligns children so an unlabeled `SearchInput` lines up with the
 * control in a labeled `Field` + `Select` (labels extend upward).
 */
export const appFilterBarClass = "flex flex-wrap items-end gap-2";

/** Search inputs in filter bars — shared control skin (field shape), so a
 *  search field and a dropdown placed side by side match exactly. */
export const appSearchInputClass = controlClass({}, "inline-flex items-center gap-2");

/** Breadcrumbs. */
export const appBreadcrumbsClass =
  "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground";

export const appBreadcrumbLinkClass =
  "transition-colors hover:text-foreground";

/** Form field stack. */
export const appFieldClass = "flex flex-col gap-1.5";

export const appFieldLabelClass = "text-sm font-medium text-foreground";

export const appFieldHintClass = "text-xs text-muted-foreground";

/** Form inputs / selects / textareas — shared control skin (field shape, full width). */
export const appInputClass = controlClass({}, "w-full");

/** Empty state block. */
export const appEmptyStateClass = cn(
  appSurfaceCardClass,
  "flex flex-col items-center justify-center gap-2 py-12 text-center",
);

export const appEmptyStateTitleClass = "text-base font-medium text-foreground";

export const appEmptyStateDescriptionClass = "max-w-sm text-sm text-muted-foreground";

/** Chart panel shell (content via children or ChartArtifact). */
export const appChartPanelClass = cn(appSurfaceCardClass, "flex flex-col gap-3");

export const appChartPanelTitleClass = "text-sm font-medium text-foreground";
