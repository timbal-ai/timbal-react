"use client";

import { type FC } from "react";

import { cn } from "../../utils";
import { Button } from "../../ui/button";
import { MetricTile } from "../data/MetricTile";
import {
  TIMBAL_THEME_PRESETS,
  type TimbalThemePresetId,
} from "../../design/theme-presets";
import { TimbalThemeStyle } from "./TimbalThemeStyle";

export interface ThemePresetGalleryProps {
  /** Currently selected preset id (controlled). */
  value?: TimbalThemePresetId;
  /** Called when the user picks a preset. */
  onSelect?: (id: TimbalThemePresetId) => void;
  /** Restrict the catalog to a subset of presets. */
  presets?: readonly TimbalThemePresetId[];
  className?: string;
}

/**
 * Preview + pick a brand preset. Each card renders a *real* mini fixture
 * (a primary button + a metric tile + a token strip) scoped via
 * `data-timbal-theme`, so several presets preview side-by-side without
 * changing the live app — the host applies the choice on `onSelect`
 * (e.g. via `applyThemePreset`).
 */
export const ThemePresetGallery: FC<ThemePresetGalleryProps> = ({
  value,
  onSelect,
  presets,
  className,
}) => {
  const items = presets
    ? TIMBAL_THEME_PRESETS.filter((p) => presets.includes(p.id))
    : TIMBAL_THEME_PRESETS;

  return (
    <div
      role="radiogroup"
      aria-label="Theme presets"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((preset) => {
        const selected = value === preset.id;
        return (
          <div key={preset.id} data-timbal-theme={preset.id}>
            {/* Scope the preset's tokens to this card only. */}
            <TimbalThemeStyle preset={preset.id} scope={preset.id} />
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${preset.label} theme`}
              onClick={() => onSelect?.(preset.id)}
              className={cn(
                "group flex w-full flex-col gap-3 rounded-xl border bg-card p-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ background: preset.swatch }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {preset.label}
                  </span>
                </span>
                {selected ? (
                  <span className="text-xs font-medium text-primary">
                    Selected
                  </span>
                ) : null}
              </div>

              <p className="text-xs leading-snug text-muted-foreground">
                {preset.description}
              </p>

              {preset.font ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Aa · {preset.font}
                </span>
              ) : null}

              {/* Real-component preview using this preset's scoped tokens. */}
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2">
                <div className="flex items-center gap-2">
                  <Button size="xs" className="pointer-events-none">
                    Primary
                  </Button>
                  <span className="size-5 rounded-md bg-primary" aria-hidden />
                  <span className="size-5 rounded-md bg-muted" aria-hidden />
                  <span
                    className="size-5 rounded-md border border-border bg-accent"
                    aria-hidden
                  />
                </div>
                <MetricTile label="Active users" value="1,248" trend="+8%" />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
