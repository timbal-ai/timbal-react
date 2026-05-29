"use client";

import { type ComponentType } from "react";
import { type ToolCallMessagePartComponent } from "@assistant-ui/react";

import { ToolFallback, useToolRunning } from "../chat/tool-fallback";
import { ToolMotion } from "../chat/motion";
import { parseArtifactFromToolResult } from "./parse";
import { useArtifactRegistry } from "./registry";
import type { AnyArtifact } from "./types";

/**
 * Default `tools.Override` for assistant messages.
 *
 * Renders the tool result as a registered artifact when possible; otherwise
 * falls back to the timeline `ToolFallback`. Wraps the artifact in
 * `ToolMotion` so it shares the same rise-from-below polish as the rest of
 * the chat surface.
 */
export const ToolArtifactFallback: ToolCallMessagePartComponent = (props) => {
  const registry = useArtifactRegistry();
  const isRunning = useToolRunning({
    status: props.status,
    result: props.result,
  });

  if (!isRunning) {
    const artifact = parseArtifactFromToolResult(props.result);
    if (artifact) {
      const Renderer = registry[artifact.type] as
        | ComponentType<{ artifact: AnyArtifact }>
        | undefined;
      if (Renderer) {
        return (
          <ToolMotion
            motionKey={`artifact-${artifact.type}`}
            className="aui-tool-artifact"
          >
            <Renderer artifact={artifact} />
          </ToolMotion>
        );
      }
    }
  }

  return <ToolFallback {...props} />;
};
