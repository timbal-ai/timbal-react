"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "../utils";
import { DURATION, EASE } from "./easing";

export interface TextRevealProps extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  /** The text to reveal. Plain string only (split into tokens internally). */
  children: string;
  /** Split granularity. `words` (default) animates word-by-word; `lines` splits on `\n`. */
  splitBy?: "words" | "lines";
  /** Seconds between each token's entrance. Default 0.06. */
  stagger?: number;
  /** Seconds before the first token animates. Default 0. */
  delay?: number;
  /** Per-token duration in seconds. Default {@link DURATION.base}. */
  duration?: number;
  /** Replay every time it re-enters the viewport. Default `false`. */
  repeat?: boolean;
  /** Visibility fraction before animating (0–1). Default 0.4. */
  amount?: number;
  /** Render the wrapper as a block-level heading element instead of an inline span. */
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

const tokenVariants: Variants = {
  hidden: { y: "115%" },
  shown: { y: "0%" },
};

/**
 * Reveal text token-by-token with a masked slide-up — the signature
 * editorial/luxury headline entrance. Each word (or line) rides up out of an
 * `overflow-hidden` clip on a stagger. Collapses to static text under
 * `prefers-reduced-motion`.
 *
 * ```tsx
 * <TextReveal as="h1" className="text-6xl font-semibold" stagger={0.08}>
 *   Every step forward
 * </TextReveal>
 * ```
 */
export function TextReveal({
  children,
  splitBy = "words",
  stagger = 0.06,
  delay = 0,
  duration = DURATION.base,
  repeat = false,
  amount = 0.4,
  as = "span",
  className,
  ...rest
}: TextRevealProps) {
  const reduce = useReducedMotion();
  const Tag = as as React.ElementType;

  const tokens = React.useMemo(() => {
    if (splitBy === "lines") return children.split("\n");
    return children.split(/(\s+)/).filter((t) => t.length > 0);
  }, [children, splitBy]);

  if (reduce) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  const containerVariants: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: !repeat, amount }}
      className={cn(as === "span" ? "inline" : "block", className)}
      {...(rest as object)}
    >
      <Tag className={as === "span" ? "inline" : "block"}>
        {tokens.map((token, i) =>
          /^\s+$/.test(token) && splitBy === "words" ? (
            <span key={i}> </span>
          ) : (
            <span
              key={i}
              className={cn(
                "overflow-hidden",
                splitBy === "lines" ? "block" : "inline-block align-bottom",
              )}
            >
              <motion.span
                className="inline-block"
                variants={tokenVariants}
                transition={{ duration, ease: EASE.out }}
              >
                {token}
              </motion.span>
            </span>
          ),
        )}
      </Tag>
    </motion.span>
  );
}
