"use client";

import { type FC } from "react";
import type { JsonArtifact, AnyArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";

/**
 * Default renderer used both for `{ type: "json" }` artifacts and as the
 * fallback when no renderer is registered for a given type. Pretty-prints
 * any JSON-serializable value.
 */
export const JsonArtifactView: FC<{ artifact: JsonArtifact | AnyArtifact }> = ({
  artifact,
}) => {
  const data = "data" in artifact ? artifact.data : artifact;
  const title = (artifact as JsonArtifact).title;

  let body: string;
  try {
    body = JSON.stringify(data, null, 2);
  } catch {
    body = String(data);
  }

  return (
    <ArtifactCard title={title} kind="json">
      <pre className="aui-artifact-json m-0 max-h-[420px] overflow-auto p-3 font-mono text-[12px] leading-relaxed text-foreground/85">
        {body}
      </pre>
    </ArtifactCard>
  );
};
