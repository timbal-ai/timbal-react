"use client";

import type { FC, ReactNode } from "react";

import type { AppDensity } from "../../design/app-density";
import { appSectionTitleClass, appSectionDescriptionClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { useAppDensityClass } from "./app-density-context";

export interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Override inherited page density for this section only. */
  density?: AppDensity;
  className?: string;
}

export const Section: FC<SectionProps> = ({
  title,
  description,
  children,
  density,
  className,
}) => {
  const sectionClass = useAppDensityClass("section", density);

  return (
    <section className={cn("aui-app-section", sectionClass, className)}>
      {title ? <h2 className={appSectionTitleClass}>{title}</h2> : null}
      {description ? (
        <p className={appSectionDescriptionClass}>{description}</p>
      ) : null}
      {children}
    </section>
  );
};
