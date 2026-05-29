"use client";

import type { FC, ReactNode } from "react";

import { PillSegmentedTabs } from "../../ui/pill-segmented-tabs";
import { cn } from "../../utils";

export interface SubNavItem {
  id: string;
  label: ReactNode;
}

export interface SubNavProps {
  items: SubNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  "aria-label"?: string;
  /** Passed to the underlying pill control for shared-layout animation. */
  layoutId?: string;
}

/**
 * Section tabs using the same pill segmented control as timbal-platform
 * (Build/Manage, dashboard section bars).
 */
export const SubNav: FC<SubNavProps> = ({
  items,
  activeId,
  onChange,
  className,
  "aria-label": ariaLabel = "Section navigation",
  layoutId,
}) => {
  return (
    <nav className={cn("aui-app-sub-nav", className)} aria-label={ariaLabel}>
      <PillSegmentedTabs
        value={activeId}
        onChange={onChange}
        tabs={items.map((item) => ({ key: item.id, label: item.label }))}
        trackVariant="flush"
        layoutId={layoutId ?? "app-sub-nav-segmented"}
        aria-label={ariaLabel}
      />
    </nav>
  );
};
