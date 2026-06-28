"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export interface DangerZoneActionProps {
  title: ReactNode;
  description?: ReactNode;
  /** The destructive control (e.g. a delete Button). */
  action: ReactNode;
  className?: string;
}

/** A single destructive row inside `DangerZone`. */
export const DangerZoneAction: FC<DangerZoneActionProps> = ({
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    <div className="shrink-0">{action}</div>
  </div>
);

export interface DangerZoneProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Destructive-actions container with a destructive-tinted border. Wrap one or
 * more `DangerZoneAction` rows (delete project, transfer ownership, etc.).
 */
export const DangerZone: FC<DangerZoneProps> = ({
  title = "Danger zone",
  description,
  children,
  className,
}) => (
  <section
    className={cn(
      "overflow-hidden rounded-xl border border-destructive/30",
      className,
    )}
  >
    {(title || description) && (
      <header className="border-b border-destructive/20 bg-destructive/5 px-4 py-3">
        {title ? (
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
    )}
    <div className="divide-y divide-border bg-card">{children}</div>
  </section>
);
