"use client";

import type { FC, InputHTMLAttributes, ReactNode } from "react";

import {
  TIMBAL_V2_SWITCH_THUMB,
  TIMBAL_V2_SWITCH_TRACK_OFF,
} from "../../design/button-tokens";
import { cn } from "../../utils";

export interface FieldSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}

const trackClass = cn(
  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-[background,box-shadow,border-color] duration-200",
  "peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/10",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  TIMBAL_V2_SWITCH_TRACK_OFF,
  "peer-checked:border-foreground/15 peer-checked:from-primary-fill-from peer-checked:to-primary-fill-to peer-checked:shadow-card",
  "peer-checked:[&>span]:translate-x-4",
);

const thumbClass = cn(
  "pointer-events-none inline-block size-4 shrink-0 translate-x-0.5 rounded-full transition-transform",
  TIMBAL_V2_SWITCH_THUMB,
);

export const FieldSwitch: FC<FieldSwitchProps> = ({
  label,
  description,
  className,
  id,
  ...props
}) => {
  const inputId = id ?? props.name ?? "switch";
  return (
    <label
      className={cn(
        "aui-app-field-switch flex cursor-pointer items-start gap-3",
        className,
      )}
      htmlFor={inputId}
    >
      <span className="relative mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...props}
        />
        <span className={trackClass} aria-hidden>
          <span className={thumbClass} />
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
};
