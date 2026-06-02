"use client";

import { useId, useState, type FC, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "../../utils";

export interface ExpandableSectionProps {
  title: ReactNode;
  /** Leading icon node. */
  icon?: ReactNode;
  /** Small count / badge after the title. */
  count?: ReactNode;
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const Chevron: FC<{ open: boolean }> = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn(
      "size-4 text-muted-foreground transition-transform duration-200",
      open && "rotate-180",
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Collapsible section with an animated body. Controlled or uncontrolled. */
export const ExpandableSection: FC<ExpandableSectionProps> = ({
  title,
  icon,
  count,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
}) => {
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const toggle = () => {
    if (openProp == null) setInternalOpen((o) => !o);
    onOpenChange?.(!open);
  };

  return (
    <div className={cn("border-b border-border last:border-0", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 bg-transparent px-4 py-3 text-left hover:bg-transparent active:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/10"
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          {count != null ? (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {count}
            </span>
          ) : null}
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="body"
            initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-muted/20">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
