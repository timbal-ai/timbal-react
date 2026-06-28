"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { cn } from "../utils";

export type BannerTone = "default" | "primary" | "success" | "warn" | "danger";
export type BannerVariant = "soft" | "solid" | "outline";
export type BannerSize = "sm" | "default";

/** Soft tint — the default, readable on the page background. */
const bannerSoftClass: Record<BannerTone, string> = {
  default: "border-border/50 bg-muted/30 text-foreground/90 dark:bg-muted/15",
  primary: "border-primary/15 bg-primary/5 text-primary-800 dark:text-primary-200 [&_[data-banner-icon]]:text-primary",
  success:
    "border-emerald-500/15 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 [&_[data-banner-icon]]:text-emerald-600 dark:[&_[data-banner-icon]]:text-emerald-400",
  warn: "border-amber-500/15 bg-amber-500/5 text-amber-800 dark:text-amber-300 [&_[data-banner-icon]]:text-amber-600 dark:[&_[data-banner-icon]]:text-amber-400",
  danger:
    "border-destructive/15 bg-destructive/5 text-destructive dark:text-red-300 [&_[data-banner-icon]]:text-destructive",
};

/** Solid fill — high-emphasis announcement; text inherits the contrast color. */
const bannerSolidClass: Record<BannerTone, string> = {
  default: "border-transparent bg-foreground text-background shadow-sm",
  primary: "border-transparent bg-gradient-to-r from-primary to-primary/95 text-primary-foreground shadow-sm shadow-primary/5",
  success: "border-transparent bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm shadow-emerald-500/5 dark:from-emerald-500 dark:to-emerald-400",
  warn: "border-transparent bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-sm shadow-amber-500/5 dark:from-amber-500 dark:to-amber-400",
  danger: "border-transparent bg-gradient-to-r from-destructive to-destructive/95 text-destructive-foreground shadow-sm shadow-destructive/5",
};

/** Outline — transparent surface, colored hairline + icon. */
const bannerOutlineClass: Record<BannerTone, string> = {
  default: "border-border/80 bg-background/50 text-foreground/90 backdrop-blur-sm shadow-sm",
  primary:
    "border-primary/30 bg-primary/[0.02] text-foreground [&_[data-banner-icon]]:text-primary shadow-sm",
  success:
    "border-emerald-500/30 bg-emerald-500/[0.02] text-foreground [&_[data-banner-icon]]:text-emerald-600 dark:[&_[data-banner-icon]]:text-emerald-400 shadow-sm",
  warn:
    "border-amber-500/30 bg-amber-500/[0.02] text-foreground [&_[data-banner-icon]]:text-amber-600 dark:[&_[data-banner-icon]]:text-amber-400 shadow-sm",
  danger:
    "border-destructive/30 bg-destructive/[0.02] text-foreground [&_[data-banner-icon]]:text-destructive shadow-sm",
};

const bannerVariantClass: Record<BannerVariant, Record<BannerTone, string>> = {
  soft: bannerSoftClass,
  solid: bannerSolidClass,
  outline: bannerOutlineClass,
};

const bannerSizeClass: Record<BannerSize, string> = {
  sm: "gap-2.5 px-3.5 py-2 text-xs",
  default: "gap-3 px-4 py-3 text-sm",
};

export interface BannerProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: BannerTone;
  /** Emphasis. Default `"soft"`. */
  variant?: BannerVariant;
  /** Size. Default `"default"`. */
  size?: BannerSize;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  /** Right-aligned actions (buttons, links). */
  actions?: React.ReactNode;
  /** Show a dismiss button; fires `onDismiss`. */
  onDismiss?: () => void;
}

/**
 * Page-level announcement bar — a full-width, dismissible notice with a tone, an
 * optional leading icon, message, and trailing actions. For in-flow form/field
 * messages use `Alert` instead.
 */
function Banner({
  tone = "default",
  variant = "soft",
  size = "default",
  icon,
  title,
  actions,
  onDismiss,
  className,
  children,
  ...props
}: BannerProps) {
  const isSolid = variant === "solid";
  const isSingleLine = !title;

  return (
    <div
      data-slot="banner"
      data-variant={variant}
      role="status"
      className={cn(
        "flex w-full rounded-xl border transition-all duration-200",
        isSingleLine ? "items-center" : "items-start",
        bannerSizeClass[size],
        bannerVariantClass[variant][tone],
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          data-banner-icon
          className={cn(
            "shrink-0 [&_svg]:size-4",
            isSingleLine ? "self-center" : "mt-0.5",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium tracking-tight">{title}</p> : null}
        {children ? (
          <div
            className={cn(
              isSolid ? "opacity-90" : "text-muted-foreground",
              title && "mt-0.5",
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={cn(
            "-mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
            isSingleLine ? "self-center" : "-mt-0.5",
            isSolid
              ? "opacity-80 hover:bg-background/15 hover:opacity-100"
              : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          )}
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export { Banner };
