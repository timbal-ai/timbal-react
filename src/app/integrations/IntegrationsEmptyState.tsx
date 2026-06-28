"use client";

import { useId, type FC, type ReactNode } from "react";

import { TIMBAL_V2_ELEVATED_SURFACE, TIMBAL_V2_LOGO_TILE } from "../../design/button-tokens";
import { cn } from "../../utils";

export interface IntegrationsEmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Decorative icon / illustration node. */
  icon?: ReactNode;
  /** Primary CTA (e.g. a "Browse catalog" button). */
  action?: ReactNode;
  className?: string;
}

/** Centered empty hero — same elevated chrome as catalog cards. */
export const IntegrationsEmptyState: FC<IntegrationsEmptyStateProps> = ({
  title = "No integrations yet",
  description = "Connect a provider to start syncing data and powering your workforce.",
  icon,
  action,
  className,
}) => {
  const titleId = useId();

  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-14 text-center",
        TIMBAL_V2_ELEVATED_SURFACE,
        className,
      )}
      aria-labelledby={titleId}
    >
      {icon ? (
        <span
          className={cn(
            "flex size-14 items-center justify-center overflow-hidden rounded-2xl",
            TIMBAL_V2_LOGO_TILE,
            "text-muted-foreground",
          )}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <h3 id={titleId} className="text-base font-normal text-foreground">
        {title}
      </h3>
    {description ? (
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </section>
  );
};
