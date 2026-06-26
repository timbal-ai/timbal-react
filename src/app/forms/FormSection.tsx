"use client";

import type { FC, ReactNode } from "react";

import { appSectionTitleClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { useAppDensity, useAppDensityClass } from "../layout/app-density-context";

export interface FormSectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormSection: FC<FormSectionProps> = ({ title, children, className }) => {
  const density = useAppDensity();
  const sectionClass = useAppDensityClass("section");

  return (
    <fieldset
      className={cn("aui-app-form-section", sectionClass, "border-0 p-0", className)}
    >
      {title ? (
        <legend className={cn(appSectionTitleClass, "mb-3 px-0")}>{title}</legend>
      ) : null}
      <div className={cn("flex flex-col", density === "compact" ? "gap-2" : "gap-4")}>
        {children}
      </div>
    </fieldset>
  );
};
