"use client";

import { type FC, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "../../utils";
import {
  studioSidebarCollapsedRailChipRowClass,
  studioSidebarCollapsedRailInsetClass,
} from "./sidebar-layout";
import { StudioSidebarTooltip } from "./sidebar-tooltip";

export const STUDIO_SIDEBAR_BRAND_ICON_SIZE = 32;

const sidebarHeaderClass = "flex h-12 shrink-0 items-center px-2";

const toggleButtonClass = cn(
  "flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors",
  "hover:bg-muted hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
);

interface StudioSidebarHeaderProps {
  /** Tied to panel width, not the collapse toggle intent — avoids centering early. */
  isCollapsedRail: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  /**
   * Brand element rendered at the start of the header (when expanded) and
   * crossfaded with the expand chevron (when collapsed). Defaults to a
   * 32px Timbal mark; pass any node to use your own logo.
   */
  brand: ReactNode;
  /** Logo element rendered in the collapsed sidebar header. */
  logo?: ReactNode;
  /** Force the collapsed sidebar header to fallback to the open chevron statically. */
  fallbackToChevron?: boolean;
}

const SidebarToggleButton: FC<{
  ariaLabel: string;
  expanded: boolean;
  onClick: () => void;
  children: ReactNode;
}> = ({ ariaLabel, expanded, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(toggleButtonClass, "size-7")}
    aria-label={ariaLabel}
    aria-expanded={expanded}
  >
    {children}
  </button>
);

/** Collapsed rail: bare mark (no card chrome); crossfades to expand chevron on hover. */
const CollapsedBrandToggle: FC<{
  onExpand: () => void;
  logo?: ReactNode;
  fallbackToChevron?: boolean;
}> = ({ onExpand, logo, fallbackToChevron }) => {
  if (fallbackToChevron || !logo) {
    return (
      <div className={studioSidebarCollapsedRailChipRowClass}>
        <StudioSidebarTooltip label="Expand sidebar" enabled>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className={cn(
              toggleButtonClass,
              "group relative inline-flex size-8 items-center justify-center overflow-hidden rounded-lg",
            )}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </StudioSidebarTooltip>
      </div>
    );
  }

  return (
    <div className={studioSidebarCollapsedRailChipRowClass}>
      <StudioSidebarTooltip label="Expand sidebar" enabled>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand sidebar"
          aria-expanded={false}
          className={cn(
            toggleButtonClass,
            "group relative inline-flex size-8 items-center justify-center overflow-hidden rounded-lg",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex items-center justify-center",
              "transition-[opacity,transform] duration-200 ease-out",
              "group-hover:scale-90 group-hover:opacity-0",
            )}
          >
            {logo}
          </span>
          <ChevronRight
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 m-auto size-4",
              "opacity-0 transition-[opacity,transform] duration-200 ease-out",
              "group-hover:opacity-100",
            )}
          />
        </button>
      </StudioSidebarTooltip>
    </div>
  );
};

export const StudioSidebarHeader: FC<StudioSidebarHeaderProps> = ({
  isCollapsedRail,
  isMobile,
  mobileOpen,
  onToggle,
  brand,
  logo,
  fallbackToChevron,
}) => {
  if (isMobile) {
    return (
      <header className={cn(sidebarHeaderClass, "justify-between gap-2 pr-2")}>
        {brand}
        <SidebarToggleButton
          ariaLabel="Close menu"
          expanded={mobileOpen}
          onClick={onToggle}
        >
          <X className="size-3.5" />
        </SidebarToggleButton>
      </header>
    );
  }

  if (isCollapsedRail) {
    return (
      <header
        className={cn(
          "flex h-12 shrink-0 items-center",
          studioSidebarCollapsedRailInsetClass,
        )}
      >
        <CollapsedBrandToggle
          onExpand={onToggle}
          logo={logo}
          fallbackToChevron={fallbackToChevron}
        />
      </header>
    );
  }

  return (
    <header className={cn(sidebarHeaderClass, "justify-between gap-1 pr-2")}>
      {brand}
      <SidebarToggleButton
        ariaLabel="Collapse sidebar"
        expanded
        onClick={onToggle}
      >
        <ChevronLeft className="size-4" />
      </SidebarToggleButton>
    </header>
  );
};
