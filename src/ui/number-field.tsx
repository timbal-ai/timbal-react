"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { controlSurfaceClass } from "../design/control-surface";
import { cn } from "../utils";

export interface NumberFieldProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "size" | "type"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "default";
  /** Accessible label (the spinbutton has no visible label). */
  ariaLabel?: string;
}

const heightClass = { sm: "h-9", default: "h-10" } as const;

const stepButtonClass =
  "inline-flex aspect-square h-full items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/15";

function clamp(n: number, min?: number, max?: number) {
  if (typeof min === "number" && n < min) return min;
  if (typeof max === "number" && n > max) return max;
  return n;
}

/**
 * Numeric input with decrement / increment controls on the shared control
 * surface. Controlled via `value`/`onValueChange` or uncontrolled with
 * `defaultValue`; clamps to `min`/`max` and steps by `step`.
 */
function NumberField({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  min,
  max,
  step = 1,
  size = "default",
  disabled,
  ariaLabel,
  className,
  ...inputProps
}: NumberFieldProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp! : uncontrolled;

  const commit = (next: number) => {
    const clamped = clamp(next, min, max);
    if (!isControlled) setUncontrolled(clamped);
    onValueChange?.(clamped);
  };

  return (
    <div
      data-slot="number-field"
      className={cn(
        controlSurfaceClass,
        "inline-flex w-full items-stretch overflow-hidden rounded-lg p-0",
        heightClass[size],
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled || (typeof min === "number" && value <= min)}
        onClick={() => commit(value - step)}
        className={cn(stepButtonClass, "border-r border-border")}
      >
        <MinusIcon className="size-4" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        value={Number.isNaN(value) ? "" : value}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.valueAsNumber;
          if (Number.isNaN(next)) {
            if (!isControlled) setUncontrolled(Number.NaN);
            return;
          }
          commit(next);
        }}
        className="w-full min-w-0 [appearance:textfield] bg-transparent px-2 text-center text-sm text-foreground outline-none disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...inputProps}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled || (typeof max === "number" && value >= max)}
        onClick={() => commit(value + step)}
        className={cn(stepButtonClass, "border-l border-border")}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

export { NumberField };
