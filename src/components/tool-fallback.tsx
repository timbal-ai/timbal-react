"use client";

import { memo, useMemo, useState, type FC } from "react";
import { ChevronRightIcon } from "lucide-react";
import {
  useAuiState,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";

import { Shimmer } from "../ui/shimmer";
import { ToolPresence } from "./motion";
import {
  studioComposerIoWellClass,
  studioTimelineActionClass,
  studioTimelineBodyPadClass,
  studioTimelineChevronClass,
  studioTimelineDetailClass,
  studioTimelineRowButtonClass,
  studioTimelineShimmerActionClass,
  studioTimelineTextClass,
} from "../design/classes";
import { ToolBodyPresence } from "./motion";
import { useTimbalRuntime } from "../runtime/provider";
import { cn } from "../utils";

// ---------------------------------------------------------------------------
// Running detection — assistant-ui doesn't always set `status` for streaming
// tool calls, so we fall back to runtime state + result presence.
// ---------------------------------------------------------------------------

interface ToolStatus {
  type: string;
  reason?: string;
}

function detectRunning({
  status,
  result,
  streamRunning,
}: {
  status?: ToolStatus;
  result?: unknown;
  streamRunning: boolean;
}): boolean {
  const isError =
    status?.type === "incomplete" && status.reason !== "cancelled";
  if (isError) return false;
  if (status?.type === "running") return true;
  if (status?.type === "complete") return false;
  return streamRunning && result === undefined;
}

export function useToolRunning(props: {
  status?: ToolStatus;
  result?: unknown;
}): boolean {
  const { isRunning: streamRunning } = useTimbalRuntime();
  const partStatus = useAuiState((s) => s.part.status) as ToolStatus | undefined;
  return detectRunning({
    status: partStatus ?? props.status,
    result: props.result,
    streamRunning,
  });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatToolLabel(toolName: string) {
  return toolName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function formatToolResult(result: unknown): string {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

// ---------------------------------------------------------------------------
// Timeline row primitives
// ---------------------------------------------------------------------------

const TimelineActionLabel: FC<{
  action: string;
  detail?: string;
  shimmer?: boolean;
}> = ({ action, detail, shimmer = false }) => (
  <span className="inline-flex min-w-0 max-w-full items-baseline gap-1">
    {action ? (
      shimmer ? (
        <Shimmer
          as="span"
          className={cn(studioTimelineShimmerActionClass, "aui-tool-shimmer")}
          duration={1.8}
          spread={2.5}
        >
          {action}
        </Shimmer>
      ) : (
        <span className={studioTimelineActionClass}>{action}</span>
      )
    ) : null}
    {detail ? <span className={studioTimelineDetailClass}>{detail}</span> : null}
  </span>
);

const TimelineHoverChevron: FC<{ expanded: boolean }> = ({ expanded }) => (
  <ChevronRightIcon
    className={studioTimelineChevronClass(expanded)}
    aria-hidden
  />
);

const ToolPanel: FC<{
  toolName: string;
  argsText?: string;
  result?: unknown;
  isError?: boolean;
}> = ({ toolName, argsText, result, isError }) => {
  const [open, setOpen] = useState(false);
  const detail = formatToolLabel(toolName);

  const formattedArgs = useMemo(() => {
    if (!argsText || argsText === "{}") return null;
    try {
      return JSON.stringify(JSON.parse(argsText), null, 2);
    } catch {
      return argsText;
    }
  }, [argsText]);

  const formattedResult = useMemo(() => {
    if (result === undefined || result === null) return null;
    return formatToolResult(result);
  }, [result]);

  const hasBody = Boolean(formattedArgs || formattedResult);
  const action = isError ? "Failed" : "Used";

  if (!hasBody) {
    return (
      <div className="aui-tool-row w-full min-w-0">
        <TimelineActionLabel action={action} detail={detail} />
      </div>
    );
  }

  return (
    <div className="aui-tool-row w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${action} ${detail}`}
        className={studioTimelineRowButtonClass}
      >
        <span
          className={cn(
            "inline-flex min-w-0 max-w-full items-center gap-0.5",
            studioTimelineTextClass,
            "text-foreground",
          )}
        >
          <TimelineActionLabel action={action} detail={detail} />
          <TimelineHoverChevron expanded={open} />
        </span>
      </button>

      <ToolBodyPresence
        open={open}
        className={cn(studioTimelineBodyPadClass, "gap-2")}
      >
        {formattedArgs ? (
          <div
            className={cn(
              studioComposerIoWellClass,
              "max-h-48 overflow-auto px-2.5 py-2",
            )}
          >
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] font-normal leading-relaxed text-foreground">
              {formattedArgs}
            </pre>
          </div>
        ) : null}
        {formattedResult ? (
          <div
            className={cn(
              studioComposerIoWellClass,
              "max-h-48 overflow-auto px-2.5 py-2",
            )}
          >
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] font-normal leading-relaxed text-foreground">
              {formattedResult}
            </pre>
          </div>
        ) : null}
      </ToolBodyPresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Default tool fallback — flat timeline row à la "Thought 512 ms"
// ---------------------------------------------------------------------------

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const isRunning = useToolRunning({ status, result });
  const isError =
    status?.type === "incomplete" && status.reason !== "cancelled";

  const presenceKey = isRunning ? "running" : isError ? "error" : "complete";

  return (
    <ToolPresence
      presenceKey={presenceKey}
      variant={isRunning ? "executing" : "settled"}
      className="py-0.5"
    >
      {isRunning ? (
        <div className="aui-tool-running">
          <TimelineActionLabel
            action="Using"
            detail={formatToolLabel(toolName)}
            shimmer
          />
        </div>
      ) : (
        <ToolPanel
          toolName={toolName}
          argsText={argsText}
          result={result}
          isError={isError}
        />
      )}
    </ToolPresence>
  );
};

const ToolFallback = memo(
  ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent;

ToolFallback.displayName = "ToolFallback";

export { ToolFallback };
