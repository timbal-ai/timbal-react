import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  TIMBAL_V2_FROM_LEGACY_BUTTON,
  type TimbalV2Size,
} from "../design/button-tokens";
import { cn } from "../utils";
import { TimbalV2Button } from "./timbal-v2-button";

const LEGACY_SIZE_TO_V2: Record<
  NonNullable<VariantProps<typeof buttonVariants>["size"]>,
  TimbalV2Size
> = {
  default: "md",
  xs: "xs",
  sm: "sm",
  lg: "lg",
  icon: "sm",
  "icon-xs": "xs",
  "icon-sm": "sm",
  "icon-lg": "lg",
};

/**
 * Layout-only variants for consumers that compose `buttonVariants` directly.
 * Fill / border / shadow come from `button-tokens` via `TimbalV2Button`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "",
        xs: "",
        sm: "",
        lg: "",
        icon: "",
        "icon-xs": "",
        "icon-sm": "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const v2Variant = TIMBAL_V2_FROM_LEGACY_BUTTON[variant ?? "default"];
  const v2Size = LEGACY_SIZE_TO_V2[size ?? "default"];
  const isIconOnly = typeof size === "string" && size.startsWith("icon");

  return (
    <TimbalV2Button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      variant={v2Variant}
      size={v2Size}
      shape="pill"
      isIconOnly={isIconOnly}
      asChild={asChild}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
