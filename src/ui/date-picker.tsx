import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { controlClass } from "../design/control-surface";
import { cn } from "../utils";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

/** Calendar in a popover — compose with `DatePickerTrigger` + `DatePickerCalendar`. */
function DatePicker({
  ...props
}: React.ComponentProps<typeof Popover>) {
  return <Popover data-slot="date-picker" {...props} />;
}

function DatePickerTrigger({
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger data-slot="date-picker-trigger" {...props} />;
}

function DatePickerContent({
  className,
  align = "start",
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="date-picker-content"
      align={align}
      className={cn("w-auto p-0", className)}
      {...props}
    />
  );
}

function DatePickerCalendar({
  className,
  ...props
}: React.ComponentProps<typeof Calendar>) {
  return (
    <Calendar
      data-slot="date-picker-calendar"
      className={cn("rounded-lg border-0", className)}
      {...props}
    />
  );
}

function formatPickerDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Control-surface trigger showing the selected date or placeholder. */
function DatePickerButton({
  date,
  placeholder = "Pick a date",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  date?: Date;
  placeholder?: string;
}) {
  return (
    <button
      type="button"
      data-slot="date-picker-button"
      className={cn(
        controlClass(),
        "flex w-full items-center justify-start gap-2 text-left font-normal",
        !date && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CalendarIcon className="size-4 shrink-0 opacity-70" />
      {date ? formatPickerDate(date) : placeholder}
    </button>
  );
}

export {
  DatePicker,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerCalendar,
  DatePickerButton,
  formatPickerDate,
};
