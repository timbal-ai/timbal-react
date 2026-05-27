/**
 * Motion easings + variants for the floating studio sidebar.
 *
 * Width transitions use short tweens (not springs) — springs on width
 * feel rubbery when the panel grows ~170px. Entries fade out before the
 * panel shrinks and fade back in mid-expand for a calm, deliberate read.
 *
 * Pixel sizes used by `motion.animate` live in [./tokens.ts](./tokens.ts);
 * this module owns only timing and variants.
 */

import type { Transition, Variants } from "motion/react";

/** Decelerate — elements arriving on screen (Material standard). */
export const STUDIO_SIDEBAR_EASE_ENTER = [0, 0, 0.2, 1] as const;
/** Accelerate — elements leaving (NN/g: exits feel responsive). */
export const STUDIO_SIDEBAR_EASE_EXIT = [0.4, 0, 1, 1] as const;
/** Shared panel / shell inset curve. */
export const STUDIO_SIDEBAR_EASE = [0.16, 1, 0.3, 1] as const;

export const STUDIO_SIDEBAR_ENTRIES_OUT_S = 0.1;
export const STUDIO_SIDEBAR_WIDTH_S = 0.17;
export const STUDIO_SIDEBAR_ENTRY_ITEM_IN_S = 0.18;
export const STUDIO_SIDEBAR_STAGGER_S = 0.03;
export const STUDIO_SIDEBAR_EXPAND_REVEAL_FRAC = 0.5;

/** Subtle horizontal nudge while options hide (GPU transform, not blur). */
export const STUDIO_SIDEBAR_CONTENT_NUDGE_PX = 6;

export const studioSidebarEntriesContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: STUDIO_SIDEBAR_ENTRIES_OUT_S,
      ease: STUDIO_SIDEBAR_EASE_EXIT,
      staggerChildren: 0,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.06,
      ease: STUDIO_SIDEBAR_EASE_ENTER,
      staggerChildren: STUDIO_SIDEBAR_STAGGER_S,
      delayChildren: 0.02,
    },
  },
};

export const studioSidebarEntryItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -STUDIO_SIDEBAR_CONTENT_NUDGE_PX,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: STUDIO_SIDEBAR_ENTRY_ITEM_IN_S,
      ease: STUDIO_SIDEBAR_EASE_ENTER,
    },
  },
};

export function studioSidebarEntriesTransition(
  visible: boolean,
  reduced: boolean,
): Transition {
  if (reduced) return { duration: 0.01 };
  return visible
    ? { duration: 0.06, ease: STUDIO_SIDEBAR_EASE_ENTER }
    : { duration: STUDIO_SIDEBAR_ENTRIES_OUT_S, ease: STUDIO_SIDEBAR_EASE_EXIT };
}

export type StudioSidebarWidthDirection = "expand" | "collapse";

export function studioSidebarWidthTransition(
  reduced: boolean,
  direction: StudioSidebarWidthDirection = "collapse",
): Transition {
  if (reduced) return { duration: 0.01 };
  return {
    duration:
      direction === "expand"
        ? STUDIO_SIDEBAR_WIDTH_S
        : STUDIO_SIDEBAR_WIDTH_S * 0.94,
    ease:
      direction === "expand"
        ? STUDIO_SIDEBAR_EASE_ENTER
        : STUDIO_SIDEBAR_EASE_EXIT,
  };
}

export function studioSidebarDrawerTransition(reduced: boolean): Transition {
  if (reduced) return { duration: 0.01 };
  return {
    duration: 0.22,
    ease: STUDIO_SIDEBAR_EASE,
  };
}

export function studioSidebarBackdropTransition(reduced: boolean): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.16, ease: STUDIO_SIDEBAR_EASE_EXIT };
}
