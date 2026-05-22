"use client";

import { type ComponentType } from "react";
import { type ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ToolFallback } from "../components/tool-fallback";
import { parseArtifactFromToolResult } from "./parse";
import { useArtifactRegistry } from "./registry";
import type { AnyArtifact } from "./types";

/**
 * Drop-in replacement for `ToolFallback` that first tries to render the tool
 * result as an artifact via the registry. Falls back to the standard tool
 * panel when the result isn't artifact-shaped (or while the tool is still
 * running).
 *
 * Use this as the `tools.Fallback` in `MessagePrimitive.Parts` to enable
 * artifact rendering for any tool the agent calls.
 */
export const ToolArtifactFallback: ToolCallMessagePartComponent = (props) => {
  const registry = useArtifactRegistry();
  const isRunning = props.status?.type === "running";

  if (!isRunning) {
    const artifact = parseArtifactFromToolResult(props.result);
    if (artifact) {
      const Renderer = registry[artifact.type] as
        | ComponentType<{ artifact: AnyArtifact }>
        | undefined;
      if (Renderer) {
        return <Renderer artifact={artifact} />;
      }
    }
  }

  return <ToolFallback {...props} />;
};
