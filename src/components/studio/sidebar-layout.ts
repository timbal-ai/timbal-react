import { cn } from "../../utils";
import {
  studioSidebarCollapsedRailItemActiveClass,
  studioSidebarCollapsedRailItemIdleClass,
  studioSidebarNavItemActiveClass,
  studioSidebarNavItemClass,
  studioSidebarNavItemIdleClass,
  studioSidebarNavItemLayout,
} from "../../design/classes";

/** Compact rail chips once width has contracted. */
export function studioSidebarIconOnlyLayout(
  isMobile: boolean,
  isCollapsedRail: boolean,
): boolean {
  if (isMobile) return false;
  return isCollapsedRail;
}

/** Collapsed rail horizontal inset — shared by header, nav, footer. */
export const studioSidebarCollapsedRailInsetClass = "box-border w-full px-1.5";

/** Centers a single 32x32 chip in the rail column. */
export const studioSidebarCollapsedRailChipRowClass =
  "flex w-full justify-center";

export function studioSidebarCollapsedRailSectionClass(...extra: string[]) {
  return cn(studioSidebarCollapsedRailInsetClass, ...extra);
}

/**
 * Compose the full set of classes for a sidebar nav row (Agent / New chat /
 * Sign out). Returns the right surface for the icon-only / expanded /
 * active combinations.
 */
export function studioSidebarNavItemClasses(
  iconOnly: boolean,
  isActive: boolean,
): string {
  if (iconOnly) {
    return cn(
      studioSidebarNavItemClass,
      studioSidebarNavItemLayout(true),
      isActive
        ? studioSidebarCollapsedRailItemActiveClass
        : studioSidebarCollapsedRailItemIdleClass,
    );
  }

  return cn(
    studioSidebarNavItemClass,
    studioSidebarNavItemLayout(false),
    isActive ? studioSidebarNavItemActiveClass : studioSidebarNavItemIdleClass,
  );
}
