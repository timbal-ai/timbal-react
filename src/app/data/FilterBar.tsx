"use client";

import type { FC, ReactNode } from "react";

import { appFilterBarClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export const FilterBar: FC<FilterBarProps> = ({ children, className }) => {
  return (
    <div
      className={cn("aui-app-filter-bar", appFilterBarClass, className)}
      role="toolbar"
      aria-label="Filters"
    >
      {children}
    </div>
  );
};
