"use client";

import type { FC, ReactNode } from "react";

import { connectionRowListClass } from "./ConnectionRow";
import { cn } from "../../utils";

export interface ConnectionRowListProps {
  children: ReactNode;
  /** Accessible name for the list region. */
  "aria-label"?: string;
  className?: string;
}

/**
 * Elevated panel for stacked `ConnectionRow`s — prefer this over hand-rolling
 * `connectionRowListClass` + dividers.
 */
export const ConnectionRowList: FC<ConnectionRowListProps> = ({
  children,
  "aria-label": ariaLabel = "Connected integrations",
  className,
}) => (
  <div
    role="list"
    aria-label={ariaLabel}
    className={cn(connectionRowListClass, "divide-y divide-border", className)}
  >
    {children}
  </div>
);
