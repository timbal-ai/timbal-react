"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export interface SettingsSectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}

/** Title + description block shared across settings pages. */
export const SettingsSectionHeader: FC<SettingsSectionHeaderProps> = ({
  title,
  description,
  className,
}) => (
  <div className={cn("flex flex-col", className)}>
    <h3 className="text-[17px] font-medium leading-tight text-foreground">{title}</h3>
    {description ? (
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    ) : null}
  </div>
);

export interface SettingsSectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** Rendered under the description in the left rail (e.g. a primary CTA). */
  descriptionFooter?: ReactNode;
  children: ReactNode;
  /** Drop the top divider (first section in a stack). */
  noBorderTop?: boolean;
  className?: string;
}

/**
 * Two-column settings block: a compact title/description rail on the left and
 * the controls on the right. Stacks on small screens. The canonical settings
 * page grammar from the platform — purely presentational.
 */
export const SettingsSection: FC<SettingsSectionProps> = ({
  title,
  description,
  descriptionFooter,
  children,
  noBorderTop = false,
  className,
}) => (
  <section
    className={cn(
      "grid grid-cols-1 gap-y-4 lg:grid-cols-[minmax(200px,280px)_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-0",
      noBorderTop ? "pb-6" : "border-t border-border py-6",
      className,
    )}
  >
    <div className="min-w-0">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {descriptionFooter ? <div className="mt-3 min-w-0">{descriptionFooter}</div> : null}
    </div>
    <div className="min-w-0 space-y-3">{children}</div>
  </section>
);
