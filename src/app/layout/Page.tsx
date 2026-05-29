"use client";

import type { FC, ReactNode } from "react";

import { appPageColumnClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { PageHeader, type PageHeaderProps } from "./PageHeader";

export interface PageProps extends PageHeaderProps {
  children: ReactNode;
  /** Slot above the title (breadcrumbs). */
  breadcrumbs?: ReactNode;
  className?: string;
}

export const Page: FC<PageProps> = ({
  children,
  breadcrumbs,
  className,
  ...headerProps
}) => {
  return (
    <div className={cn("aui-app-page", appPageColumnClass, className)}>
      {breadcrumbs}
      <PageHeader {...headerProps} />
      {children}
    </div>
  );
};
