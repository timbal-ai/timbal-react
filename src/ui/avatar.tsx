"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import {
  TIMBAL_V2_LABEL,
  TIMBAL_V2_SECONDARY_PILL_FILL_LAYER,
  TIMBAL_V2_SECONDARY_PILL_ROOT,
} from "../design/button-tokens";
import { cn } from "../utils";

export type AvatarVariant = "muted" | "secondary" | "primary" | "chart";

/**
 * Action-button chrome for initials — matches `Button variant="secondary"` (elevated
 * gradient, border, shadow, foreground text). `variant="primary"` / `"chart"` use this too.
 */
export const AVATAR_PRIMARY_FALLBACK_CLASS = cn(
  TIMBAL_V2_SECONDARY_PILL_ROOT,
  TIMBAL_V2_LABEL.secondary,
  "font-medium",
);

/** Elevated fill via theme tokens (when Tailwind does not scan linked dist). */
const AVATAR_SECONDARY_FILL_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to bottom, var(--elevated-from), var(--elevated-to))",
};

type AvatarChromeContextValue = {
  chrome: AvatarVariant;
  setChrome: (chrome: AvatarVariant) => void;
};

const AvatarChromeContext = React.createContext<AvatarChromeContextValue | null>(
  null,
);

function useAvatarChrome() {
  return React.useContext(AvatarChromeContext);
}

/** Branded initials — secondary “Action” button look (not dark primary CTA). */
function isBrandedVariant(variant: AvatarVariant) {
  return (
    variant === "secondary" ||
    variant === "primary" ||
    variant === "chart"
  );
}

/**
 * @deprecated Name retained for API stability — returns Action-button (secondary) surface.
 */
export function avatarChartVariantClass(_seed?: string): string {
  return AVATAR_PRIMARY_FALLBACK_CLASS;
}

const AVATAR_SIZE_CLASS = {
  default: "size-7",
  sm: "size-5",
  lg: "size-9",
} as const;

function Avatar({
  className,
  size = "default",
  variant: rootVariant,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: keyof typeof AVATAR_SIZE_CLASS;
  /**
   * `secondary` / `primary` / `chart` — elevated Action-button chrome on the root.
   * Prefer `secondary`; `primary` is an alias for the same look (not dark primary CTA).
   */
  variant?: AvatarVariant;
}) {
  const [chrome, setChrome] = React.useState<AvatarVariant>(rootVariant ?? "muted");

  React.useLayoutEffect(() => {
    if (rootVariant !== undefined) {
      setChrome(rootVariant);
    }
  }, [rootVariant]);

  const branded = isBrandedVariant(chrome);

  return (
    <AvatarChromeContext.Provider value={{ chrome, setChrome }}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        data-variant={branded ? "secondary" : chrome}
        className={cn(
          "group/avatar relative shrink-0 select-none",
          AVATAR_SIZE_CLASS[size],
          branded
            ? TIMBAL_V2_SECONDARY_PILL_ROOT
            : "flex overflow-hidden rounded-full",
          className,
        )}
        {...props}
      >
        {branded ? (
          <span
            aria-hidden
            className={TIMBAL_V2_SECONDARY_PILL_FILL_LAYER}
            style={AVATAR_SECONDARY_FILL_STYLE}
          />
        ) : null}
        {children}
      </AvatarPrimitive.Root>
    </AvatarChromeContext.Provider>
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "relative z-10 aspect-square size-full rounded-full object-cover",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  variant = "muted",
  seed: _seed,
  children,
  style,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  /**
   * `secondary` — Action button look (`Button variant="secondary"`).
   * `primary` / `chart` — same as `secondary` (aliases for prompts).
   */
  variant?: AvatarVariant;
  /** Reserved for API compatibility; color no longer varies by seed. */
  seed?: string;
}) {
  const chromeCtx = useAvatarChrome();

  React.useLayoutEffect(() => {
    chromeCtx?.setChrome(variant);
  }, [chromeCtx, variant]);

  const branded = isBrandedVariant(variant);

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-variant={branded ? "secondary" : variant}
      className={cn(
        "relative z-10 flex size-full items-center justify-center rounded-full",
        branded
          ? cn(
              "bg-transparent font-medium",
              TIMBAL_V2_LABEL.secondary,
              "text-xs group-data-[size=sm]/avatar:text-[10px]",
            )
          : "bg-muted font-normal text-muted-foreground text-xs group-data-[size=sm]/avatar:text-[10px]",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
