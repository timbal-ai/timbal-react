"use client";

import { useId, type FC, type ReactNode, type SelectHTMLAttributes } from "react";
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

/**
 * A labeled form select — a native `<select>` wrapped in a `Field` (label,
 * hint, error), styled to match the kit's inputs. Children are plain `<option>`
 * elements. Use this in forms.
 *
 * For a rich, searchable/custom-rendered dropdown (Radix), compose `Select` +
 * `SelectTrigger` / `SelectContent` / `SelectItem` from `@timbal-ai/timbal-react/ui`
 * instead.
 *
 * @example
 * ```tsx
 * <FieldSelect label="Environment" defaultValue="prod">
 *   <option value="prod">Production</option>
 *   <option value="staging">Staging</option>
 * </FieldSelect>
 * ```
 */
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
  const autoId = useId();
  const selectId = id ?? props.name ?? autoId;
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
