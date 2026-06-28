import * as React from "react";

import { cn } from "../utils";

type TimelineTone = "default" | "primary" | "success" | "warn" | "danger";

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned timestamp / meta. */
  meta?: React.ReactNode;
  tone?: TimelineTone;
  /** Custom node inside the marker (e.g. an icon). */
  icon?: React.ReactNode;
}

export type TimelineSize = "sm" | "default";

export interface TimelineProps extends Omit<React.ComponentProps<"ol">, "children"> {
  items: TimelineItem[];
  /** Vertical rhythm between entries. Default `"default"`. */
  size?: TimelineSize;
}

const timelineRowGap: Record<TimelineSize, string> = {
  sm: "pb-4",
  default: "pb-6",
};

const toneStyles: Record<TimelineTone, { border: string; dot: string; icon?: string }> = {
  default: {
    border: "border-neutral-300 dark:border-neutral-700",
    dot: "bg-neutral-400 dark:bg-neutral-500",
    icon: "text-neutral-500 dark:text-neutral-400",
  },
  primary: {
    border: "border-primary/50 dark:border-primary/40",
    dot: "bg-primary",
    icon: "text-primary",
  },
  success: {
    border: "border-emerald-500/40 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: "text-emerald-500",
  },
  warn: {
    border: "border-amber-500/40 dark:border-amber-500/30",
    dot: "bg-amber-500",
    icon: "text-amber-500",
  },
  danger: {
    border: "border-destructive/40 dark:border-destructive/30",
    dot: "bg-destructive",
    icon: "text-destructive",
  },
};

/**
 * Vertical event log — a marker rail with a title, optional description, and
 * trailing meta per entry. Presentational; pass already-formatted timestamps.
 */
function Timeline({ items, size = "default", className, ...props }: TimelineProps) {
  return (
    <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const tone = item.tone ?? "default";
        const styles = toneStyles[tone];

        return (
          <li
            key={item.id}
            className={cn("relative flex gap-3.5 last:pb-0", timelineRowGap[size])}
          >
            {/* Connector line (drawn relative to the li container to cross item padding seamlessly) */}
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-2.5 bottom-0 w-[1.5px] -translate-x-1/2 bg-neutral-200 dark:bg-neutral-800",
                  item.icon ? "top-6" : "top-3"
                )}
              />
            ) : null}

            {/* Left rail column container for dot */}
            <div className="relative flex w-5 shrink-0 justify-center pt-0.5">
              {/* Marker Dot / Icon */}
              <span
                className={cn(
                  "relative z-10 flex shrink-0 items-center justify-center rounded-full border-[1.5px] bg-background transition-colors",
                  styles.border,
                  item.icon ? "size-6" : "size-4"
                )}
              >
                {item.icon ? (
                  <div className={cn("text-xs", styles.icon)}>
                    {item.icon}
                  </div>
                ) : (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      styles.dot
                    )}
                  />
                )}
              </span>
            </div>

            {/* Right content column */}
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-normal text-foreground">{item.title}</p>
                {item.meta ? (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {item.meta}
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { Timeline };
