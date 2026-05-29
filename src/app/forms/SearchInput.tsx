"use client";

import type { FC, InputHTMLAttributes } from "react";
import { SearchIcon } from "lucide-react";

import { appSearchInputClass } from "../../design/app-classes";
import { cn } from "../../utils";

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SearchInput: FC<SearchInputProps> = ({
  className,
  placeholder = "Search…",
  ...props
}) => {
  return (
    <label
      className={cn(
        "aui-app-search-input inline-flex min-w-[12rem] items-center gap-2",
        appSearchInputClass,
        className,
      )}
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        {...props}
      />
    </label>
  );
};
