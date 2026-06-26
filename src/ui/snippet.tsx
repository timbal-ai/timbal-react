import * as React from "react";

import { cn } from "../utils";
import { CopyButton } from "./copy-button";

export type SnippetVariant = "muted" | "outline" | "ghost";
export type SnippetSize = "sm" | "default";

const snippetVariantClass: Record<SnippetVariant, string> = {
  muted: "border-border bg-muted/40",
  outline: "border-border bg-transparent",
  ghost: "border-transparent bg-foreground/[0.04]",
};

const snippetSizeClass: Record<SnippetSize, string> = {
  sm: "gap-1.5 py-1 pl-2.5 pr-1 text-xs",
  default: "gap-2 py-1.5 pl-3 pr-1.5 text-sm",
};

export interface SnippetProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Code / command to display and copy. */
  children: string;
  /** Leading prompt symbol for command snippets (e.g. `"$"`). */
  symbol?: string;
  /** Surface style. Default `"muted"`. */
  variant?: SnippetVariant;
  /** Size. Default `"default"`. */
  size?: SnippetSize;
  /** Hide the copy button. */
  hideCopy?: boolean;
}

/**
 * Inline code / command block on the elevated surface with a built-in copy
 * button. Single-line and monospaced; for multi-line code blocks render a
 * `<pre>` yourself and drop a `CopyButton` in the corner.
 */
function Snippet({
  children,
  symbol,
  variant = "muted",
  size = "default",
  hideCopy = false,
  className,
  ...props
}: SnippetProps) {
  return (
    <div
      data-slot="snippet"
      data-variant={variant}
      className={cn(
        "flex items-center rounded-lg border font-mono",
        snippetVariantClass[variant],
        snippetSizeClass[size],
        className,
      )}
      {...props}
    >
      {symbol ? (
        <span aria-hidden className="select-none text-muted-foreground">
          {symbol}
        </span>
      ) : null}
      <code className="min-w-0 flex-1 truncate text-foreground">{children}</code>
      {hideCopy ? null : (
        <CopyButton
          value={children}
          className={cn("shrink-0", size === "sm" ? "size-6" : "size-7")}
        />
      )}
    </div>
  );
}

export { Snippet };
