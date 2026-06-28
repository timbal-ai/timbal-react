"use client";

import type { FC, ReactNode } from "react";

import type { AppDensity } from "../../design/app-density";
import { appPageColumn, type AppPageWidth } from "../../design/app-classes";
import { cn } from "../../utils";
import {
  AppDensityProvider,
  useAppDensity,
  useAppDensityClass,
} from "./app-density-context";
import { PageHeader, type PageHeaderProps } from "./PageHeader";

export type { AppPageWidth } from "../../design/app-classes";

export interface PageProps extends PageHeaderProps {
  children: ReactNode;
  /** Slot above the title (breadcrumbs). */
  breadcrumbs?: ReactNode;
  /**
   * Layout rhythm for this page and descendant app-kit blocks.
   * `compact` tightens page insets, section gaps, and card padding.
   */
  density?: AppDensity;
  /**
   * Content width cap. Defaults to the density default (wide cap on `default`,
   * full-bleed on `compact`). Use a narrower value (`default`, `narrow`,
   * `prose`, `centered`) for focused or reading pages instead of always
   * stretching full width. Ignored when `fill` is set unless `fillPadded`.
   */
  width?: AppPageWidth;
  /**
   * Make the page a bounded, full-height flex column instead of a centered,
   * content-sized column. Pair with `AppShell contentFill` for full-bleed pages
   * (a full-page chat, a canvas, an editor) whose body should fill the viewport
   * and own its own scroll. Give the fill child `min-h-0 flex-1`.
   */
  fill?: boolean;
  /**
   * Keep the centered column (lateral padding + `width` cap) while still
   * filling the viewport height. Use for full-height pages that should not run
   * edge-to-edge (a centered editor, a focused detail view).
   */
  fillPadded?: boolean;
  className?: string;
}

const PageFrame: FC<Omit<PageProps, "density">> = ({
  children,
  breadcrumbs,
  width,
  fill = false,
  fillPadded = false,
  className,
  ...headerProps
}) => {
  const density = useAppDensity();
  const stackClass = useAppDensityClass("pageStack");
  const columnClass = appPageColumn(width, density);

  const rootClass = fill
    ? cn(
        "flex min-h-0 min-w-0 flex-1 flex-col",
        fillPadded && columnClass,
      )
    : columnClass;

  return (
    <div className={cn("aui-app-page", rootClass, className)} data-density={density}>
      {breadcrumbs}
      <PageHeader {...headerProps} />
      {/* Fill pages own their scroll/height, so the child fills directly; a
          standard page stacks its blocks with a density-aware vertical gap. */}
      {fill ? (
        children
      ) : (
        <div className={cn("aui-app-page-stack", stackClass)}>{children}</div>
      )}
    </div>
  );
};

export const Page: FC<PageProps> = ({
  density = "default",
  children,
  breadcrumbs,
  width,
  fill = false,
  fillPadded = false,
  className,
  ...headerProps
}) => {
  return (
    <AppDensityProvider density={density}>
      <PageFrame
        breadcrumbs={breadcrumbs}
        width={width}
        fill={fill}
        fillPadded={fillPadded}
        className={className}
        {...headerProps}
      >
        {children}
      </PageFrame>
    </AppDensityProvider>
  );
};
