import type { WorkforceItem } from "@timbal-ai/timbal-sdk";

/**
 * Stable id for a workforce item — falls back through `uid` and `name` so
 * mock / partial payloads still produce a usable key.
 */
export function workforceItemId(w: WorkforceItem): string {
  return w.id ?? w.uid ?? w.name ?? "";
}

export function workforceItemLabel(w: WorkforceItem): string {
  return w.name ?? workforceItemId(w);
}

/** Single capital letter for collapsed rail badges (avatar fallback). */
export function workforceItemInitial(w: WorkforceItem): string {
  const label = workforceItemLabel(w);
  return label.charAt(0).toUpperCase() || "?";
}
