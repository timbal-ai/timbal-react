"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "../utils";

export interface CopyButtonProps
  extends Omit<React.ComponentProps<"button">, "value" | "children"> {
  /** Text to write to the clipboard. */
  value: string;
  /** How long the success state lasts, in ms. Default: `1500`. */
  timeout?: number;
  onCopied?: (value: string) => void;
  /** Optional label rendered next to the icon. */
  children?: React.ReactNode;
}

/**
 * Click-to-copy button with a transient check confirmation. Icon-only by
 * default; pass children to show a label. Falls back gracefully if the
 * Clipboard API is unavailable.
 */
function CopyButton({
  value,
  timeout = 1500,
  onCopied,
  className,
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.(value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <button
      type="button"
      data-slot="copy-button"
      data-copied={copied || undefined}
      aria-label={copied ? "Copied" : "Copy"}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground data-[copied=true]:text-emerald-600 dark:data-[copied=true]:text-emerald-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
        children ? "h-8 px-2" : "size-8",
        className,
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </button>
  );
}

export { CopyButton };
