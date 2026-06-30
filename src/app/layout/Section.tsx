"use client";

import type { FC, ReactNode } from "react";

import type { AppDensity } from "../../design/app-density";
import { appSectionTitleClass, appSectionDescriptionClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { useAppDensityClass } from "./app-density-context";

export interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  /**
   * Right-aligned controls for this section's header (e.g. a "Refresh" button
   * or a filter toggle). Rendered on the same row as `title` / `description`.
   * Mirrors `Page` `actions`.
   */
  actions?: ReactNode;
  children: ReactNode;
  /** Override inherited page density for this section only. */
  density?: AppDensity;
  className?: string;
}

export const Section: FC<SectionProps> = ({
  title,
  description,
  actions,
  children,
  density,
  className,
}) => {
  const sectionClass = useAppDensityClass("section", density);
  const hasHeader = title != null || description != null || actions != null;

  return (
    <section className={cn("aui-app-section", sectionClass, className)}>
      {hasHeader ? (
        <div className="aui-app-section-header flex items-start justify-between gap-3">
          {title != null || description != null ? (
            <div className="min-w-0">
              {title ? <h2 className={appSectionTitleClass}>{title}</h2> : null}
              {description ? (
                <p className={appSectionDescriptionClass}>{description}</p>
              ) : null}
            </div>
          ) : null}
          {actions ? (
            <div className="aui-app-section-header-actions flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};
