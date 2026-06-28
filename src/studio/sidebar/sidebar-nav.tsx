"use client";

import { type FC } from "react";

import { cn } from "../../utils";
import {
  studioSidebarCollapsedRailChipRowClass,
  studioSidebarCollapsedRailInsetClass,
  studioSidebarNavItemClasses,
} from "./sidebar-layout";
import { StudioSidebarEntryMotion } from "./sidebar-entry-motion";
import { StudioSidebarTooltip } from "./sidebar-tooltip";
import {
  type StudioSidebarItem,
  workforceItemIcon,
  workforceItemId,
  workforceItemInitial,
  workforceItemLabel,
} from "./sidebar-workforce";

interface StudioSidebarNavProps {
  workforces: StudioSidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  iconOnlyLayout: boolean;
  showTooltips: boolean;
}

/** Vertical list of workforce buttons, rail-aware. */
export const StudioSidebarNav: FC<StudioSidebarNavProps> = ({
  workforces,
  selectedId,
  onSelect,
  iconOnlyLayout,
  showTooltips,
}) => {
  if (workforces.length === 0) return null;

  return (
    <nav
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto py-1",
        iconOnlyLayout
          ? cn(studioSidebarCollapsedRailInsetClass, "gap-1")
          : "gap-0.5 px-2",
      )}
      aria-label="Agents"
    >
      {workforces.map((w) => {
        const id = workforceItemId(w);
        const isActive = id === selectedId;
        const label = workforceItemLabel(w);
        const icon = workforceItemIcon(w);

        return (
          <StudioSidebarEntryMotion
            key={id}
            className={
              iconOnlyLayout ? studioSidebarCollapsedRailChipRowClass : undefined
            }
          >
            <StudioSidebarTooltip label={label} enabled={showTooltips}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-pressed={isActive}
                aria-label={label}
                className={cn(
                  studioSidebarNavItemClasses(iconOnlyLayout, isActive),
                  iconOnlyLayout && "inline-flex",
                )}
              >
                {iconOnlyLayout ? (
                  icon ? (
                    <span
                      className="inline-flex items-center justify-center [&>svg]:size-4"
                      aria-hidden
                    >
                      {icon}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold leading-none">
                      {workforceItemInitial(w)}
                    </span>
                  )
                ) : (
                  <>
                    {icon ? (
                      <span
                        className="inline-flex shrink-0 items-center justify-center [&>svg]:size-4"
                        aria-hidden
                      >
                        {icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 truncate">{label}</span>
                  </>
                )}
              </button>
            </StudioSidebarTooltip>
          </StudioSidebarEntryMotion>
        );
      })}
    </nav>
  );
};
