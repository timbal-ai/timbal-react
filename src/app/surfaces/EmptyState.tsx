"use client";

import type { FC, ReactNode } from "react";

import {
  appEmptyStateClass,
  appEmptyStateDescriptionClass,
  appEmptyStateTitleClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("aui-app-empty-state", appEmptyStateClass, className)}>
      <p className={appEmptyStateTitleClass}>{title}</p>
      {description ? (
        <p className={appEmptyStateDescriptionClass}>{description}</p>
      ) : null}
      {action}
    </div>
  );
};
