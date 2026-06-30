"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK · StatGrid
// Responsive grid of `StatTile`s. Use for an at-a-glance KPI overview when you
// want individual elevated tiles rather than one unified `MetricRow` card.
//
// Forkable. Source: src/app/blocks/stat-grid.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { FC } from "react";

import { cn } from "../../utils";
import { StatTile, type StatTileProps } from "../surfaces/StatTile";

export interface StatGridItem extends StatTileProps {
  /** Stable key. */
  id: string;
}

export interface StatGridProps {
  stats: StatGridItem[];
  /** Max columns at large widths. Always single-column on phones. Default `4`. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnsClass: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export const StatGrid: FC<StatGridProps> = ({ stats, columns = 4, className }) => (
  <div className={cn("grid grid-cols-1 gap-3", columnsClass[columns], className)}>
    {stats.map(({ id, ...stat }) => (
      <StatTile key={id} {...stat} />
    ))}
  </div>
);
