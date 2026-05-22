"use client";

import { useReducer, type FC } from "react";
import type { UiArtifact } from "./types";
import { uiStateReducer, type UiState } from "./state";
import { UiStateProvider } from "./registry";
import { UiNodeView } from "./nodes";
import { ArtifactCard } from "../artifact-card";

/**
 * Render a `ui` artifact. Each instance gets its own local state seeded from
 * `artifact.initialState`. Toggles, sliders, and `set` actions mutate this
 * state via the reducer; bindings (`{ $bind: "path" }`) read from it.
 *
 * Host apps subscribe to `emit` actions via `<UiEventProvider>` from the
 * registry module and extend the node palette via
 * `<UiCustomNodeRegistryProvider>`.
 */
export const UiArtifactView: FC<{ artifact: UiArtifact }> = ({ artifact }) => {
  const [state, dispatch] = useReducer(
    uiStateReducer,
    (artifact.initialState ?? {}) as UiState,
  );

  return (
    <ArtifactCard title={artifact.title} kind="ui">
      <UiStateProvider state={state} dispatch={dispatch}>
        <div className="aui-ui-root p-3">
          <UiNodeView node={artifact.root} />
        </div>
      </UiStateProvider>
    </ArtifactCard>
  );
};
