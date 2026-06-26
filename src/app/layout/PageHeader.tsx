"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";
import { useAppDensityClass } from "./app-density-context";

export interface PageHeaderProps {
  /** Page title. Omit for a headerless page (no `<h1>` rendered). */
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
}) => {
  const pageHeaderClass = useAppDensityClass("pageHeader");

  // Headerless page: nothing to render, so emit no header row (and no padding).
  if (title == null && description == null && actions == null) {
    return null;
  }

  return (
    <header className={cn("aui-app-page-header", pageHeaderClass, className)}>
      {title != null || description != null ? (
        <div className="min-w-0">
          {title != null ? (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {actions ? (
        <div className="aui-app-page-header-actions flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
};
