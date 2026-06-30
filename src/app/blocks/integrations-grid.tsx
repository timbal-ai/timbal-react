"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK · IntegrationsGrid
// Connector catalog: a responsive grid of `IntegrationCard`s with an optional
// "Connected" list (`ConnectionRowList`) below.
//
// Forkable. Source: src/app/blocks/integrations-grid.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";
import {
  IntegrationCard,
  type IntegrationCardProps,
} from "../integrations/IntegrationCard";
import { ConnectionRowList } from "../integrations/ConnectionRowList";

export interface IntegrationsGridItem extends IntegrationCardProps {
  /** Stable key. */
  id: string;
}

export interface IntegrationsGridProps {
  integrations: IntegrationsGridItem[];
  /** Max columns at large widths. Default `3`. */
  columns?: 2 | 3 | 4;
  /** `ConnectionRow` children rendered in a list below the catalog. */
  connections?: ReactNode;
  connectionsLabel?: string;
  /** Shown when `integrations` is empty (e.g. an `EmptyState`). */
  emptyState?: ReactNode;
  className?: string;
}

const columnsClass: Record<NonNullable<IntegrationsGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export const IntegrationsGrid: FC<IntegrationsGridProps> = ({
  integrations,
  columns = 3,
  connections,
  connectionsLabel = "Connected",
  emptyState,
  className,
}) => (
  <div className={cn("flex flex-col gap-6", className)}>
    {integrations.length === 0 && emptyState ? (
      emptyState
    ) : (
      <div className={cn("grid grid-cols-1 gap-3", columnsClass[columns])}>
        {integrations.map(({ id, ...card }) => (
          <IntegrationCard key={id} {...card} />
        ))}
      </div>
    )}
    {connections ? (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {connectionsLabel}
        </h3>
        <ConnectionRowList>{connections}</ConnectionRowList>
      </div>
    ) : null}
  </div>
);
