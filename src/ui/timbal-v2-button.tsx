"use client";

import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "../utils";
import {
  TIMBAL_V2_BORDER,
  TIMBAL_V2_ELEVATED_GRADIENT,
  TIMBAL_V2_FILL,
  TIMBAL_V2_LABEL,
  TIMBAL_V2_PRIMARY_GRADIENT,
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
  /** `pill` (default) — full rounding; `rect` — `rounded-md` for shadcn-style buttons. */
  shape?: "pill" | "rect";
  /**
   * When true, merges props onto the single child element (Radix Slot).
   * Uses a flat surface (no layered fill spans) — required for `asChild` to work.
   */
  asChild?: boolean;
}

/** Flat fill/label tokens for `asChild` — layered `group/tbv2` spans cannot be used with Slot. */
const TIMBAL_V2_FILL_AS_CHILD: Record<TimbalV2Variant, string> = {
  primary: [
    "bg-gradient-to-b from-primary-fill-from to-primary-fill-to",
    "hover:from-primary-fill-hover-from hover:to-primary-fill-hover-to",
    "active:from-primary-fill-active-from active:to-primary-fill-active-to",
  ].join(" "),
  informative: [
    TIMBAL_V2_PRIMARY_GRADIENT,
    "hover:from-primary-fill-hover-from hover:to-primary-fill-hover-to",
    "active:from-primary-fill-active-from active:to-primary-fill-active-to",
    "active:[background-image:linear-gradient(to_top,rgba(0,0,0,0.08),transparent_55%)]",
  ].join(" "),
  destructive: [
    TIMBAL_V2_ELEVATED_GRADIENT,
    "hover:from-destructive-fill-hover-from hover:to-destructive-fill-hover-to",
    "active:from-destructive-fill-active-from active:to-destructive-fill-active-to",
  ].join(" "),
  secondary: [
    TIMBAL_V2_ELEVATED_GRADIENT,
    "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
    "active:from-secondary-fill-active-from active:to-secondary-fill-active-to",
  ].join(" "),
  ghost: [
    "bg-transparent",
    "hover:bg-ghost-fill-hover",
    "active:bg-ghost-fill-active",
  ].join(" "),
  link: "bg-transparent",
};

const TIMBAL_V2_LABEL_AS_CHILD: Record<TimbalV2Variant, string> = {
  ...TIMBAL_V2_LABEL,
  link: "text-foreground underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground/45",
};

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
    shape = "pill",
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

  const sizeClass = isIconOnly
    ? TIMBAL_V2_SIZE_ICON[size]
    : TIMBAL_V2_SIZE_HEIGHT[size];

  const radiusClass =
    variant === "link" || variant === "ghost"
      ? "rounded-md"
      : shape === "rect"
        ? "rounded-md"
        : "rounded-full";

  const sharedRootClass = cn(
    "relative box-border inline-flex items-center justify-center gap-2 whitespace-nowrap border-0 text-sm font-normal shadow-none transition duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    sizeClass,
    radiusClass,
    TIMBAL_V2_BORDER[variant],
    TIMBAL_V2_SHADOW[variant],
    fullWidth && "w-full",
    isDisabled && "pointer-events-none opacity-50",
    className,
  );

  if (asChild) {
    return (
      <Slot.Root
        ref={ref}
        aria-disabled={isDisabled ? true : undefined}
        data-slot="timbal-v2-button"
        data-variant={variant}
        className={cn(
          sharedRootClass,
          TIMBAL_V2_FILL_AS_CHILD[variant],
          !isIconOnly && TIMBAL_V2_SIZE_LABEL_PX[size],
          TIMBAL_V2_LABEL_AS_CHILD[variant],
        )}
        {...props}
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </Slot.Root>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      data-slot="timbal-v2-button"
      data-variant={variant}
      className={cn(
        "group/tbv2 flex-col items-stretch overflow-hidden bg-transparent p-0",
        sharedRootClass,
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
    </button>
  );
});
