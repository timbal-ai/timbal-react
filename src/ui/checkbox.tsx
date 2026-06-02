import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";

import { cn } from "../utils";

/**
 * Checkbox — elevated surface off, primary gradient on, matching the switch and
 * buttons. Focus ring follows the house `ring-foreground/10` convention.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-border bg-gradient-to-b from-elevated-from to-elevated-to shadow-card outline-none transition-[box-shadow,background-color,border-color]",
        "focus-visible:ring-2 focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-foreground/15 data-[state=checked]:from-primary-fill-from data-[state=checked]:to-primary-fill-to data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
