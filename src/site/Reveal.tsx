"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "../utils";
import { DURATION, EASE } from "./easing";

/** Entrance styles. `mask-up` clips the child and slides it in from below. */
export type RevealVariant =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "blur"
  | "scale"
  | "mask-up";

export interface RevealProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Entrance style. Default `fade-up`. */
  variant?: RevealVariant;
  /** Seconds before the animation starts. */
  delay?: number;
  /** Animation duration in seconds. Default {@link DURATION.base}. */
  duration?: number;
  /** Slide distance in px for the directional + mask variants. Default 28. */
  distance?: number;
  /**
   * Fraction of the element that must be visible before it animates (0–1), or
   * `"some"` / `"all"`. Default 0.3.
   */
  amount?: number | "some" | "all";
  /** Replay every time the element re-enters the viewport. Default `false`. */
  repeat?: boolean;
  /** Render as a different intrinsic element (e.g. `"section"`, `"li"`). */
  as?: keyof React.JSX.IntrinsicElements;
  children?: React.ReactNode;
}

function hidden(variant: RevealVariant, distance: number): Record<string, number | string> {
  switch (variant) {
    case "fade":
      return { opacity: 0 };
    case "fade-up":
      return { opacity: 0, y: distance };
    case "fade-down":
      return { opacity: 0, y: -distance };
    case "fade-left":
      return { opacity: 0, x: distance };
    case "fade-right":
      return { opacity: 0, x: -distance };
    case "blur":
      return { opacity: 0, filter: "blur(12px)" };
    case "scale":
      return { opacity: 0, scale: 0.94 };
    case "mask-up":
      return { y: "110%" };
  }
}

function shown(variant: RevealVariant): Record<string, number | string> {
  if (variant === "mask-up") return { y: "0%" };
  if (variant === "blur") return { opacity: 1, filter: "blur(0px)" };
  if (variant === "scale") return { opacity: 1, scale: 1 };
  return { opacity: 1, x: 0, y: 0 };
}

/**
 * Reveal a block when it scrolls into view. Honours `prefers-reduced-motion`
 * (renders immediately, no transform) and SSR (no layout shift — the element
 * occupies its space from first paint).
 *
 * ```tsx
 * <Reveal variant="fade-up" delay={0.1}>
 *   <h2>Built for the long run</h2>
 * </Reveal>
 * ```
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  {
    variant = "fade-up",
    delay = 0,
    duration = DURATION.base,
    distance = 28,
    amount = 0.3,
    repeat = false,
    as = "div",
    className,
    children,
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion();
  const isMask = variant === "mask-up";

  if (reduce) {
    const Tag = as as React.ElementType;
    return (
      <Tag ref={ref} className={cn(isMask && "overflow-hidden", className)} {...rest}>
        {children}
      </Tag>
    );
  }

  const variants: Variants = {
    hidden: hidden(variant, distance),
    shown: shown(variant),
  };

  const MotionTag = (motion[as as keyof typeof motion] ?? motion.div) as typeof motion.div;
  const inner = (
    <MotionTag
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: !repeat, amount }}
      transition={{ duration, delay, ease: EASE.out }}
      {...(rest as object)}
    >
      {children}
    </MotionTag>
  );

  // `mask-up` needs a non-animating clip wrapper so the slide is masked.
  if (isMask) {
    return <span className="block overflow-hidden">{inner}</span>;
  }
  return inner;
});
