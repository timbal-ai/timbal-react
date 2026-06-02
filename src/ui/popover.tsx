import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { overlayListPanelClass, overlaySurfaceClass } from "../design/control-surface";
import { cn } from "../utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  variant = "default",
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /**
   * `default` — padded card (help text, small forms).
   * `list` — menu/listbox chrome (pair with `Command`; same skin as `Select`).
   */
  variant?: "default" | "list";
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        data-variant={variant}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          variant === "list"
            ? cn(
                overlayListPanelClass,
                "min-w-[8rem] origin-[var(--radix-popover-content-transform-origin)]",
              )
            : cn(
                overlaySurfaceClass,
                "w-72 origin-[var(--radix-popover-content-transform-origin)] rounded-xl p-4 outline-hidden",
              ),
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
