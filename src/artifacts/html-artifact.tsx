"use client";

import { type FC } from "react";
import type { HtmlArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";

/**
 * Renders HTML inside an iframe. When `sandboxed` is true (default), scripts
 * and forms run in an isolated sandbox. Set `sandboxed: false` for fully
 * unrestricted inline HTML — trusted content only.
 */
export const HtmlArtifactView: FC<{ artifact: HtmlArtifact }> = ({ artifact }) => {
  const sandboxed = artifact.sandboxed !== false;
  const sandbox = sandboxed
    ? "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-pointer-lock"
    : undefined;
  const height = artifact.height ?? "320px";

  return (
    <ArtifactCard title={artifact.title} kind="html">
      <iframe
        title={artifact.title ?? "HTML artifact"}
        srcDoc={artifact.content}
        sandbox={sandbox}
        className="aui-artifact-html w-full border-0 bg-background"
        style={{ height }}
      />
    </ArtifactCard>
  );
};
