"use client";

import type { FC, TextareaHTMLAttributes } from "react";

import { appInputClass } from "../../design/app-classes";
import { cn } from "../../utils";
import { Field, type FieldProps } from "./Field";

export interface FieldTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: FieldProps["label"];
  hint?: FieldProps["hint"];
  error?: FieldProps["error"];
  fieldClassName?: string;
}

const textareaClass = cn(
  appInputClass,
  "min-h-[5.5rem] resize-y py-2.5 leading-relaxed",
);

export const FieldTextarea: FC<FieldTextareaProps> = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  id,
  ...props
}) => {
  const textareaId = id ?? props.name;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={textareaId}
      className={fieldClassName}
    >
      <textarea
        id={textareaId}
        className={cn(textareaClass, className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </Field>
  );
};
