"use client";

import type { FC, ReactNode } from "react";

import {
  appStatLabelClass,
  appStatValueClass,
} from "../../design/app-classes";
import { cn } from "../../utils";
import { useAppDensityClass } from "../layout/app-density-context";

export type StatTileTone =
  | "default"
  | "primary"
  | "success"
  | "warn"
  | "danger";

/** Tints the value to signal status (good / attention / problem). */
const statValueToneClass: Record<StatTileTone, string> = {
  default: "",
  primary: "text-primary",
  success: "text-emerald-700 dark:text-emerald-400",
  warn: "text-amber-700 dark:text-amber-400",
  danger: "text-destructive",
};

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Tints the value to convey status. Default `"default"` (foreground). */
  tone?: StatTileTone;
  className?: string;
}

export const StatTile: FC<StatTileProps> = ({
  label,
  value,
  hint,
  tone = "default",
  className,
}) => {
  const statTileClass = useAppDensityClass("statTile");

  return (
    <div className={cn("aui-app-stat-tile", statTileClass, className)}>
      <span className={appStatLabelClass}>{label}</span>
      <span className={cn(appStatValueClass, statValueToneClass[tone])}>
        {value}
      </span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
};
