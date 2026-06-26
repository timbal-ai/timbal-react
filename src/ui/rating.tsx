"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";

import { cn } from "../utils";

export type RatingTone = "amber" | "primary" | "success" | "warn" | "danger";

export interface RatingProps {
  /** Controlled value (number of filled units). */
  value?: number;
  /** Uncontrolled initial value. Default: `0`. */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Total number of units. Default: `5`. */
  max?: number;
  /** Render-only, no interaction. */
  readOnly?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  /** Fill color for filled units. Default: `"amber"`. */
  tone?: RatingTone;
  /** Accessible group label. Default: `"Rating"`. */
  label?: string;
  className?: string;
}

const sizeClass = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

const ratingFillClass: Record<RatingTone, string> = {
  amber: "fill-amber-400 text-amber-400",
  primary: "fill-primary text-primary",
  success: "fill-emerald-500 text-emerald-500",
  warn: "fill-amber-500 text-amber-500",
  danger: "fill-destructive text-destructive",
};

const ratingEmptyClass = "fill-transparent text-muted-foreground/40";

/**
 * Star rating — interactive (keyboard + hover preview) or read-only. Controlled
 * via `value`/`onChange` or uncontrolled with `defaultValue`.
 */
function Rating({
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  readOnly = false,
  disabled = false,
  size = "md",
  tone = "amber",
  label = "Rating",
  className,
}: RatingProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp! : uncontrolled;
  const [hover, setHover] = React.useState<number | null>(null);

  const interactive = !readOnly && !disabled;
  const shown = hover ?? value;

  const set = (next: number) => {
    if (!interactive) return;
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  };

  if (!interactive) {
    return (
      <span
        data-slot="rating"
        role="img"
        aria-label={`${label}: ${value} of ${max}`}
        className={cn("inline-flex items-center gap-0.5", disabled && "opacity-50", className)}
      >
        {Array.from({ length: max }, (_, i) => (
          <StarIcon
            key={i}
            aria-hidden
            className={cn(
              sizeClass[size],
              i < value ? ratingFillClass[tone] : ratingEmptyClass,
            )}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      data-slot="rating"
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const unit = i + 1;
        const filled = unit <= shown;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={unit === value}
            aria-label={`${unit} ${unit === 1 ? "star" : "stars"}`}
            onClick={() => set(unit === value ? 0 : unit)}
            onMouseEnter={() => setHover(unit)}
            onFocus={() => setHover(unit)}
            onBlur={() => setHover(null)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
          >
            <StarIcon
              className={cn(
                sizeClass[size],
                "transition-colors",
                filled ? ratingFillClass[tone] : ratingEmptyClass,
              )}
            />
          </button>
        );
      })}
    </span>
  );
}

export { Rating };
