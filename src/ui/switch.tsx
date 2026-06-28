import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import {
  TIMBAL_V2_SWITCH_THUMB,
  TIMBAL_V2_SWITCH_TRACK_OFF,
} from "../design/button-tokens";
import { cn } from "../utils";

/**
 * Switch — shares the exact track/thumb tokens as the app-kit `FieldSwitch`, so
 * the bare primitive and the labeled form row are visually identical.
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-[background,box-shadow,border-color] duration-200",
        TIMBAL_V2_SWITCH_TRACK_OFF,
        "focus-visible:ring-2 focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-foreground/15 data-[state=checked]:from-primary-fill-from data-[state=checked]:to-primary-fill-to data-[state=checked]:shadow-card",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          TIMBAL_V2_SWITCH_THUMB,
          "pointer-events-none block size-4 translate-x-0.5 rounded-full transition-transform data-[state=checked]:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
