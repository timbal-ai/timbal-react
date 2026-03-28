"use client";

import { memo } from "react";
import { WrenchIcon } from "lucide-react";
import { type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { Shimmer } from "../ui/shimmer";

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  status,
}) => {
  if (status?.type !== "running") return null;

  return (
    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
      <WrenchIcon className="size-4" />
      <Shimmer as="span" duration={1.8} spread={2.5}>
        {`Using tool: ${toolName}`}
      </Shimmer>
    </div>
  );
};

const ToolFallback = memo(
  ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent;

ToolFallback.displayName = "ToolFallback";

export { ToolFallback };
