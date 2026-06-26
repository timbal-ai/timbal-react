"use client";

import type { FC, ReactNode } from "react";

import {
  appFieldClass,
  appFieldLabelClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface FilterFieldProps {
  /** Visible label above the control. Omit for unlabeled fields (e.g. search). */
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Single filter control with an optional label — use inside `FilterBar`. */
export const FilterField: FC<FilterFieldProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <div className={cn("aui-app-filter-field", appFieldClass, className)}>
      {label ? <span className={appFieldLabelClass}>{label}</span> : null}
      {children}
    </div>
  );
};
