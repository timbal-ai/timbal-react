"use client";

import { useId, type FC, type ReactNode } from "react";

import { TIMBAL_V2_ELEVATED_SURFACE, TIMBAL_V2_LOGO_TILE } from "../../design/button-tokens";
import { cn } from "../../utils";

export type IntegrationCardStatus = "available" | "connected" | "disabled" | "locked";

/** Catalog grid height — matches timbal-platform `INTEGRATION_CATALOG_CARD_HEIGHT_CLASS`. */
export const INTEGRATION_CATALOG_CARD_HEIGHT_CLASS =
  "h-[12.25rem] min-h-[12.25rem] max-h-[12.25rem]";

export interface IntegrationCardProps {
  name: ReactNode;
  description?: ReactNode;
  /** Logo node — an <img>, icon, or lettermark. Rendered in a rounded tile. */
  logo?: ReactNode;
  /** Trailing header slot (e.g. a `PlanBadge`). */
  badge?: ReactNode;
  status?: IntegrationCardStatus;
  /** Footer action — use `<Button variant="secondary" size="sm">` for platform parity. */
  action?: ReactNode;
  /** Whole-card click — makes the card a button (omit when using `action`). */
  onClick?: () => void;
  /** Accessible name when `name` is not plain text, or for whole-card buttons. */
  ariaLabel?: string;
  className?: string;
}

const statusLabel: Record<IntegrationCardStatus, string | null> = {
  available: null,
  connected: "Connected",
  disabled: "Disabled",
  locked: "Locked",
};

const catalogCardShellClass = cn(
  "group relative box-border flex flex-col overflow-hidden rounded-2xl px-4 pb-4 pt-4 text-left font-normal",
  INTEGRATION_CATALOG_CARD_HEIGHT_CLASS,
  TIMBAL_V2_ELEVATED_SURFACE,
  "transition-opacity duration-200 ease-out",
);

const catalogCardInteractiveClass = cn(
  catalogCardShellClass,
  "cursor-pointer bg-transparent hover:bg-transparent active:bg-transparent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const catalogCardMutedClass = cn(
  "border-border/60 saturate-[0.72]",
  "from-muted/80 to-muted/50 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-white/[0.02]",
);

const logoShellClass = cn(
  "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl",
  TIMBAL_V2_LOGO_TILE,
);

/**
 * Catalog card for an integration / connector — elevated secondary chrome (same
 * surface as bordered buttons), logo tile, and optional footer CTA.
 */
export const IntegrationCard: FC<IntegrationCardProps> = ({
  name,
  description,
  logo,
  badge,
  status = "available",
  action,
  onClick,
  ariaLabel,
  className,
}) => {
  const titleId = useId();
  const locked = status === "locked";
  const dimmed = status === "disabled" || locked;

  const body = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start gap-3 pr-2">
        {logo ? <span className={logoShellClass} aria-hidden={Boolean(ariaLabel)}>{logo}</span> : null}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4
                id={onClick && !action ? undefined : titleId}
                className="truncate text-sm font-normal leading-snug text-foreground"
              >
                {name}
              </h4>
              {statusLabel[status] ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{statusLabel[status]}</p>
              ) : null}
            </div>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
        </div>
      </div>

      {description ? (
        <p
          className={cn(
            "mt-3 line-clamp-3 shrink-0 text-sm leading-relaxed text-muted-foreground",
            dimmed && "text-muted-foreground/80",
          )}
        >
          {description}
        </p>
      ) : null}

      {action ? (
        <>
          <div className="min-h-0 flex-1" aria-hidden />
          <div className="relative mt-3 shrink-0">{action}</div>
        </>
      ) : null}
    </div>
  );

  const shellClass = cn(
    catalogCardShellClass,
    dimmed && catalogCardMutedClass,
    locked && "cursor-default opacity-75",
    className,
  );

  if (onClick && !action) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={locked}
        aria-label={ariaLabel}
        className={cn(
          catalogCardInteractiveClass,
          dimmed && catalogCardMutedClass,
          locked && "cursor-default opacity-75",
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <article className={shellClass} aria-labelledby={titleId}>
      {body}
    </article>
  );
};
