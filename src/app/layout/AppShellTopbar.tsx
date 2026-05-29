"use client";

import type { FC, ReactNode } from "react";

import { appShellTopbarRowClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface AppShellTopbarProps {
  /** Leading cluster — mobile menu, product mark, org switcher. */
  start?: ReactNode;
  /** Trailing cluster — theme toggle, login, account menu. */
  actions?: ReactNode;
  /** Optional center content between start and actions. */
  children?: ReactNode;
  className?: string;
}

/**
 * Global app chrome row inside `AppShell` — auth, theme, and account actions.
 * Spans the full shell width via the shell’s `topbar` slot (wider than `<Page />`).
 */
export const AppShellTopbar: FC<AppShellTopbarProps> = ({
  start,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn("aui-app-shell-topbar", appShellTopbarRowClass, className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {start}
        {children}
      </div>
      {actions ? (
        <div className="aui-app-shell-topbar-actions flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
};
