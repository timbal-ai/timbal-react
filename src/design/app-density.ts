/**
 * App kit layout density — shared spacing scale for dashboards.
 * Default matches timbal-platform list pages; compact tightens rhythm for data-heavy views.
 */

import { cn } from "../utils";
import {
  appEmptyStateClass,
  appPageColumnClass,
  appPageHeaderClass,
  appSectionClass,
  appStatTileClass,
  appSurfaceCardClass,
} from "./app-classes";
import { studioIntegrationCardClass } from "./classes";

export type AppDensity = "default" | "compact";

/** Default chart plot height per density (overridable via component `height` prop). */
export const APP_DENSITY_CHART_HEIGHT: Record<AppDensity, number> = {
  default: 300,
  compact: 220,
};

const compactSurfaceCardClass = cn(studioIntegrationCardClass, "p-3");

const compactStatTileClass = cn(
  compactSurfaceCardClass,
  "flex flex-col gap-1 px-3 py-2 shadow-none",
);

const compactEmptyStateClass = cn(
  compactSurfaceCardClass,
  "flex flex-col items-center justify-center gap-2 py-8 text-center",
);

/** Layout class maps keyed by density — consumed via `useAppDensityClass` in app components. */
export const APP_DENSITY_CLASSES = {
  pageColumn: {
    default: appPageColumnClass,
    compact: "mx-auto w-full max-w-none px-3 md:px-4",
  },
  pageHeader: {
    default: appPageHeaderClass,
    compact: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2 pt-1",
  },
  /**
   * Vertical rhythm between a `Page`'s direct content blocks. Page-level gap so
   * stacked blocks (FilterBar + DataTable, MetricRow + ChartPanel, bare cards)
   * never render flush — the #1 source of gap-less generated layouts.
   */
  pageStack: {
    default: "flex flex-col gap-6",
    compact: "flex flex-col gap-4",
  },
  section: {
    default: appSectionClass,
    compact: "flex flex-col gap-2 py-2",
  },
  surfaceCard: {
    default: appSurfaceCardClass,
    compact: compactSurfaceCardClass,
  },
  statTile: {
    default: appStatTileClass,
    compact: compactStatTileClass,
  },
  emptyState: {
    default: appEmptyStateClass,
    compact: compactEmptyStateClass,
  },
  metricCardHeader: {
    default: "flex items-start justify-between gap-3 px-4 pb-1 pt-3",
    compact: "flex items-start justify-between gap-2 px-3 pb-0.5 pt-2",
  },
  metricTile: {
    default: "relative flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 text-left font-normal",
    compact: "relative flex min-w-0 flex-1 flex-col gap-1 px-3 py-2 text-left font-normal",
  },
  metricChartRegion: {
    default: "relative min-h-0 w-full overflow-x-hidden pt-2",
    compact: "relative min-h-0 w-full overflow-x-hidden pt-1",
  },
  metricChartPlotRegion: {
    default:
      "relative min-h-0 w-full overflow-x-hidden px-0 pt-5 pb-3",
    compact:
      "relative min-h-0 w-full overflow-x-hidden px-0 pt-3 pb-2",
  },
  chartPanelBody: {
    default: "pt-2 pb-3",
    compact: "pt-1 pb-2",
  },
} as const satisfies Record<string, Record<AppDensity, string>>;

export type AppDensityClassKey = keyof typeof APP_DENSITY_CLASSES;

export function appDensityClass(
  key: AppDensityClassKey,
  density: AppDensity = "default",
): string {
  return APP_DENSITY_CLASSES[key][density];
}
