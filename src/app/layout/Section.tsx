"use client";

import type { FC, ReactNode } from "react";

import {
  appSectionClass,
  appSectionDescriptionClass,
  appSectionTitleClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Section: FC<SectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <section className={cn("aui-app-section", appSectionClass, className)}>
      {title ? <h2 className={appSectionTitleClass}>{title}</h2> : null}
      {description ? (
        <p className={appSectionDescriptionClass}>{description}</p>
      ) : null}
      {children}
    </section>
  );
};
