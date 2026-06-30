"use client";

import { forwardRef } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button, type ButtonColor, type ButtonProps } from "../ui/button";

/** Pill-button intents kept stable for chat-surface toolbars. */
export type TooltipIconButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "informative"
  | "destructive";

const VARIANT_TO_COLOR: Record<TooltipIconButtonVariant, ButtonColor> = {
  primary: "primary",
  informative: "primary",
  secondary: "secondary",
  ghost: "tertiary",
  destructive: "primary-destructive",
};

export interface TooltipIconButtonProps
  extends Omit<ButtonProps, "variant" | "color" | "size" | "shape"> {
  /** Visible tooltip + accessible label. Always required. */
  tooltip: string;
  /** Tooltip placement. Default: "bottom". */
  side?: "top" | "bottom" | "left" | "right";
  /** Pill intent. Default: "secondary". */
  variant?: TooltipIconButtonVariant;
}

/**
 * Icon-only pill button with a tooltip. Used by every chat-surface toolbar
 * (composer send/cancel, message action bar, scroll-to-bottom).
 *
 * Defaults to a soft `secondary` variant so it sits cleanly inside composers,
 * message bubbles, and the action bar. Override via `variant`. Renders the
 * shared {@link Button} as a fully-rounded `icon-sm` pill.
 */
export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(function TooltipIconButton(
  { tooltip, side = "bottom", variant = "secondary", children, ...props },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          color={VARIANT_TO_COLOR[variant]}
          size="icon-sm"
          shape="pill"
          {...props}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});
