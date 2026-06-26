"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { cn } from "../utils";
import { SPRING } from "./easing";

export interface MagneticProps extends React.ComponentPropsWithoutRef<"div"> {
  /** How far the element follows the pointer, as a fraction of the cursor offset. Default 0.35. */
  strength?: number;
  /** Max travel in px in any direction (clamps `strength` on large elements). Default 24. */
  max?: number;
  /** Spring feel. Default `"snappy"`. */
  spring?: keyof typeof SPRING;
  children?: React.ReactNode;
}

/**
 * Make a child element drift toward the cursor while hovered, springing back
 * on leave — the classic "magnetic" CTA / nav affordance. Wrap a single
 * interactive child (button, link). No-op under `prefers-reduced-motion`.
 *
 * ```tsx
 * <Magnetic strength={0.4}>
 *   <Button>Shop the drop</Button>
 * </Magnetic>
 * ```
 */
export const Magnetic = React.forwardRef<HTMLDivElement, MagneticProps>(function Magnetic(
  { strength = 0.35, max = 24, spring = "snappy", className, children, ...rest },
  forwardedRef,
) {
  const reduce = useReducedMotion();
  const innerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

  const mvx = useMotionValue(0);
  const mvy = useMotionValue(0);
  const x = useSpring(mvx, SPRING[spring]);
  const y = useSpring(mvy, SPRING[spring]);

  const clamp = (v: number) => Math.max(-max, Math.min(max, v));

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mvx.set(clamp((e.clientX - cx) * strength));
    mvy.set(clamp((e.clientY - cy) * strength));
  }

  function reset() {
    mvx.set(0);
    mvy.set(0);
  }

  if (reduce) {
    return (
      <div ref={innerRef} className={cn("inline-block", className)} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={innerRef}
      className={cn("inline-block", className)}
      style={{ x, y }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
});
