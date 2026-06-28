"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "../utils";

// Premium skeuomorphic shadow classes defined as utilities in src/styles.css
const SOLID_SKEUOMORPHIC_SHADOW = "shadow-skeuomorphic-solid";
const BORDERED_SKEUOMORPHIC_SHADOW = "shadow-skeuomorphic-bordered";

export type ButtonColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "link"
  | "primary-destructive"
  | "secondary-destructive";

export const buttonVariants = cva(
  cn(
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium",
    "transition-all duration-300 ease-in-out outline-none border",
    "focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    // Overflow hidden can clip out-of-bounds shadow, so we use precise overflow management and rounded-[inherit] on pseudo overlays
    "after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none after:transition-opacity after:duration-300 after:ease-in-out after:opacity-0",
  ),
  {
    variants: {
      color: {
        primary: cn(
          // Exact Premium Untitled UI primary BLACK / dark charcoal: gradient + borders
          "bg-gradient-to-b from-[#344054] to-[#0F1117] text-white border-[#1A1E29]",
          "hover:border-[#181C26]",
          "active:border-[#0A0D14]",
          SOLID_SKEUOMORPHIC_SHADOW,
          // Hover/active overlays for beautiful animation (the gradient is static, the overlay opacity is transitioned)
          "after:bg-white/[0.08] hover:after:opacity-100 active:after:bg-black/[0.12]",
          // Premium Dark Mode inversion: Primary becomes white, popping out elegantly
          "dark:bg-gradient-to-b dark:from-white dark:to-[#F9FAFB] dark:text-[#10121C] dark:border-white",
          "dark:hover:border-[#D0D5DD] dark:hover:text-[#10121C]",
          "dark:shadow-skeuomorphic-bordered",
          "dark:after:bg-black/[0.04] dark:active:after:bg-black/[0.08]",
        ),
        secondary: cn(
          // Exact Untitled UI secondary: premium white/gray gradient + borders
          "bg-gradient-to-b from-white to-[#F9FAFB] text-[#344054] border-[#D0D5DD]",
          "hover:text-[#1D2939] hover:border-[#D0D5DD]",
          BORDERED_SKEUOMORPHIC_SHADOW,
          // Hover/active overlays for white/gray gradient
          "after:bg-black/[0.03] hover:after:opacity-100 active:after:bg-black/[0.08]",
          // Premium Dark Mode inversion: Secondary becomes dark charcoal/gray, merging into the background
          "dark:bg-gradient-to-b dark:from-[#1F242F] dark:to-[#10121C] dark:text-[#D1D5DB] dark:border-[#344054]",
          "dark:hover:border-[#475467] dark:hover:text-white",
          "dark:shadow-skeuomorphic-solid",
          "dark:after:bg-white/[0.06] dark:active:after:bg-black/[0.15]",
        ),
        tertiary: cn(
          "bg-transparent text-[#475467] border-transparent",
          "hover:bg-[#F9FAFB] hover:text-[#344054]",
          "active:bg-[#F2F4F7] active:text-[#1D2939]",
          "after:hidden", // No overlay needed for transparent surfaces
          // Dark Mode
          "dark:text-[#9CA3AF] dark:hover:bg-[#1F242F] dark:hover:text-white dark:active:bg-[#11131A]",
        ),
        link: cn(
          "h-auto! bg-transparent p-0! border-transparent text-[#1F242F] hover:text-[#10121C]",
          "hover:underline",
          "after:hidden",
          // Dark Mode
          "dark:text-[#9CA3AF] dark:hover:text-white",
        ),
        "primary-destructive": cn(
          // Exact Untitled UI primary destructive: premium red gradient + borders (vibrant and subtle, not too dark)
          "bg-gradient-to-b from-[#D92D20] to-[#B42318] text-white border-[#B42318]",
          "hover:border-[#9E1B12]",
          "active:border-[#84140D]",
          SOLID_SKEUOMORPHIC_SHADOW,
          // Destructive red hover/active overlays
          "after:bg-white/[0.12] hover:after:opacity-100 active:after:bg-black/[0.15]",
        ),
        "secondary-destructive": cn(
          // Exact Untitled UI secondary destructive: soft red bordered
          "bg-gradient-to-b from-white to-[#F9FAFB] text-[#B42318] border-[#FDA29B]",
          "hover:text-[#9E1B12] hover:border-[#FDA29B]",
          BORDERED_SKEUOMORPHIC_SHADOW,
          // Hover overlay
          "after:bg-red-500/[0.04] hover:after:opacity-100 active:after:bg-red-950/[0.08]",
          // Dark Mode Secondary Destructive: Charcoal fill with red borders and label
          "dark:bg-gradient-to-b dark:from-[#1F242F] dark:to-[#10121C] dark:text-[#F87171] dark:border-[#9E1B12]/50",
          "dark:hover:border-[#F87171]/40",
          "dark:shadow-skeuomorphic-solid",
          "dark:after:bg-white/[0.06] dark:active:after:bg-black/[0.15]",
        ),
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1 rounded-md px-2.5 text-xs",
        md: "h-9 gap-1.5 rounded-lg px-3 text-sm",
        lg: "h-10 gap-1.5 rounded-lg px-3.5 text-sm",
        xl: "h-11 gap-2 rounded-lg px-4 text-base",
        default: "h-9 gap-1.5 rounded-lg px-3 text-sm",
        icon: "h-9 w-9 rounded-lg",
        "icon-xs": "h-7 w-7 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-lg",
      },
      shape: {
        pill: "rounded-full!",
        rounded: "", // defaults to the size variant's standard rounded-lg
      },
    },
    defaultVariants: {
      color: "primary",
      size: "default",
      shape: "rounded",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "color" | "size">,
    VariantProps<typeof buttonVariants> {
  /** Legacy variant prop for compatibility. Maps onto color variants. */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "informative";
  /** Untitled UI-style color alias. Takes precedence over `variant` when set. */
  color?: ButtonColor;
  /** Icon rendered before the label. Ignored when `asChild` is set. */
  iconLeading?: React.ReactNode;
  /** Icon rendered after the label. Ignored when `asChild` is set. */
  iconTrailing?: React.ReactNode;
  /** Show a spinner and make the button non-interactive. */
  isLoading?: boolean;
  /** Merge props onto the single child element (Radix Slot) — for links. */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  color,
  size,
  shape,
  iconLeading,
  iconTrailing,
  isLoading = false,
  asChild = false,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  // Resolve color variant
  let resolvedColor: ButtonColor = "primary";
  if (color) {
    resolvedColor = color;
  } else if (variant) {
    if (variant === "default" || variant === "informative") resolvedColor = "primary";
    else if (variant === "secondary" || variant === "outline") resolvedColor = "secondary";
    else if (variant === "destructive") resolvedColor = "primary-destructive";
    else if (variant === "ghost") resolvedColor = "tertiary";
    else if (variant === "link") resolvedColor = "link";
  }

  const classes = cn(
    buttonVariants({
      color: resolvedColor,
      size: size ?? "default",
      shape: shape ?? "rounded",
    }),
    className,
  );

  // Slot requires a single child, so icons/spinner only apply when not asChild.
  if (asChild) {
    return (
      <Slot.Root
        className={classes}
        aria-disabled={isDisabled ? true : undefined}
        data-slot="button"
        data-variant={resolvedColor}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      data-slot="button"
      data-variant={resolvedColor}
      className={classes}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconLeading
      )}
      {children}
      {!isLoading ? iconTrailing : null}
    </button>
  );
}
