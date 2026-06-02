"use client";

import { useEffect, useState, type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "../../ui/button";
import { cn } from "../../utils";

export interface FloatingUnsavedChangesBarProps {
  visible: boolean;
  /** Message on the left (e.g. "Unsaved changes"). */
  message?: ReactNode;
  discardLabel?: ReactNode;
  saveLabel?: ReactNode;
  isSaving?: boolean;
  saveDisabled?: boolean;
  onDiscard?: () => void;
  onSave?: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Viewport-fixed discard/save pill, portaled to `document.body` so parent
 * transforms and overflow scrollers never clip it. Springs in from the bottom.
 */
export const FloatingUnsavedChangesBar: FC<FloatingUnsavedChangesBarProps> = ({
  visible,
  message = "Unsaved changes",
  discardLabel = "Discard",
  saveLabel = "Save changes",
  isSaving = false,
  saveDisabled = false,
  onDiscard,
  onSave,
  ariaLabel = "Unsaved changes",
  className,
}) => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <motion.div
            role="region"
            aria-label={ariaLabel}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "pointer-events-auto inline-flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-border bg-card py-1.5 pl-4 pr-1.5 shadow-card-elevated",
              className,
            )}
          >
            <span className="text-sm text-muted-foreground">{message}</span>
            <span className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
                {discardLabel}
              </Button>
              <Button size="sm" onClick={onSave} disabled={saveDisabled || isSaving}>
                {isSaving ? "Saving…" : saveLabel}
              </Button>
            </span>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};
