"use client";

import type { FC, ReactNode } from "react";

import { appSectionClass, appSectionTitleClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface FormSectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormSection: FC<FormSectionProps> = ({ title, children, className }) => {
  return (
    <fieldset className={cn("aui-app-form-section", appSectionClass, "border-0 p-0", className)}>
      {title ? (
        <legend className={cn(appSectionTitleClass, "mb-3 px-0")}>{title}</legend>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
};
