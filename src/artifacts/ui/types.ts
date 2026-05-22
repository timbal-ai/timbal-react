// `UiArtifact` lets the agent compose interactive UI from a fixed palette of
// nodes. The renderer interprets the tree and wires hover / click / drag
// behavior — no agent-authored code is executed.
//
// Anywhere a primitive value is accepted you can pass a binding object of the
// form `{ $bind: "path" }` to read from the artifact's local state. State is
// per-artifact-instance and mutated declaratively via `UiAction`s.

/** A value that is either a literal or a binding into local state. */
export type UiBindable<T> = T | { $bind: string };

export interface UiArtifact {
  type: "ui";
  title?: string;
  /** Initial values for `$bind` references. */
  initialState?: Record<string, unknown>;
  /** Root of the node tree. */
  root: UiNode;
}

interface UiNodeBase {
  id?: string;
  className?: string;
}

export interface UiBoxNode extends UiNodeBase {
  kind: "box";
  /** Flex direction. Default: "col". */
  direction?: "row" | "col";
  /** Tailwind spacing units (gap = `gap * 0.25rem`). */
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  padding?: number;
  children?: UiNode[];
}

export interface UiTextNode extends UiNodeBase {
  kind: "text";
  value: UiBindable<string | number>;
  muted?: boolean;
  size?: "xs" | "sm" | "base" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
}

export interface UiHeadingNode extends UiNodeBase {
  kind: "heading";
  value: UiBindable<string>;
  level?: 1 | 2 | 3 | 4;
}

export interface UiBadgeNode extends UiNodeBase {
  kind: "badge";
  value: UiBindable<string>;
  tone?: "default" | "primary" | "success" | "warn" | "danger";
}

export interface UiButtonNode extends UiNodeBase {
  kind: "button";
  label: UiBindable<string>;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  size?: "sm" | "default" | "lg";
  disabled?: UiBindable<boolean>;
  onClick?: UiAction | UiAction[];
}

/**
 * Two-state toggle. `binding` is a dotted state path; clicking flips the
 * stored boolean. Optional `onChange` fires *after* the state flip.
 */
export interface UiToggleNode extends UiNodeBase {
  kind: "toggle";
  label?: UiBindable<string>;
  binding: string;
  onChange?: UiAction | UiAction[];
}

/**
 * Numeric range input. `binding` is a dotted state path; the slider reads and
 * writes the stored number. Optional `onChange` fires after each commit.
 */
export interface UiSliderNode extends UiNodeBase {
  kind: "slider";
  binding: string;
  min?: number;
  max?: number;
  step?: number;
  label?: UiBindable<string>;
  /** Show the current value next to the slider. Default: true. */
  showValue?: boolean;
  onChange?: UiAction | UiAction[];
}

export interface UiTooltipNode extends UiNodeBase {
  kind: "tooltip";
  content: UiBindable<string>;
  side?: "top" | "bottom" | "left" | "right";
  child: UiNode;
}

/**
 * Wrap any node to make it draggable. Drag is purely visual — release fires
 * `onDragEnd`. If `snapBack` (default) the child returns to its origin.
 */
export interface UiDraggableNode extends UiNodeBase {
  kind: "draggable";
  child: UiNode;
  axis?: "x" | "y" | "both";
  snapBack?: boolean;
  onDragEnd?: UiAction | UiAction[];
}

/**
 * Escape hatch: a host-app-registered component. The host registers a
 * renderer by name via `UiCustomNodeRegistryProvider`; props are passed
 * through after binding resolution and children render recursively.
 */
export interface UiCustomNode extends UiNodeBase {
  kind: "custom";
  name: string;
  props?: Record<string, unknown>;
  children?: UiNode[];
}

export type UiNode =
  | UiBoxNode
  | UiTextNode
  | UiHeadingNode
  | UiBadgeNode
  | UiButtonNode
  | UiToggleNode
  | UiSliderNode
  | UiTooltipNode
  | UiDraggableNode
  | UiCustomNode;

export type UiAction =
  /** Append a user message to the active thread. */
  | { kind: "message"; text: UiBindable<string> }
  /** Set a path in local state to a (possibly bound) value. */
  | { kind: "set"; path: string; value: UiBindable<unknown> }
  /** Flip a boolean at the given local-state path. */
  | { kind: "toggle"; path: string }
  /** Bubble a named event to the host app via `UiEventProvider`. */
  | { kind: "emit"; name: string; payload?: unknown };

export function isUiBinding(value: unknown): value is { $bind: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { $bind?: unknown }).$bind === "string"
  );
}
