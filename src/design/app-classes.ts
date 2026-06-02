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

/** App page column — centered within the shell content area (right of the sidebar inset). */
export const appPageColumnClass = "mx-auto w-full max-w-6xl px-4 md:px-6";

/**
 * Topbar horizontal inset — full content width (no `max-w-6xl`), same side
 * padding as the page column so controls sit closer to the viewport edges.
 */
export const appShellTopbarInsetClass = "w-full px-4 md:px-6";

/** Top breathing room for `AppShell` — matches timbal-platform list pages (`pt-4 md:pt-6`). */
export const appShellInsetTopClass = "pt-4 md:pt-6";

/** Global topbar row — same height as studio chrome pills. */
export const appShellTopbarRowClass = cn(
  studioTopbarPillHeightClass,
  "flex w-full items-center justify-between gap-2",
);

/** Sticky shell topbar — stays visible while the shell column scrolls. */
export const appShellTopbarStickyClass = cn(
  "sticky top-0 z-20 shrink-0 bg-background pb-2",
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

/** Filter bar chrome — horizontal controls row. */
export const appFilterBarClass = cn(
  "flex flex-wrap items-center gap-2",
  studioTopbarPillHeightClass,
);

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
