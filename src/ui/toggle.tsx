import * as React from "react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-none transition-[color,box-shadow,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: cn(
          "border border-border bg-gradient-to-b from-elevated-from to-elevated-to shadow-card",
          "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
          "data-[state=on]:border-foreground/15 data-[state=on]:from-primary-fill-from data-[state=on]:to-primary-fill-to data-[state=on]:text-primary-foreground",
          "focus-visible:ring-2 focus-visible:ring-foreground/10",
        ),
        outline: cn(
          "border border-border bg-transparent",
          "hover:bg-muted hover:text-foreground",
          "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-foreground/10",
        ),
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
