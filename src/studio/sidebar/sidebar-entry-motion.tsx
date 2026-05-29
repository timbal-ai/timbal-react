"use client";

import { type FC, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../utils";
import { studioSidebarEntryItemVariants } from "../../design/sidebar-motion";

interface StudioSidebarEntryMotionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Staggered nav / footer row — transform + opacity only (GPU-friendly).
 * No-op when `prefers-reduced-motion` is on.
 */
export const StudioSidebarEntryMotion: FC<StudioSidebarEntryMotionProps> = ({
  children,
  className,
}) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={studioSidebarEntryItemVariants} className={cn(className)}>
      {children}
    </motion.div>
  );
};
