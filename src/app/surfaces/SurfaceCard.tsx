"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";
import { useAppDensityClass } from "../layout/app-density-context";

export type SurfaceCardVariant = 
  | "default" 
  | "muted" 
  | "outline" 
  | "elevated" 
  | "flat" 
  | "hierarchical";

export type SurfaceCardTone =
  | "default"
  | "primary"
  | "success"
  | "warn"
  | "danger";

/** Surface chrome — overrides the default elevated gradient where needed. */
const surfaceVariantClass: Record<SurfaceCardVariant, string> = {
  default: "",
  muted: "bg-none bg-muted/40 shadow-none border border-border/20",
  outline: "bg-none bg-transparent border border-border shadow-none",
  elevated: "shadow-card-elevated border border-border/80",
  flat: "bg-card/70 border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_10px_15px_-3px_rgba(0,0,0,0.01)] dark:bg-card/40",
  hierarchical: "bg-card/90 border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.01)] rounded-2xl dark:bg-card/50",
};

/** Accent ring — a deliberate hue without recoloring the whole surface. */
const surfaceToneClass: Record<SurfaceCardTone, string> = {
  default: "",
  primary: "ring-1 ring-inset ring-primary/25",
  success: "ring-1 ring-inset ring-emerald-500/25",
  warn: "ring-1 ring-inset ring-amber-500/30",
  danger: "ring-1 ring-inset ring-destructive/25",
};

export interface SurfaceCardProps {
  children: ReactNode;
  /** Surface chrome. Default `"default"` (elevated gradient). */
  variant?: SurfaceCardVariant;
  /** Accent ring tint. Default `"default"` (none). */
  tone?: SurfaceCardTone;
  /** Makes the card interactive with hover/active transitions. Defaults to true if onClick is provided. */
  hoverable?: boolean;
  /** Callback for when the card is clicked. Renders as a button when provided. */
  onClick?: () => void;
  /** Accessible name for the interactive button. */
  ariaLabel?: string;
  className?: string;
}

export const SurfaceCard: FC<SurfaceCardProps> = ({
  children,
  variant = "default",
  tone = "default",
  hoverable,
  onClick,
  ariaLabel,
  className,
}) => {
  const surfaceCardClass = useAppDensityClass("surfaceCard");
  const isInteractive = Boolean(onClick);
  const shouldHover = hoverable ?? isInteractive;

  const baseClass = cn(
    "aui-app-surface-card",
    surfaceCardClass,
    surfaceVariantClass[variant],
    surfaceToneClass[tone],
    shouldHover && "transition-all duration-200 hover:border-border/80 hover:shadow-md",
    isInteractive && "cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={baseClass}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={baseClass}>
      {children}
    </div>
  );
};
