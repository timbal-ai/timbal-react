"use client";

import type { FC, ReactNode } from "react";

import { appSurfaceCardClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
}

export const SurfaceCard: FC<SurfaceCardProps> = ({ children, className }) => {
  return (
    <div className={cn("aui-app-surface-card", appSurfaceCardClass, className)}>
      {children}
    </div>
  );
};
