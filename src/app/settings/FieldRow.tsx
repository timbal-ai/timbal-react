"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export interface FieldRowProps {
  label: ReactNode;
  /** The control(s) — input, switch, select, button, etc. */
  children: ReactNode;
  description?: ReactNode;
  /** Place the control inline to the right of the label (good for switches). */
  inline?: boolean;
  htmlFor?: string;
  className?: string;
}

/**
 * Labeled settings row: label + optional description on one side, control(s)
 * on the other. `inline` puts the control to the right (toggles); stacked
 * otherwise (inputs/textareas).
 */
export const FieldRow: FC<FieldRowProps> = ({
  label,
  children,
  description,
  inline = false,
  htmlFor,
  className,
}) => {
  if (inline) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-3",
          className,
        )}
      >
        <div className="min-w-0">
          <label
            htmlFor={htmlFor}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
};
