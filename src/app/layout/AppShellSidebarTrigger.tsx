"use client";

import { MenuIcon } from "lucide-react";
import type { FC } from "react";

import { cn } from "../../utils";
import { useAppShellNav } from "./app-shell-nav-context";

export interface AppShellSidebarTriggerProps {
  /** Accessible label. Default: "Open navigation". */
  label?: string;
  className?: string;
}

/**
 * Hamburger that opens the `AppShell` mobile nav drawer. Hidden on `md+`
 * (the sidebar is persistent there). Drop it in the `AppShell` topbar
 * slot — it reads the shell nav controls, so no wiring is needed.
 */
export const AppShellSidebarTrigger: FC<AppShellSidebarTriggerProps> = ({
  label = "Open navigation",
  className,
}) => {
  const nav = useAppShellNav();
  return (
    <button
      type="button"
      onClick={nav.toggle}
      aria-label={label}
      aria-expanded={nav.open}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground md:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10",
        className,
      )}
    >
      <MenuIcon className="size-5" aria-hidden />
    </button>
  );
};
