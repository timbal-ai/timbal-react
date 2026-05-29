"use client";

import { type FC, useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "../../utils";
import {
  studioTopbarIconPillClass,
  studioTopbarPillHeightClass,
} from "../../design/classes";
import { TimbalV2Button } from "../../ui/timbal-v2-button";

export type ModeToggleTheme = "light" | "dark" | "system";

export interface ModeToggleProps {
  /**
   * Current theme. When omitted, the toggle reads from / writes to the
   * `.dark` class on `<html>` directly — useful for apps that don't have
   * a theme manager yet.
   */
  theme?: ModeToggleTheme | string;
  /** Called when the user clicks the toggle. */
  setTheme?: (theme: ModeToggleTheme) => void;
  className?: string;
  /** ARIA label / tooltip. Default: "Toggle theme". */
  label?: string;
}

/**
 * Sun/moon theme toggle styled to sit in the studio top bar.
 *
 * Two integration modes:
 *
 * 1. Pass `theme` + `setTheme` (e.g. from `next-themes`'s `useTheme`).
 *    The component is then fully controlled.
 * 2. Omit both. The toggle reads the current state from `.dark` on
 *    `<html>` and flips it on click. Good enough for prototypes and
 *    cases where there is no theme manager.
 */
export const ModeToggle: FC<ModeToggleProps> = ({
  theme,
  setTheme,
  className,
  label = "Toggle theme",
}) => {
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);

  useEffect(() => {
    if (isControlled) return;
    if (typeof document === "undefined") return;
    setInternalIsDark(document.documentElement.classList.contains("dark"));
  }, [isControlled]);

  const isDark = isControlled
    ? theme === "dark"
    : internalIsDark;

  const onClick = useCallback(() => {
    const next: ModeToggleTheme = isDark ? "light" : "dark";

    if (setTheme) {
      setTheme(next);
      return;
    }

    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", next === "dark");
    setInternalIsDark(next === "dark");
  }, [isDark, setTheme]);

  return (
    <TimbalV2Button
      variant="secondary"
      size="sm"
      isIconOnly
      onClick={onClick}
      className={cn(
        studioTopbarPillHeightClass,
        studioTopbarIconPillClass,
        "relative",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Sun className="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{label}</span>
    </TimbalV2Button>
  );
};
