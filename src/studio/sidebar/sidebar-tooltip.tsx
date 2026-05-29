"use client";

import { type FC, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface StudioSidebarTooltipProps {
  label: string;
  enabled: boolean;
  children: ReactNode;
}

/** Conditional right-side tooltip — used by collapsed rail chips. */
export const StudioSidebarTooltip: FC<StudioSidebarTooltipProps> = ({
  label,
  enabled,
  children,
}) => {
  if (!enabled) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
