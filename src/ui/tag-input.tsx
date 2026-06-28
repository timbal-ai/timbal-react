"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { controlSurfaceClass } from "../design/control-surface";
import { cn } from "../utils";

export type TagInputSize = "sm" | "default";

const tagInputSizeClass: Record<TagInputSize, string> = {
  sm: "min-h-8 gap-1 px-1.5 py-0.5",
  default: "min-h-9 gap-1 px-2 py-1",
};

export interface TagInputProps {
  /** Controlled tags. */
  value?: string[];
  /** Uncontrolled initial tags. */
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Keys that commit the current text as a tag. Default: Enter + comma. */
  separators?: string[];
  /** Reject duplicates (case-insensitive). Default: `true`. */
  dedupe?: boolean;
  max?: number;
  disabled?: boolean;
  /** Control height. Default `"default"`. */
  size?: TagInputSize;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Token / chips input on the shared control surface. Commits on Enter or comma,
 * removes the last tag on Backspace when empty, and each chip has its own
 * remove button. Controlled via `value`/`onChange` or uncontrolled.
 */
function TagInput({
  value: valueProp,
  defaultValue = [],
  onChange,
  placeholder,
  separators = ["Enter", ","],
  dedupe = true,
  max,
  disabled,
  size = "default",
  ariaLabel,
  className,
  inputClassName,
}: TagInputProps) {
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue);
  const isControlled = valueProp !== undefined;
  const tags = isControlled ? valueProp! : uncontrolled;
  const [draft, setDraft] = React.useState("");

  const setTags = (next: string[]) => {
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (typeof max === "number" && tags.length >= max) return;
    if (dedupe && tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    setTags([...tags, tag]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (separators.includes(event.key)) {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      removeAt(tags.length - 1);
    }
  };

  return (
    <div
      data-slot="tag-input"
      className={cn(
        controlSurfaceClass,
        "flex w-full flex-wrap items-center rounded-lg",
        tagInputSizeClass[size],
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted py-0.5 pl-2 pr-1 text-xs font-medium text-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => removeAt(index)}
            className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          >
            <XIcon className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        type="text"
        aria-label={ariaLabel ?? placeholder ?? "Add tag"}
        value={draft}
        disabled={disabled}
        placeholder={tags.length === 0 ? placeholder : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        className={cn(
          "min-w-[6rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70",
          inputClassName,
        )}
      />
    </div>
  );
}

export { TagInput };
