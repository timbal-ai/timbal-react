"use client";

import { type FC } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";
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
 * Minimal headless workforce picker — wraps a styled native `<select>` so
 * `timbal-react` doesn't need a Radix dropdown dependency. Apps that want a
 * richer UI (search, descriptions) can build their own using
 * `useWorkforces()`.
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
    <div className={cn("aui-workforce-selector relative inline-flex items-center", className)}>
      <select
        className="aui-workforce-selector-input h-7 cursor-pointer appearance-none rounded-md border-none bg-transparent pr-5 pl-1.5 text-xs font-medium text-muted-foreground shadow-none outline-none ring-0 transition-colors hover:text-foreground focus:ring-0"
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
      <ChevronDownIcon className="aui-workforce-selector-icon pointer-events-none absolute right-1 size-3 text-muted-foreground" />
    </div>
  );
};

function idOf(item: WorkforceItem): string {
  return item.id ?? item.uid ?? item.name ?? "";
}
