import * as React from "react";

import { controlClass, type ControlSize } from "../design/control-surface";
import { cn } from "../utils";

/**
 * Text input on the shared control-surface contract — visually identical to
 * `Select` triggers, `SearchInput`, and every other control.
 */
function Input({
  className,
  type,
  controlSize,
  ...props
}: React.ComponentProps<"input"> & {
  /** Height + padding — matches `SelectTrigger` `size`. Default `"default"`. */
  controlSize?: ControlSize;
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlClass({ size: controlSize }),
        "w-full file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
