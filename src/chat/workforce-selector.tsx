"use client";

import { type FC } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";

import { controlSurfaceClass } from "../design/control-surface";
import { studioTopbarPillHeightClass } from "../design/classes";
import { cn } from "../utils";

export interface WorkforceSelectorProps {
  /** List of workforces to choose from. */
  workforces: WorkforceItem[];
  /** Currently selected workforce id. */
  value: string;
  /** Called when the user picks a different workforce. */
  onChange: (id: string) => void;
  /** Hide the selector when there's only one option. Default: true. */
  hideWhenSingle?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Minimal headless workforce picker. Wraps a styled native `<select>` so
 * the SDK doesn't need to depend on `@radix-ui/react-select`, while still
 * matching the Studio chrome (gradient pill, soft border, chevron).
 *
 * Apps that want a richer UI (search, descriptions, agent icons) can build
 * their own using `useWorkforces()`.
 */
export const WorkforceSelector: FC<WorkforceSelectorProps> = ({
  workforces,
  value,
  onChange,
  hideWhenSingle = true,
  className,
  placeholder = "Select agent",
}) => {
  if (workforces.length === 0) return null;
  if (hideWhenSingle && workforces.length === 1) return null;

  return (
    <div
      className={cn(
        "aui-workforce-selector relative inline-flex items-center",
        controlSurfaceClass,
        studioTopbarPillHeightClass,
        "rounded-full",
        className,
      )}
    >
      <select
        className="aui-workforce-selector-input h-full cursor-pointer appearance-none rounded-full border-none bg-transparent pr-8 pl-3.5 text-sm font-medium text-foreground outline-none focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      >
        {!value && <option value="">{placeholder}</option>}
        {workforces.map((w) => {
          const id = idOf(w);
          return (
            <option key={id} value={id}>
              {w.name ?? id}
            </option>
          );
        })}
      </select>
      <ChevronDownIcon
        className="aui-workforce-selector-icon pointer-events-none absolute right-3 size-3.5 text-muted-foreground/70"
        aria-hidden
      />
    </div>
  );
};

function idOf(item: WorkforceItem): string {
  return item.id ?? item.uid ?? item.name ?? "";
}
