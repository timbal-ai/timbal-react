/**
 * Pill-in-pill segmented control — mirrors `WorkshopPillSegmentedTabs` in
 * timbal-platform (Studio Build/Manage, Home Builder tabs).
 */

import { cn } from "../utils";

const pillSegmentedTrackBase =
  "inline-flex w-fit max-w-max shrink-0 self-start items-center rounded-full";

const pillSegmentedTrackSurface = cn(
  "bg-pill-segmented-track border border-[var(--pill-segmented-track-border)]",
  "shadow-[var(--pill-segmented-track-shadow)]",
);

/** Light/dark track — tokens in `styles.css`. */
export const pillSegmentedTrackClass = cn(
  pillSegmentedTrackBase,
  pillSegmentedTrackSurface,
  "gap-1 p-1",
);

/**
 * Flush track — Studio topbar + dashboard section tabs (`trackVariant="flush"`).
 */
export const pillSegmentedTrackFlushClass = cn(
  pillSegmentedTrackBase,
  pillSegmentedTrackSurface,
  "h-[var(--studio-chrome-pill-height)] items-center gap-0.5 overflow-visible p-0.5",
);

export const pillSegmentedSegmentClass = cn(
  "relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-normal transition-colors",
);

export const pillSegmentedFlushSegmentClass = cn(
  "relative box-border inline-flex h-8 min-h-8 items-center justify-center gap-1.5 rounded-full px-3 py-0",
  "text-sm font-normal leading-tight transition-colors",
);

/** Sliding pill behind the active segment. */
export const pillSegmentedActiveIndicatorClass = cn(
  "absolute inset-0 rounded-full",
  "border border-[var(--pill-segmented-indicator-border)]",
  "bg-gradient-to-b from-[var(--pill-segmented-indicator-from)] to-[var(--pill-segmented-indicator-to)]",
  "shadow-[var(--pill-segmented-indicator-shadow)]",
);
