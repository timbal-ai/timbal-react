"use client";

import type { FC, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "lucide-react";

import { appInputClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { Field, type FieldProps } from "./Field";

export interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: FieldProps["label"];
  hint?: FieldProps["hint"];
  error?: FieldProps["error"];
  fieldClassName?: string;
  children: ReactNode;
}

const selectWrapClass = "relative";

const selectClass = cn(
  appInputClass,
  "appearance-none pr-9",
);

export const FieldSelect: FC<FieldSelectProps> = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  children,
  id,
  ...props
}) => {
  const selectId = id ?? props.name;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={selectId}
      className={fieldClassName}
    >
      <div className={selectWrapClass}>
        <select
          id={selectId}
          className={cn(selectClass, className)}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </Field>
  );
};
