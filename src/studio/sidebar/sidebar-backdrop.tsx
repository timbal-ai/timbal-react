"use client";

import { type FC } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { studioSidebarBackdropTransition } from "../../design/sidebar-motion";

interface StudioSidebarBackdropProps {
  open: boolean;
  onClose: () => void;
}

/** Mobile drawer backdrop. */
export const StudioSidebarBackdrop: FC<StudioSidebarBackdropProps> = ({
  open,
  onClose,
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={studioSidebarBackdropTransition(!!reducedMotion)}
          onClick={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
};
