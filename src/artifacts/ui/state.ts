import { isUiBinding, type UiBindable } from "./types";

export type UiState = Record<string, unknown>;

export type UiStateAction =
  | { type: "set"; path: string; value: unknown }
  | { type: "toggle"; path: string }
  | { type: "replace"; state: UiState };

export function uiStateReducer(state: UiState, action: UiStateAction): UiState {
  switch (action.type) {
    case "set":
      return setPath(state, action.path, action.value);
    case "toggle": {
      const current = getPath(state, action.path);
      return setPath(state, action.path, !current);
    }
    case "replace":
      return action.state;
  }
}

/** Read a dotted path from a state object. Returns undefined when missing. */
export function getPath(state: UiState, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let cursor: unknown = state;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

/**
 * Set a dotted path on a state object, returning a new object. Intermediate
 * objects are cloned (or created when missing) so the result is safe to use
 * directly with React state without further copying.
 */
export function setPath(state: UiState, path: string, value: unknown): UiState {
  if (!path) return state;
  const parts = path.split(".");
  const next: UiState = { ...state };
  let cursor: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = cursor[key];
    const cloned =
      typeof child === "object" && child !== null && !Array.isArray(child)
        ? { ...(child as Record<string, unknown>) }
        : {};
    cursor[key] = cloned;
    cursor = cloned;
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}

/** Resolve a UiBindable into its concrete value against the given state. */
export function resolveBindable<T>(value: UiBindable<T>, state: UiState): T {
  if (isUiBinding(value)) {
    return getPath(state, value.$bind) as T;
  }
  return value;
}
