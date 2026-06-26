"use client";

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";

export interface DescriptionItem {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  /** Stack label above value instead of two columns. */
  stacked?: boolean;
  className?: string;
}

/** Read-only key/value metadata list (resource details, settings summaries). */
export const DescriptionList: FC<DescriptionListProps> = ({
  items,
  stacked = false,
  className,
}) => (
  <dl
    className={cn(
      "divide-y divide-border rounded-xl border border-border bg-card",
      className,
    )}
  >
    {items.map((item, i) => (
      <div
        key={i}
        className={cn(
          "px-4 py-3",
          stacked
            ? "flex flex-col gap-0.5"
            : "flex items-center justify-between gap-4",
          item.className,
        )}
      >
        <dt className={cn("text-sm text-muted-foreground", item.labelClassName)}>
          {item.label}
        </dt>
        <dd
          className={cn(
            "text-sm text-foreground",
            !stacked && "text-right tabular-nums",
            item.valueClassName,
          )}
        >
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);
