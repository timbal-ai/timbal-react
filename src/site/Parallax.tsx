"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "../utils";

export interface ParallaxProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Parallax strength. Positive values drift the element *slower* than scroll
   * (it lags behind); negative values push it ahead. Roughly the fraction of
   * the element's travel to offset. Sensible range -0.6…0.6. Default 0.2.
   */
  speed?: number;
  /** Axis to translate along. Default `"y"`. */
  axis?: "x" | "y";
  /** Smooth the motion with a spring (avoids jitter on fast scroll). Default `true`. */
  smooth?: boolean;
  children?: React.ReactNode;
}

/**
 * Translate a layer relative to scroll for depth. Drives off the element's own
 * position in the viewport (no global scroll listener), so multiple parallax
 * layers compose cheaply. No-op under `prefers-reduced-motion`.
 *
 * ```tsx
 * <Parallax speed={0.3}>
 *   <img src={hero} alt="" className="h-full w-full object-cover" />
 * </Parallax>
 * ```
 */
export const Parallax = React.forwardRef<HTMLDivElement, ParallaxProps>(function Parallax(
  { speed = 0.2, axis = "y", smooth = true, className, children, style, ...rest },
  forwardedRef,
) {
  const reduce = useReducedMotion();
  const innerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

  const { scrollYProgress } = useScroll({
    target: innerRef,
    offset: ["start end", "end start"],
  });

  // Map 0→1 progress to a symmetric pixel offset. 100px * speed gives a
  // perceptible-but-tasteful drift across the element's full traversal.
  const range = 100 * speed;
  const raw = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const smoothed = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });
  const value = smooth ? smoothed : raw;

  if (reduce) {
    return (
      <div ref={innerRef} className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={innerRef}
      className={cn("will-change-transform", className)}
      style={{ ...style, [axis]: value }}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
});
