"use client";

import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "../utils";
import {
  TIMBAL_V2_BORDER,
  TIMBAL_V2_FILL,
  TIMBAL_V2_LABEL,
  TIMBAL_V2_SHADOW,
  TIMBAL_V2_SIZE_HEIGHT,
  TIMBAL_V2_SIZE_ICON,
  TIMBAL_V2_SIZE_LABEL_PX,
  type TimbalV2Size,
  type TimbalV2Variant,
} from "../design/button-tokens";

export interface TimbalV2ButtonProps extends React.ComponentProps<"button"> {
  variant?: TimbalV2Variant;
  size?: TimbalV2Size;
  isIconOnly?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  /** When true, renders children as the underlying element (Radix Slot pattern). */
  asChild?: boolean;
}

/**
 * Canonical Timbal pill button — layered absolute-fill span + relative label
 * row scoped to `group/tbv2`. Mirrors `timbal-platform` `TimbalV2Button` so
 * chat UIs built with the SDK feel identical to the Studio.
 */
export const TimbalV2Button = React.forwardRef<
  HTMLButtonElement,
  TimbalV2ButtonProps
>(function TimbalV2Button(
  {
    variant = "secondary",
    size = "sm",
    isIconOnly = false,
    isLoading = false,
    fullWidth = false,
    asChild = false,
    className,
    disabled,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  const Comp = asChild ? Slot.Root : "button";

  const sizeClass = isIconOnly
    ? TIMBAL_V2_SIZE_ICON[size]
    : TIMBAL_V2_SIZE_HEIGHT[size];

  // Ghost/link buttons keep a softer rounded-md to read as inline affordances.
  const radiusClass =
    variant === "link" || variant === "ghost" ? "rounded-md" : "rounded-full";

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={asChild && isDisabled ? true : undefined}
      data-slot="timbal-v2-button"
      data-variant={variant}
      className={cn(
        "group/tbv2 relative box-border inline-flex flex-col items-stretch overflow-hidden border-0 bg-transparent p-0 text-sm font-normal shadow-none transition duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        sizeClass,
        radiusClass,
        TIMBAL_V2_BORDER[variant],
        TIMBAL_V2_SHADOW[variant],
        fullWidth && "w-full",
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition duration-200 ease-in-out",
          TIMBAL_V2_FILL[variant],
        )}
      />
      <span
        className={cn(
          "relative z-10 flex min-h-0 flex-1 items-center justify-center gap-1 leading-tight",
          !isIconOnly && TIMBAL_V2_SIZE_LABEL_PX[size],
          TIMBAL_V2_LABEL[variant],
        )}
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </span>
    </Comp>
  );
});
