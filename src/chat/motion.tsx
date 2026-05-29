"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "../utils";

/**
 * Tool-row presence motion shared across the chat surface.
 *
 * Mirrors `timbal-platform` `StudioToolMotion.js` — a soft "luxury" ease in
 * with optional blur, fast exit, and a grid-row collapsible body. Exit
 * durations stay short so the layout doesn't feel sticky when tools resolve
 * quickly.
 */

export const luxuryEase = [0.16, 1, 0.3, 1] as const;

const TOOL_ENTER_MS = 0.78;
const TOOL_EXIT_MS = 0.28;

export function toolPresenceTransition(reduced: boolean) {
  return {
    enter: {
      duration: reduced ? 0.35 : TOOL_ENTER_MS,
      ease: luxuryEase,
    },
    exit: {
      duration: reduced ? 0.2 : TOOL_EXIT_MS,
      ease: [0.4, 0, 1, 1] as const,
    },
  };
}

export type ToolMotionVariant = "executing" | "settled";

function toolMotionState(
  reduced: boolean,
  entering: boolean,
  variant: ToolMotionVariant,
) {
  if (reduced) {
    return entering
      ? { opacity: 0, y: variant === "executing" ? 8 : 10 }
      : { opacity: 1, y: 0 };
  }
  // Executing rows skip the blur step so the shimmer text stays legible.
  if (variant === "executing") {
    return entering ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 };
  }
  return entering
    ? { opacity: 0, y: 14, filter: "blur(10px)" }
    : { opacity: 1, y: 0, filter: "blur(0px)" };
}

interface ToolMotionProps {
  children: ReactNode;
  className?: string;
  /** Stable key for AnimatePresence swaps (e.g. `running` → `complete`). */
  motionKey: string;
}

/** Single-shot rise-from-below for tool / artifact rows. */
export function ToolMotion({ children, className, motionKey }: ToolMotionProps) {
  const reduced = useReducedMotion() ?? false;
  const { enter, exit } = toolPresenceTransition(reduced);

  return (
    <motion.div
      key={motionKey}
      className={cn("aui-tool-motion w-full min-w-0", className)}
      initial={toolMotionState(reduced, true, "settled")}
      animate={toolMotionState(reduced, false, "settled")}
      exit={
        reduced
          ? { opacity: 0, y: 6, transition: exit }
          : { opacity: 0, y: 8, filter: "blur(6px)", transition: exit }
      }
      transition={enter}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}

interface ToolPresenceProps {
  presenceKey: string;
  children: ReactNode;
  className?: string;
  /** Executing rows skip blur so the shimmer stays readable. */
  variant?: ToolMotionVariant;
}

/** Wraps running ↔ complete (or other) tool states with a short crossfade. */
export function ToolPresence({
  presenceKey,
  children,
  className,
  variant = "settled",
}: ToolPresenceProps) {
  const reduced = useReducedMotion() ?? false;
  const { enter, exit } = toolPresenceTransition(reduced);
  const enterTransition =
    variant === "executing"
      ? { duration: reduced ? 0.3 : 0.52, ease: luxuryEase }
      : enter;

  return (
    <AnimatePresence mode="wait" initial>
      <motion.div
        key={presenceKey}
        className={cn("aui-tool-presence w-full min-w-0", className)}
        initial={toolMotionState(reduced, true, variant)}
        animate={toolMotionState(reduced, false, variant)}
        exit={
          reduced
            ? { opacity: 0, y: 6, transition: exit }
            : { opacity: 0, y: 8, filter: "blur(6px)", transition: exit }
        }
        transition={enterTransition}
        style={{
          willChange:
            variant === "executing"
              ? "opacity, transform"
              : "opacity, transform, filter",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface ToolBodyPresenceProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Expanded tool trace — CSS grid row collapse for smooth contract + opacity.
 * Avoids `AnimatePresence` exit lag when the body closes.
 */
export function ToolBodyPresence({
  open,
  children,
  className,
}: ToolBodyPresenceProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        "aui-tool-body grid min-h-0 transition-[grid-template-rows]",
        open
          ? reduced
            ? "duration-200 ease-out"
            : "duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          : reduced
            ? "duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
            : "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
      )}
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            className,
            "transition-opacity",
            open
              ? reduced
                ? "opacity-100 duration-200 ease-out"
                : "opacity-100 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75"
              : reduced
                ? "opacity-0 duration-100 ease-in"
                : "opacity-0 duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
