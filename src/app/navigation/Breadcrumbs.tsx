"use client";

import type { FC, ReactNode } from "react";

import {
  appBreadcrumbLinkClass,
  appBreadcrumbsClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface BreadcrumbEntry {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

/** @deprecated Use `BreadcrumbEntry` — avoids clashing with the UI `BreadcrumbItem` primitive. */
export type BreadcrumbItem = BreadcrumbEntry;

export interface BreadcrumbsProps {
  items: BreadcrumbEntry[];
  className?: string;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn("aui-app-breadcrumbs", appBreadcrumbsClass, className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span className="text-muted-foreground/50" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast ? (
                <span className="text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a href={item.href} className={appBreadcrumbLinkClass}>
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  className={appBreadcrumbLinkClass}
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
