"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK · ResourceGallery
// Responsive grid of `ResourceCard`s (projects, agents, datasets) with an
// optional empty state.
//
// Forkable. Source: src/app/blocks/resource-gallery.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";
import { ResourceCard, type ResourceCardProps } from "../surfaces/ResourceCard";

export interface ResourceGalleryItem extends ResourceCardProps {
  /** Stable key. */
  id: string;
}

export interface ResourceGalleryProps {
  resources: ResourceGalleryItem[];
  /** Max columns at large widths. Default `3`. */
  columns?: 2 | 3 | 4;
  /** Shown when `resources` is empty (e.g. an `EmptyState`). */
  emptyState?: ReactNode;
  className?: string;
}

const columnsClass: Record<NonNullable<ResourceGalleryProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export const ResourceGallery: FC<ResourceGalleryProps> = ({
  resources,
  columns = 3,
  emptyState,
  className,
}) => {
  if (resources.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }
  return (
    <div className={cn("grid grid-cols-1 gap-3", columnsClass[columns], className)}>
      {resources.map(({ id, ...card }) => (
        <ResourceCard key={id} {...card} />
      ))}
    </div>
  );
};
