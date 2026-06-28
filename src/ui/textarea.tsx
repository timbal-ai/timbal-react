import * as React from "react";

import { controlSurfaceClass } from "../design/control-surface";
import { cn } from "../utils";

/**
 * Multi-line input on the shared control skin (auto height, not the fixed
 * control height).
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlSurfaceClass,
        "min-h-16 w-full resize-y rounded-lg px-2.5 py-1.5 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
