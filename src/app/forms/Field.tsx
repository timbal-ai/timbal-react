"use client";

import type { FC, InputHTMLAttributes, ReactNode } from "react";

import {
  appFieldClass,
  appFieldHintClass,
  appFieldLabelClass,
  appInputClass,
} from "../../design/app-classes";
import { cn } from "../../utils";

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
  htmlFor?: string;
}

export const Field: FC<FieldProps> = ({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}) => {
  return (
    <div className={cn("aui-app-field", appFieldClass, className)}>
      <label className={appFieldLabelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className={appFieldHintClass}>{hint}</p> : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  fieldClassName?: string;
}

export const FieldInput: FC<FieldInputProps> = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  id,
  ...inputProps
}) => {
  const inputId = id ?? inputProps.name;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      className={fieldClassName}
    >
      <input
        id={inputId}
        className={cn(appInputClass, className)}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
    </Field>
  );
};
