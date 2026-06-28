"use client";

import { type FC, useState, useEffect } from "react";
import { LogOut, Sun, Moon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { cn } from "../../utils";
import { useOptionalSession } from "../../auth/provider";
import {
  studioSidebarCollapsedRailChipRowClass,
  studioSidebarCollapsedRailInsetClass,
} from "./sidebar-layout";
import { StudioSidebarEntryMotion } from "./sidebar-entry-motion";
import { StudioSidebarTooltip } from "./sidebar-tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { STORAGE_KEYS } from "../../design/tokens";

function userInitials(name: string, email: string): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (fromName) return fromName;
  return email.charAt(0).toUpperCase() || "?";
}

interface StudioSidebarFooterProps {
  iconOnlyLayout: boolean;
  showTooltips: boolean;
  /** Called after the session has been cleared (e.g. close the mobile drawer). */
  onSignOut?: () => void;
  /**
   * Fallback caption rendered in expanded view when no user is signed in.
   * Pass `null` to hide it entirely.
   */
  emptyCaption?: string | null;
}

/**
 * Footer for the floating studio sidebar.
 *
 * Renders an avatar with a dropdown menu when a user is authenticated via
 * `SessionProvider`. The dropdown contains theme selection and sign-out.
 * When session is disabled / no user, shows the `emptyCaption` (or nothing in the collapsed rail).
 */
export const StudioSidebarFooter: FC<StudioSidebarFooterProps> = ({
  iconOnlyLayout,
  showTooltips,
  onSignOut,
  emptyCaption = null,
}) => {
  const session = useOptionalSession();
  const user = session?.user ?? null;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Detect initial theme
    const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(document.documentElement.classList.contains("dark"));
    }

    // Set up a MutationObserver to listen to class changes on documentElement
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", nextIsDark);
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEYS.theme, nextIsDark ? "dark" : "light");
      } catch {}
    }
  };

  const handleSignOut = () => {
    session?.logout();
    onSignOut?.();
  };

  const dropdownContent = user ? (
    <DropdownMenuContent
      side={iconOnlyLayout ? "right" : "top"}
      align={iconOnlyLayout ? "end" : "start"}
      className="w-64 z-[70] rounded-2xl border border-white/15 bg-neutral-900/75 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-1.5"
    >
      <DropdownMenuLabel className="font-normal px-2.5 py-2">
        <div className="flex flex-col space-y-1">
          <p className="truncate text-sm font-semibold text-white/90">
            {user.user_name}
          </p>
          <p className="truncate text-xs text-white/50">
            {user.user_email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="-mx-1.5 bg-white/10 my-1" />
      <DropdownMenuItem
        onClick={handleToggleTheme}
        className="cursor-pointer rounded-xl px-2.5 py-2 text-white/85 hover:bg-white/10 focus:bg-white/10 focus:text-white transition-colors gap-3"
      >
        {isDark ? (
          <>
            <Sun className="size-4 shrink-0 text-white/60" />
            <span>Light mode</span>
          </>
        ) : (
          <>
            <Moon className="size-4 shrink-0 text-white/60" />
            <span>Dark mode</span>
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator className="-mx-1.5 bg-white/10 my-1" />
      <DropdownMenuItem
        onClick={handleSignOut}
        className="cursor-pointer rounded-xl px-2.5 py-2 text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-400 transition-colors gap-3"
      >
        <LogOut className="size-4 shrink-0 text-rose-400" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  ) : null;

  return (
    <StudioSidebarEntryMotion>
      <footer
        className={cn(
          "mt-auto w-full shrink-0 py-2.5",
          iconOnlyLayout ? studioSidebarCollapsedRailInsetClass : "px-2.5",
        )}
      >
        {user ? (
          <DropdownMenu>
            <div className={cn(iconOnlyLayout && studioSidebarCollapsedRailChipRowClass)}>
              <StudioSidebarTooltip label={iconOnlyLayout ? user.user_name : "User menu"} enabled={showTooltips}>
                <DropdownMenuTrigger asChild>
                  {iconOnlyLayout ? (
                    <button
                      type="button"
                      className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:bg-accent/50 p-0.5"
                      aria-label="User menu"
                    >
                      <Avatar size="sm" className="size-8">
                        {user.user_photo_url ? (
                          <AvatarImage src={user.user_photo_url} alt={user.user_name} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {userInitials(user.user_name, user.user_email)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full min-w-0 items-center gap-2.5 rounded-lg p-2 hover:bg-accent/50 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors text-left"
                    >
                      <Avatar size="sm" className="shrink-0">
                        {user.user_photo_url ? (
                          <AvatarImage src={user.user_photo_url} alt={user.user_name} />
                        ) : null}
                        <AvatarFallback>
                          {userInitials(user.user_name, user.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.user_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.user_email}
                        </p>
                      </div>
                    </button>
                  )}
                </DropdownMenuTrigger>
              </StudioSidebarTooltip>
            </div>
            {dropdownContent}
          </DropdownMenu>
        ) : !iconOnlyLayout && emptyCaption ? (
          <p className="px-1 text-xs text-muted-foreground">{emptyCaption}</p>
        ) : null}
      </footer>
    </StudioSidebarEntryMotion>
  );
};
