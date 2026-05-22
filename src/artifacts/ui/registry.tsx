"use client";

import {
  createContext,
  useContext,
  type ComponentType,
  type Dispatch,
  type FC,
  type ReactNode,
} from "react";
import type { UiStateAction, UiState } from "./state";

// ---------------------------------------------------------------------------
// Per-instance local state
// ---------------------------------------------------------------------------

const UiStateContext = createContext<UiState>({});
const UiDispatchContext = createContext<Dispatch<UiStateAction>>(() => {});

export const UiStateProvider: FC<{
  state: UiState;
  dispatch: Dispatch<UiStateAction>;
  children: ReactNode;
}> = ({ state, dispatch, children }) => (
  <UiStateContext.Provider value={state}>
    <UiDispatchContext.Provider value={dispatch}>
      {children}
    </UiDispatchContext.Provider>
  </UiStateContext.Provider>
);

export function useUiState(): UiState {
  return useContext(UiStateContext);
}

export function useUiDispatch(): Dispatch<UiStateAction> {
  return useContext(UiDispatchContext);
}

// ---------------------------------------------------------------------------
// Host event emission
// ---------------------------------------------------------------------------

export interface UiEventEnvelope {
  name: string;
  payload?: unknown;
}

const UiEventContext = createContext<((event: UiEventEnvelope) => void) | null>(
  null,
);

/**
 * Subscribe the host app to `emit`-kind actions fired from any UiArtifact in
 * the subtree. Wrap your runtime / chat root once.
 */
export const UiEventProvider: FC<{
  onEvent: (event: UiEventEnvelope) => void;
  children: ReactNode;
}> = ({ onEvent, children }) => (
  <UiEventContext.Provider value={onEvent}>{children}</UiEventContext.Provider>
);

export function useUiEventEmitter() {
  return useContext(UiEventContext);
}

// ---------------------------------------------------------------------------
// Custom node renderers (host-app extensibility)
// ---------------------------------------------------------------------------

export interface UiCustomNodeProps {
  /** Already binding-resolved props from the artifact. */
  props: Record<string, unknown>;
  /** Recursively rendered children. */
  children?: ReactNode;
}

export type UiCustomNodeRenderer = ComponentType<UiCustomNodeProps>;

const UiCustomNodeRegistryContext = createContext<
  Record<string, UiCustomNodeRenderer>
>({});

/**
 * Register named renderers for `{ kind: "custom", name: "..." }` nodes. Lets
 * host apps extend the palette without forking the package.
 */
export const UiCustomNodeRegistryProvider: FC<{
  renderers: Record<string, UiCustomNodeRenderer>;
  children: ReactNode;
}> = ({ renderers, children }) => (
  <UiCustomNodeRegistryContext.Provider value={renderers}>
    {children}
  </UiCustomNodeRegistryContext.Provider>
);

export function useUiCustomNodeRegistry(): Record<string, UiCustomNodeRenderer> {
  return useContext(UiCustomNodeRegistryContext);
}
