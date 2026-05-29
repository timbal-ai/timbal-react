"use client";

import { type FC, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../utils";
import {
  studioSidebarEntriesContainerVariants,
  studioSidebarEntriesTransition,
} from "../../design/sidebar-motion";

interface StudioSidebarEntriesProps {
  visible: boolean;
  onBlurOutComplete: () => void;
  children: ReactNode;
  className?: string;
}

/** Orchestrates nav + footer fade — fast uniform exit, staggered enter. */
export const StudioSidebarEntries: FC<StudioSidebarEntriesProps> = ({
  visible,
  onBlurOutComplete,
  children,
  className,
}) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return visible ? (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {children}
      </div>
    ) : null;
  }

  return (
    <motion.div
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      initial={false}
      variants={studioSidebarEntriesContainerVariants}
      animate={visible ? "visible" : "hidden"}
      transition={studioSidebarEntriesTransition(visible, false)}
      onAnimationComplete={(definition) => {
        if (definition === "hidden") {
          onBlurOutComplete();
        }
      }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
    >
      {children}
    </motion.div>
  );
};
