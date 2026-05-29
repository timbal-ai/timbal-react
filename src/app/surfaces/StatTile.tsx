"use client";

import type { FC, ReactNode } from "react";

import {
  appStatLabelClass,
  appStatTileClass,
  appStatValueClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export const StatTile: FC<StatTileProps> = ({ label, value, hint, className }) => {
  return (
    <div className={cn("aui-app-stat-tile", appStatTileClass, className)}>
      <span className={appStatLabelClass}>{label}</span>
      <span className={appStatValueClass}>{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
};
