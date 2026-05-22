"use client";

import { memo, useState, type FC } from "react";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import { type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { Shimmer } from "../ui/shimmer";
import { cn } from "../utils";

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const isRunning = status?.type === "running";
  const isError = status?.type === "incomplete" && status.reason !== "cancelled";

  if (isRunning) {
    return (
      <div className="aui-tool-fallback-running flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <WrenchIcon className="size-4" />
        <Shimmer as="span" duration={1.8} spread={2.5}>
          {`Using tool: ${toolName}`}
        </Shimmer>
      </div>
    );
  }

  return (
    <ToolPanel
      toolName={toolName}
      argsText={argsText}
      result={result}
      isError={isError}
    />
  );
};

const ToolPanel: FC<{
  toolName: string;
  argsText?: string;
  result?: unknown;
  isError?: boolean;
}> = ({ toolName, argsText, result, isError }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "aui-tool-fallback-root my-2 overflow-hidden rounded-lg border border-border/60 bg-muted/30 text-sm",
        isError && "border-destructive/50 bg-destructive/5",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="aui-tool-fallback-header flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <WrenchIcon className="size-3.5" />
        <span className="aui-tool-fallback-name flex-1 truncate font-mono text-xs font-medium text-foreground/80">
          {toolName}
        </span>
        {isError && (
          <span className="aui-tool-fallback-status text-xs font-medium text-destructive">
            error
          </span>
        )}
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="aui-tool-fallback-body grid gap-2 border-t border-border/40 bg-background/50 px-3 py-2.5 text-xs">
          {argsText && argsText !== "{}" && (
            <Section label="Input" value={argsText} />
          )}
          {result !== undefined && result !== null && (
            <Section label="Output" value={formatResult(result)} />
          )}
        </div>
      )}
    </div>
  );
};

const Section: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="aui-tool-fallback-section">
    <div className="aui-tool-fallback-section-label mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <pre className="aui-tool-fallback-section-value overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground/85">
      {value}
    </pre>
  </div>
);

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

const ToolFallback = memo(
  ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent;

ToolFallback.displayName = "ToolFallback";

export { ToolFallback };
