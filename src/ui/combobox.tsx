import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { controlClass, type ControlSize } from "../design/control-surface";
import { cn } from "../utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

/** Searchable select — `Popover` (`variant="list"`) + `Command`. */
function Combobox({
  ...props
}: React.ComponentProps<typeof Popover>) {
  return <Popover data-slot="combobox" {...props} />;
}

function ComboboxTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof PopoverTrigger> & {
  size?: ControlSize;
}) {
  return (
    <PopoverTrigger
      data-slot="combobox-trigger"
      className={cn(
        controlClass({ size }),
        "flex w-full items-center justify-between gap-2 whitespace-nowrap font-normal",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  );
}

function ComboboxAnchor({
  ...props
}: React.ComponentProps<typeof PopoverAnchor>) {
  return <PopoverAnchor data-slot="combobox-anchor" {...props} />;
}

function ComboboxContent({
  className,
  align = "start",
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      variant="list"
      align={align}
      className={cn(
        "w-[var(--radix-popover-trigger-width)] min-w-[8rem] p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxCommand({
  className,
  ...props
}: React.ComponentProps<typeof Command>) {
  return (
    <Command
      data-slot="combobox-command"
      className={className}
      {...props}
    />
  );
}

function ComboboxInput({
  ...props
}: React.ComponentProps<typeof CommandInput>) {
  return <CommandInput data-slot="combobox-input" {...props} />;
}

function ComboboxList({
  ...props
}: React.ComponentProps<typeof CommandList>) {
  return <CommandList data-slot="combobox-list" {...props} />;
}

function ComboboxEmpty({
  ...props
}: React.ComponentProps<typeof CommandEmpty>) {
  return <CommandEmpty data-slot="combobox-empty" {...props} />;
}

function ComboboxGroup({
  ...props
}: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="combobox-group" {...props} />;
}

function ComboboxItem({
  ...props
}: React.ComponentProps<typeof CommandItem>) {
  return <CommandItem data-slot="combobox-item" {...props} />;
}

function ComboboxSeparator({
  ...props
}: React.ComponentProps<typeof CommandSeparator>) {
  return <CommandSeparator data-slot="combobox-separator" {...props} />;
}

function ComboboxShortcut({
  ...props
}: React.ComponentProps<typeof CommandShortcut>) {
  return <CommandShortcut data-slot="combobox-shortcut" {...props} />;
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxAnchor,
  ComboboxContent,
  ComboboxCommand,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxSeparator,
  ComboboxShortcut,
};
