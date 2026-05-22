"use client";

import { type FC, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Shared chrome for built-in artifact renderers. Custom renderers don't have
 * to use this — it's just a small visual baseline so charts, tables, and
 * question widgets feel like a coherent set.
 */
export const ArtifactCard: FC<{
  title?: string;
  kind?: string;
  className?: string;
  bodyClassName?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}> = ({ title, kind, className, bodyClassName, toolbar, children }) => {
  const hasHeader = Boolean(title || toolbar);
  return (
    <div
      className={cn(
        "aui-artifact-root my-3 overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm",
        className,
      )}
      data-artifact-kind={kind}
    >
      {hasHeader && (
        <div className="aui-artifact-header flex items-center gap-2 border-b border-border/40 bg-muted/30 px-3 py-1.5">
          {title && (
            <span className="aui-artifact-title flex-1 truncate text-xs font-semibold text-foreground/80">
              {title}
            </span>
          )}
          {!title && <span className="flex-1" />}
          {toolbar}
        </div>
      )}
      <div className={cn("aui-artifact-body", bodyClassName)}>{children}</div>
    </div>
  );
};
