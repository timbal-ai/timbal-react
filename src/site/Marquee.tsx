"use client";

import * as React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

import { cn } from "../utils";

export interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Scroll speed in px/second. Default 60. */
  speed?: number;
  /** Travel direction. Default `"left"`. */
  direction?: "left" | "right";
  /** Pause while hovered. Default `true`. */
  pauseOnHover?: boolean;
  /** Gap between the repeated content groups (any CSS length). Default `"3rem"`. */
  gap?: string;
  children?: React.ReactNode;
}

/**
 * Seamless infinite marquee. Duplicates its children and advances a single
 * motion value per frame, wrapping at the content width so there is no visible
 * seam. Frame-rate independent (uses elapsed delta). Renders a static,
 * horizontally-scrollable row under `prefers-reduced-motion`.
 *
 * ```tsx
 * <Marquee speed={40} className="py-6">
 *   {logos.map((l) => <img key={l.id} src={l.src} alt={l.name} className="h-8" />)}
 * </Marquee>
 * ```
 */
export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  { speed = 60, direction = "left", pauseOnHover = true, gap = "3rem", className, children, ...rest },
  ref,
) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const setWidthRef = React.useRef(0);
  const groupRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const measure = () => {
      // One group width + the trailing gap = the wrap distance.
      const gapPx = parseFloat(getComputedStyle(el.parentElement!).columnGap || "0") || 0;
      setWidthRef.current = el.offsetWidth + gapPx;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || paused || setWidthRef.current === 0) return;
    const dir = direction === "left" ? -1 : 1;
    const moveBy = (speed * delta) / 1000;
    let next = x.get() + dir * moveBy;
    const w = setWidthRef.current;
    // Keep `next` within (-w, w) so translate values stay small + seamless.
    if (next <= -w) next += w;
    else if (next >= w) next -= w;
    x.set(next);
  });

  if (reduce) {
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center overflow-x-auto", className)}
        style={{ columnGap: gap }}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("w-full overflow-hidden", className)}
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
      {...rest}
    >
      <motion.div className="flex w-max flex-nowrap items-center" style={{ x, columnGap: gap }}>
        <div ref={groupRef} className="flex flex-nowrap items-center" style={{ columnGap: gap }}>
          {children}
        </div>
        <div className="flex flex-nowrap items-center" style={{ columnGap: gap }} aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
});
