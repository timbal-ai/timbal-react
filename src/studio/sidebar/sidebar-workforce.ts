import type { ReactNode } from "react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";

/**
 * A sidebar nav entry. A `WorkforceItem` plus an **optional** leading `icon`
 * (e.g. a lucide glyph for a route: Dashboard, Inbox, Settings). The icon is
 * purely additive — existing `WorkforceItem[]` callers keep working unchanged.
 *
 * Use this when `StudioSidebar` drives app route navigation and you want an
 * icon per item — so you never need to hand-roll a custom nav rail.
 *
 * @example
 * ```tsx
 * import { LayoutDashboard, Inbox, Settings } from "lucide-react";
 *
 * const items: StudioSidebarItem[] = [
 *   { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard /> },
 *   { id: "inbox", name: "Alert inbox", icon: <Inbox /> },
 *   { id: "settings", name: "Settings", icon: <Settings /> },
 * ];
 *
 * <StudioSidebar items={items} selectedId={view} onSelect={setView} />
 * ```
 */
export type StudioSidebarItem = WorkforceItem & { icon?: ReactNode };

/**
 * Stable id for a workforce item — falls back through `uid` and `name` so
 * mock / partial payloads still produce a usable key.
 */
export function workforceItemId(w: WorkforceItem): string {
  return w.id ?? w.uid ?? w.name ?? "";
}

/** Optional leading icon for a nav entry (undefined for plain workforces). */
export function workforceItemIcon(w: WorkforceItem): ReactNode | undefined {
  return (w as StudioSidebarItem).icon;
}

export function workforceItemLabel(w: WorkforceItem): string {
  return w.name ?? workforceItemId(w);
}

/** Single capital letter for collapsed rail badges (avatar fallback). */
export function workforceItemInitial(w: WorkforceItem): string {
  const label = workforceItemLabel(w);
  return label.charAt(0).toUpperCase() || "?";
}
