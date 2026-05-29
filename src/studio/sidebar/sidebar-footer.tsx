"use client";

import { type FC } from "react";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { cn } from "../../utils";
import { useOptionalSession } from "../../auth/provider";
import {
  studioSidebarCollapsedRailChipRowClass,
  studioSidebarCollapsedRailInsetClass,
  studioSidebarNavItemClasses,
} from "./sidebar-layout";
import { StudioSidebarEntryMotion } from "./sidebar-entry-motion";
import { StudioSidebarTooltip } from "./sidebar-tooltip";

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
 * Renders an avatar + sign-out button when a user is authenticated via
 * `SessionProvider`. When session is disabled / no user, shows the
 * `emptyCaption` (or nothing in the collapsed rail).
 */
export const StudioSidebarFooter: FC<StudioSidebarFooterProps> = ({
  iconOnlyLayout,
  showTooltips,
  onSignOut,
  emptyCaption = null,
}) => {
  const session = useOptionalSession();
  const user = session?.user ?? null;

  const handleSignOut = () => {
    session?.logout();
    onSignOut?.();
  };

  return (
    <StudioSidebarEntryMotion>
      <footer
        className={cn(
          "mt-auto w-full shrink-0 py-2.5",
          iconOnlyLayout ? studioSidebarCollapsedRailInsetClass : "px-2.5",
        )}
      >
        {user ? (
          <div className="flex flex-col gap-2">
            {iconOnlyLayout ? (
              <div className={studioSidebarCollapsedRailChipRowClass}>
                <Avatar size="sm" className="size-8">
                  {user.user_photo_url ? (
                    <AvatarImage src={user.user_photo_url} alt={user.user_name} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {userInitials(user.user_name, user.user_email)}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar size="sm">
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
              </div>
            )}
            <div
              className={
                iconOnlyLayout ? studioSidebarCollapsedRailChipRowClass : undefined
              }
            >
              <StudioSidebarTooltip label="Sign out" enabled={showTooltips}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={cn(
                    studioSidebarNavItemClasses(iconOnlyLayout, false),
                    iconOnlyLayout && "inline-flex",
                  )}
                  aria-label="Sign out"
                >
                  <LogOut className="size-3.5 shrink-0" />
                  {!iconOnlyLayout ? "Sign out" : null}
                </button>
              </StudioSidebarTooltip>
            </div>
          </div>
        ) : !iconOnlyLayout && emptyCaption ? (
          <p className="px-1 text-xs text-muted-foreground">{emptyCaption}</p>
        ) : null}
      </footer>
    </StudioSidebarEntryMotion>
  );
};
