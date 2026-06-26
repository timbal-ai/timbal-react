"use client";

import type { FC, ReactNode } from "react";

import {
  appEmptyStateDescriptionClass,
  appEmptyStateTitleClass,
} from "../../design/app-classes";
import { cn } from "../../utils";
import { useAppDensityClass } from "../layout/app-density-context";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Visual variant of the empty state. Default `"default"`. */
  variant?: "default" | "layered" | "compact";
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className,
  variant = "default",
}) => {
  const densityClass = useAppDensityClass("emptyState");

  if (variant === "layered") {
    return (
      <div
        className={cn(
          "aui-app-empty-state-layered w-full rounded-2xl border border-border/40 bg-muted/20 p-6 md:p-8 flex items-center justify-center dark:bg-muted/10",
          className
        )}
      >
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center text-center gap-4 transition-all duration-200 hover:border-border/80 dark:bg-card/45">
          <div className="flex flex-col gap-1.5 items-center justify-center">
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {title}
            </h3>
            {description ? (
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="mt-1">{action}</div> : null}
        </div>
      </div>
    );
  }

  // Handle compact as a direct override, or fallback to default density behavior
  const isCompact = variant === "compact";
  const finalClass = isCompact
    ? "aui-app-empty-state rounded-xl border border-border bg-gradient-to-b from-elevated-from to-elevated-to p-3 flex flex-col items-center justify-center gap-2 py-8 text-center"
    : cn("aui-app-empty-state", densityClass);

  return (
    <div className={cn(finalClass, className)}>
      <p className={cn(appEmptyStateTitleClass, "font-semibold tracking-tight")}>{title}</p>
      {description ? (
        <p className={appEmptyStateDescriptionClass}>{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
};
