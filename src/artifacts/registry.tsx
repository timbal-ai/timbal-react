"use client";

import { createContext, useContext, useMemo, type ComponentType, type FC, type ReactNode } from "react";
import type { AnyArtifact } from "./types";
import { ChartArtifactView } from "./chart-artifact";
import { QuestionArtifactView } from "./question-artifact";
import { HtmlArtifactView } from "./html-artifact";
import { JsonArtifactView } from "./json-artifact";
import { TableArtifactView } from "./table-artifact";
import { UiArtifactView } from "./ui/ui-artifact";

export interface ArtifactRendererProps<T extends AnyArtifact = AnyArtifact> {
  artifact: T;
}

export type ArtifactRenderer<T extends AnyArtifact = AnyArtifact> = ComponentType<
  ArtifactRendererProps<T>
>;

export type ArtifactRegistry = Record<string, ArtifactRenderer<AnyArtifact>>;

export const defaultArtifactRenderers: ArtifactRegistry = {
  chart: ChartArtifactView as ArtifactRenderer<AnyArtifact>,
  question: QuestionArtifactView as ArtifactRenderer<AnyArtifact>,
  html: HtmlArtifactView as ArtifactRenderer<AnyArtifact>,
  json: JsonArtifactView as ArtifactRenderer<AnyArtifact>,
  table: TableArtifactView as ArtifactRenderer<AnyArtifact>,
  ui: UiArtifactView as ArtifactRenderer<AnyArtifact>,
};

const ArtifactRegistryContext = createContext<ArtifactRegistry>(
  defaultArtifactRenderers,
);

/**
 * Provide a custom artifact registry to the subtree. Custom renderers are
 * merged on top of the defaults — pass `override: true` to replace.
 */
export const ArtifactRegistryProvider: FC<{
  renderers?: ArtifactRegistry;
  override?: boolean;
  children: ReactNode;
}> = ({ renderers, override, children }) => {
  const merged = useMemo<ArtifactRegistry>(() => {
    if (!renderers) return defaultArtifactRenderers;
    if (override) return renderers;
    return { ...defaultArtifactRenderers, ...renderers };
  }, [renderers, override]);

  return (
    <ArtifactRegistryContext.Provider value={merged}>
      {children}
    </ArtifactRegistryContext.Provider>
  );
};

export function useArtifactRegistry(): ArtifactRegistry {
  return useContext(ArtifactRegistryContext);
}

/**
 * Render an artifact using the closest registry. Falls back to the JSON
 * renderer when no entry matches the artifact's `type`.
 */
export const ArtifactView: FC<{ artifact: AnyArtifact }> = ({ artifact }) => {
  const registry = useArtifactRegistry();
  const Renderer = registry[artifact.type] ?? registry.json;
  if (!Renderer) return null;
  return <Renderer artifact={artifact} />;
};
