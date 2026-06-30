"use client";

import { type FC, useCallback, useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "../../utils";
import {
  studioTopbarIconPillClass,
  studioTopbarPillHeightClass,
} from "../../design/classes";
import { STORAGE_KEYS } from "../../design/tokens";
import { Button } from "../../ui/button";

type StoredTheme = "light" | "dark";

function readStoredTheme(): StoredTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.theme);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: StoredTheme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // private mode / quota — still toggle the class for this session
  }
}

function applyDarkClass(isDark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

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
 * 2. Omit both. The toggle reads/writes `.dark` on `<html>` and persists
 *    the choice to `localStorage` under `STORAGE_KEYS.theme`. For SSR or
 *    zero flash on first paint, mirror that key in a blocking `<script>` in
 *    `index.html` before your bundle loads.
 */
export const ModeToggle: FC<ModeToggleProps> = ({
  theme,
  setTheme,
  className,
  label = "Toggle theme",
}) => {
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);

  useLayoutEffect(() => {
    if (isControlled) return;

    const stored = readStoredTheme();
    if (stored) {
      const isDark = stored === "dark";
      applyDarkClass(isDark);
      setInternalIsDark(isDark);
      return;
    }

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

    const isDarkNext = next === "dark";
    applyDarkClass(isDarkNext);
    writeStoredTheme(isDarkNext ? "dark" : "light");
    setInternalIsDark(isDarkNext);
  }, [isDark, setTheme]);

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      shape="pill"
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
    </Button>
  );
};
