"use client";

import type { FC, ReactNode } from "react";

import { appPageHeaderClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface PageHeaderProps {
  title: ReactNode;
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
  return (
    <header className={cn("aui-app-page-header", appPageHeaderClass, className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="aui-app-page-header-actions flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
};
