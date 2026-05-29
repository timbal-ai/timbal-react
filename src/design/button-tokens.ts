import { cn } from "../utils";

/**
 * Timbal V2 button design tokens.
 *
 * Mirrors the `timbal-platform` design language (`TimbalV2Button`) so chat
 * surfaces built with the SDK feel identical to the Timbal Studio. Each record
 * is keyed by variant or size and ships only Tailwind utility classes — no
 * runtime JS — so consumers can compose them with `cn(...)` and add their own
 * overrides without ejecting.
 *
 * Every colour is resolved through semantic CSS variables defined in
 * `styles.css`. There are NO hardcoded palette literals — light/dark mode
 * flips by swapping the variable values, not by toggling Tailwind classes.
 */

export type TimbalV2Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "informative"
  | "destructive"
  | "link";

export type TimbalV2Size = "xs" | "sm" | "md" | "lg";

/** Elevated card / secondary chrome gradient — shared by fills, switches, pills. */
export const TIMBAL_V2_ELEVATED_GRADIENT =
  "bg-gradient-to-b from-elevated-from to-elevated-to";

/** Opaque modal/dialog surface — elevated gradient without alpha bleed-through. */
export const TIMBAL_V2_MODAL_SURFACE = cn(
  "bg-gradient-to-b from-modal-from to-modal-to",
  "border border-border shadow-card-elevated",
);

/** Primary pill gradient (static — no hover group). */
export const TIMBAL_V2_PRIMARY_GRADIENT =
  "bg-gradient-to-b from-primary-fill-from to-primary-fill-to";

/** Maps shadcn `Button` variants to v2 fill keys. */
export const TIMBAL_V2_FROM_LEGACY_BUTTON: Record<
  "default" | "destructive" | "outline" | "secondary" | "ghost" | "link",
  TimbalV2Variant
> = {
  default: "primary",
  destructive: "destructive",
  outline: "secondary",
  secondary: "secondary",
  ghost: "ghost",
  link: "link",
};

export const TIMBAL_V2_SIZE_HEIGHT: Record<TimbalV2Size, string> = {
  xs: "min-h-8 h-8",
  sm: "min-h-9 h-9",
  md: "min-h-10 h-10",
  lg: "min-h-11 h-11",
};

export const TIMBAL_V2_SIZE_ICON: Record<TimbalV2Size, string> = {
  xs: "min-h-8 min-w-8 size-8",
  sm: "min-h-8 min-w-8 size-8",
  md: "min-h-10 min-w-10 size-10",
  lg: "min-h-11 min-w-11 size-11",
};

export const TIMBAL_V2_SIZE_LABEL_PX: Record<TimbalV2Size, string> = {
  xs: "px-3",
  sm: "px-4",
  md: "px-5",
  lg: "px-6",
};

/**
 * Absolute gradient fill layer — scoped to the `group/tbv2` group so the
 * hover/active states can be triggered without wrapping each button in
 * dedicated state classes.
 *
 * The fill stops resolve via CSS variables that invert in dark mode, so a
 * "primary" button is dark on light and light on dark without any `dark:`
 * Tailwind variants.
 */
export const TIMBAL_V2_FILL: Record<TimbalV2Variant, string> = {
  primary: [
    "bg-gradient-to-b from-primary-fill-from to-primary-fill-to",
    "group-hover/tbv2:from-primary-fill-hover-from group-hover/tbv2:to-primary-fill-hover-to",
    "group-active/tbv2:from-primary-fill-active-from group-active/tbv2:to-primary-fill-active-to",
  ].join(" "),
  informative: [
    TIMBAL_V2_PRIMARY_GRADIENT,
    "group-hover/tbv2:from-primary-fill-hover-from group-hover/tbv2:to-primary-fill-hover-to",
    "group-active/tbv2:from-primary-fill-active-from group-active/tbv2:to-primary-fill-active-to",
    "group-active/tbv2:[background-image:linear-gradient(to_top,rgba(0,0,0,0.08),transparent_55%)]",
  ].join(" "),
  destructive: [
    TIMBAL_V2_ELEVATED_GRADIENT,
    "group-hover/tbv2:from-destructive-fill-hover-from group-hover/tbv2:to-destructive-fill-hover-to",
    "group-active/tbv2:from-destructive-fill-active-from group-active/tbv2:to-destructive-fill-active-to",
  ].join(" "),
  secondary: [
    TIMBAL_V2_ELEVATED_GRADIENT,
    "group-hover/tbv2:from-secondary-fill-hover-from group-hover/tbv2:to-secondary-fill-hover-to",
    "group-active/tbv2:from-secondary-fill-active-from group-active/tbv2:to-secondary-fill-active-to",
  ].join(" "),
  ghost: [
    "bg-transparent",
    "group-hover/tbv2:bg-ghost-fill-hover",
    "group-active/tbv2:bg-ghost-fill-active",
  ].join(" "),
  link: "bg-transparent",
};

export const TIMBAL_V2_LABEL: Record<TimbalV2Variant, string> = {
  primary: "text-primary-foreground",
  informative: "text-primary-foreground",
  destructive: "text-destructive",
  secondary: "text-foreground",
  ghost: "text-foreground",
  link: "text-foreground underline decoration-foreground/25 underline-offset-2 group-hover/tbv2:decoration-foreground/45",
};

export const TIMBAL_V2_BORDER: Record<TimbalV2Variant, string> = {
  primary: "",
  informative: "border border-foreground/15",
  destructive: "border border-destructive/45",
  secondary: "border border-border",
  ghost: "",
  link: "",
};

export const TIMBAL_V2_SHADOW: Record<TimbalV2Variant, string> = {
  primary: "shadow-card",
  informative: "shadow-card",
  destructive: "shadow-card",
  secondary: "shadow-card",
  ghost: "",
  link: "",
};

/** Switch track (off) — elevated gradient like cards. */
export const TIMBAL_V2_SWITCH_TRACK_OFF = cn(
  TIMBAL_V2_ELEVATED_GRADIENT,
  "border border-border shadow-card",
);

/** Switch thumb — elevated surface (reads as white / soft on dark). */
export const TIMBAL_V2_SWITCH_THUMB = cn(
  TIMBAL_V2_ELEVATED_GRADIENT,
  "border border-border/80 shadow-sm",
);

/** Interactive secondary chrome for native controls beside v2 buttons (selects, search inputs). */
export const TIMBAL_V2_SECONDARY_CHROME = [
  TIMBAL_V2_ELEVATED_GRADIENT,
  "border border-border shadow-card",
  "transition-[background-color,box-shadow,border-color] duration-200 ease-in-out",
  "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
  "active:from-secondary-fill-active-from active:to-secondary-fill-active-to",
].join(" ");
