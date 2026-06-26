import * as React from "react";

import { cn } from "../utils";

export interface AvatarGroupProps extends React.ComponentProps<"div"> {
  /**
   * Collapse avatars beyond this count into a trailing "+N" chip. Omit to show
   * every child.
   */
  max?: number;
  /** Overlap amount between avatars. Default: `"sm"`. */
  spacing?: "sm" | "md";
}

const spacingClass = {
  sm: "-space-x-2",
  md: "-space-x-3",
} as const;

/**
 * Overlapping stack of `Avatar`s with an optional "+N" overflow chip. Each
 * child gets a ring in the background color so the stack reads cleanly on any
 * surface.
 */
function AvatarGroup({
  className,
  children,
  max,
  spacing = "sm",
  ...props
}: AvatarGroupProps) {
  const items = React.Children.toArray(children);
  const overflow = typeof max === "number" ? items.length - max : 0;
  const visible = typeof max === "number" ? items.slice(0, max) : items;

  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "flex items-center",
        spacingClass[spacing],
        "[&>*]:rounded-full [&>*]:ring-2 [&>*]:ring-background",
        className,
      )}
      {...props}
    >
      {visible}
      {overflow > 0 ? (
        <span
          aria-label={`${overflow} more`}
          className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export { AvatarGroup };
