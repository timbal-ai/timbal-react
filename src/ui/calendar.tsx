"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";

import { cn } from "../utils";

/**
 * Calendar — `react-day-picker` v10 on semantic tokens.
 *
 * v10 renders the month as a real `<table>` (weekdays = `<thead>`, week = `<tr>`,
 * day = `<td>`), so we keep the native table layout and size the cells directly
 * instead of forcing flex onto table rows (the previous build mixed v8-era flex
 * classes onto v10's table, which broke alignment). Cells are a roomy `size-10`
 * with spaced rows so the grid reads open rather than condensed.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaults.nav,
        ),
        button_previous: cn(navButtonClass, defaults.button_previous),
        button_next: cn(navButtonClass, defaults.button_next),
        month_caption: cn(
          "flex h-10 items-center justify-center",
          defaults.month_caption,
        ),
        caption_label: cn("text-sm font-semibold", defaults.caption_label),
        dropdowns: cn(
          "flex h-10 items-center justify-center gap-1.5 text-sm font-semibold",
          defaults.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-border focus-within:ring-2 focus-within:ring-foreground/10",
          defaults.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaults.dropdown),
        month_grid: cn("border-separate border-spacing-y-1", defaults.month_grid),
        weekdays: cn(defaults.weekdays),
        weekday: cn(
          "size-10 pb-2 text-xs font-medium text-muted-foreground",
          defaults.weekday,
        ),
        week: cn(defaults.week),
        week_number_header: cn("size-10", defaults.week_number_header),
        week_number: cn(
          "text-xs text-muted-foreground",
          defaults.week_number,
        ),
        day: cn(
          "relative size-10 p-0 text-center text-sm focus-within:relative focus-within:z-10",
          defaults.day,
        ),
        range_start: cn("rounded-l-md", defaults.range_start),
        range_middle: cn("rounded-none", defaults.range_middle),
        range_end: cn("rounded-r-md", defaults.range_end),
        today: cn(
          "[&>button]:font-semibold [&>button:not([data-selected-single=true]):not([data-range-middle=true])]:text-primary",
          defaults.today,
        ),
        outside: cn(
          "text-muted-foreground/60 aria-selected:text-muted-foreground",
          defaults.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon;
          return <Icon className={cn("size-4", chevronClass)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

/** Prev/next month controls — neutral icon buttons sitting over the caption. */
const navButtonClass = cn(
  "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
  "hover:bg-accent hover:text-accent-foreground",
  "disabled:pointer-events-none disabled:opacity-40",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10",
);

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isSingle =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={isSingle || undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={modifiers.range_middle || undefined}
      className={cn(
        "inline-flex size-full items-center justify-center rounded-md text-sm font-normal transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:rounded-l-md data-[range-start=true]:rounded-r-none data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:rounded-r-md data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
