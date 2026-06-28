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
  | "destructive-solid"
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
  xs: "min-h-7 h-7",
  sm: "min-h-8 h-8",
  md: "min-h-9 h-9",
  lg: "min-h-10 h-10",
};

export const TIMBAL_V2_SIZE_ICON: Record<TimbalV2Size, string> = {
  xs: "min-h-7 min-w-7 size-7",
  sm: "min-h-8 min-w-8 size-8",
  md: "min-h-9 min-w-9 size-9",
  lg: "min-h-10 min-w-10 size-10",
};

export const TIMBAL_V2_SIZE_LABEL_PX: Record<TimbalV2Size, string> = {
  xs: "px-2.5",
  sm: "px-3",
  md: "px-3.5",
  lg: "px-4.5",
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
  "destructive-solid": [
    "bg-gradient-to-b from-destructive-solid-from to-destructive-solid-to",
    "group-hover/tbv2:from-destructive-solid-hover-from group-hover/tbv2:to-destructive-solid-hover-to",
    "group-active/tbv2:from-destructive-solid-active-from group-active/tbv2:to-destructive-solid-active-to",
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
  "destructive-solid": "text-destructive-foreground",
  secondary: "text-foreground",
  ghost: "text-foreground",
  link: "text-foreground underline decoration-foreground/25 underline-offset-2 group-hover/tbv2:decoration-foreground/45",
};

export const TIMBAL_V2_BORDER: Record<TimbalV2Variant, string> = {
  primary: "",
  informative: "border border-foreground/15",
  destructive: "border border-destructive/45",
  "destructive-solid": "",
  secondary: "border border-border",
  ghost: "",
  link: "",
};

export const TIMBAL_V2_SHADOW: Record<TimbalV2Variant, string> = {
  primary: "shadow-card",
  informative: "shadow-card",
  destructive: "shadow-card",
  "destructive-solid": "shadow-card",
  secondary: "shadow-card",
  ghost: "",
  link: "",
};

/** Primary chrome without interaction states — matches default `Button` fill + shadow + border. */
export const TIMBAL_V2_PRIMARY_SURFACE = cn(
  TIMBAL_V2_PRIMARY_GRADIENT,
  TIMBAL_V2_SHADOW.primary,
  TIMBAL_V2_BORDER.primary,
);

/**
 * Primary pill shell — same root chrome as `TimbalV2Button` (border, shadow, overflow).
 * Pair with {@link TIMBAL_V2_PRIMARY_PILL_FILL_LAYER} + {@link TIMBAL_V2_LABEL}.primary.
 */
export const TIMBAL_V2_PRIMARY_PILL_ROOT = cn(
  "relative box-border inline-flex items-center justify-center overflow-hidden rounded-full border-0 bg-transparent p-0 font-normal shadow-none transition duration-200 ease-in-out",
  TIMBAL_V2_SHADOW.primary,
  TIMBAL_V2_BORDER.primary,
);

/** Absolute fill layer for primary pills (avatar, icon button) — rest + hover/active like `TIMBAL_V2_FILL`.primary. */
export const TIMBAL_V2_PRIMARY_PILL_FILL_LAYER = cn(
  "pointer-events-none absolute inset-0 transition duration-200 ease-in-out",
  "bg-gradient-to-b from-primary-fill-from to-primary-fill-to",
  "group-hover/avatar:from-primary-fill-hover-from group-hover/avatar:to-primary-fill-hover-to",
  "group-active/avatar:from-primary-fill-active-from group-active/avatar:to-primary-fill-active-to",
);

/**
 * Secondary pill shell — same as `Button variant="secondary"` / catalog “Action” buttons.
 * Pair with {@link TIMBAL_V2_SECONDARY_PILL_FILL_LAYER} + {@link TIMBAL_V2_LABEL}.secondary.
 */
export const TIMBAL_V2_SECONDARY_PILL_ROOT = cn(
  "relative box-border inline-flex items-center justify-center overflow-hidden rounded-full bg-transparent p-0 font-normal shadow-none transition duration-200 ease-in-out",
  TIMBAL_V2_SHADOW.secondary,
  TIMBAL_V2_BORDER.secondary,
);

/** Absolute fill layer for secondary pills — elevated gradient + hover/active like `TIMBAL_V2_FILL`.secondary. */
export const TIMBAL_V2_SECONDARY_PILL_FILL_LAYER = cn(
  "pointer-events-none absolute inset-0 transition duration-200 ease-in-out",
  TIMBAL_V2_ELEVATED_GRADIENT,
  "group-hover/avatar:from-secondary-fill-hover-from group-hover/avatar:to-secondary-fill-hover-to",
  "group-active/avatar:from-secondary-fill-active-from group-active/avatar:to-secondary-fill-active-to",
);

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

/**
 * Elevated card/list surface — same look as secondary chrome without hover/active
 * fill shifts (integration catalog cards, connection lists).
 */
export const TIMBAL_V2_ELEVATED_SURFACE = cn(
  TIMBAL_V2_ELEVATED_GRADIENT,
  "border border-border shadow-card",
);

/** Interactive secondary chrome for native controls beside v2 buttons (selects, search inputs). */
export const TIMBAL_V2_SECONDARY_CHROME = [
  TIMBAL_V2_ELEVATED_GRADIENT,
  "border border-border shadow-card",
  "transition-[background-color,box-shadow,border-color] duration-200 ease-in-out",
  "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
  "active:from-secondary-fill-active-from active:to-secondary-fill-active-to",
].join(" ");

/**
 * Logo / integration mark tiles — pinned to the light plate in both themes so
 * dark provider logos stay legible (matches timbal-platform `TIMBAL_V2_LOGO_TILE_CLASS`).
 */
export const TIMBAL_V2_LOGO_TILE = cn(
  "bg-gradient-to-b from-white to-neutral-100",
  "border border-neutral-200",
  "shadow-[0_1px_2px_-0.5px_rgba(0,0,0,0.08)]",
);
