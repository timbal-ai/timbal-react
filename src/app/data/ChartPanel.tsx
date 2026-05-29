"use client";

import type { FC, ReactNode } from "react";

import { ChartArtifactView } from "../../artifacts/chart-artifact";
import type { ChartArtifact } from "../../artifacts/types";
import {
  appChartPanelClass,
  appChartPanelTitleClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

/** Strip nested artifact card when `ChartArtifactView` is embedded in a panel. */
const chartEmbedClass =
  "[&_.aui-artifact-root]:my-0 [&_.aui-artifact-root]:rounded-none [&_.aui-artifact-root]:border-0 [&_.aui-artifact-root]:bg-transparent [&_.aui-artifact-root]:shadow-none";

export interface ChartPanelProps {
  title?: ReactNode;
  /** Built-in SVG chart — alternative to custom `children`. */
  artifact?: ChartArtifact;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Chrome for charts — pass `artifact` for the built-in renderer or any chart in `children`.
 */
export const ChartPanel: FC<ChartPanelProps> = ({
  title,
  artifact,
  children,
  actions,
  className,
}) => {
  const body =
    children ??
    (artifact ? (
      <div className={chartEmbedClass}>
        <ChartArtifactView artifact={artifact} />
      </div>
    ) : null);

  return (
    <div className={cn("aui-app-chart-panel", appChartPanelClass, className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-2">
          {title ? <h3 className={appChartPanelTitleClass}>{title}</h3> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="min-h-[12rem] w-full">{body}</div>
    </div>
  );
};
