"use client";

import { forwardRef } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  TimbalV2Button,
  type TimbalV2ButtonProps,
} from "../ui/timbal-v2-button";

export interface TooltipIconButtonProps
  extends Omit<TimbalV2ButtonProps, "isIconOnly"> {
  /** Visible tooltip + accessible label. Always required. */
  tooltip: string;
  /** Tooltip placement. Default: "bottom". */
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Icon-only Timbal pill button with a tooltip. Used by every chat-surface
 * toolbar (composer send/cancel, message action bar, scroll-to-bottom).
 *
 * Defaults to a soft `secondary` variant so it sits cleanly inside composers,
 * message bubbles, and the action bar. Override via `variant`.
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
        <TimbalV2Button ref={ref} variant={variant} size="sm" isIconOnly {...props}>
          {children}
          <span className="sr-only">{tooltip}</span>
        </TimbalV2Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});
