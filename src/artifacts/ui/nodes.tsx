"use client";

import { type FC, type ReactNode, useCallback } from "react";
import { motion } from "motion/react";
import { useThreadRuntime } from "@assistant-ui/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Button } from "../../ui/button";
import { cn } from "../../utils";
import type {
  UiAction,
  UiBadgeNode,
  UiBoxNode,
  UiButtonNode,
  UiCustomNode,
  UiDraggableNode,
  UiHeadingNode,
  UiNode,
  UiSliderNode,
  UiTextNode,
  UiToggleNode,
  UiTooltipNode,
} from "./types";
import { getPath, resolveBindable, type UiState } from "./state";
import {
  useUiCustomNodeRegistry,
  useUiDispatch,
  useUiEventEmitter,
  useUiState,
} from "./registry";

// ---------------------------------------------------------------------------
// Dispatch table
// ---------------------------------------------------------------------------

export const UiNodeView: FC<{ node: UiNode }> = ({ node }) => {
  switch (node.kind) {
    case "box":
      return <BoxNode node={node} />;
    case "text":
      return <TextNode node={node} />;
    case "heading":
      return <HeadingNode node={node} />;
    case "badge":
      return <BadgeNode node={node} />;
    case "button":
      return <ButtonNode node={node} />;
    case "toggle":
      return <ToggleNode node={node} />;
    case "slider":
      return <SliderNode node={node} />;
    case "tooltip":
      return <TooltipNode node={node} />;
    case "draggable":
      return <DraggableNode node={node} />;
    case "custom":
      return <CustomNode node={node} />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Action runner
// ---------------------------------------------------------------------------

function useActionRunner() {
  const state = useUiState();
  const dispatch = useUiDispatch();
  const runtime = useThreadRuntime();
  const emit = useUiEventEmitter();

  return useCallback(
    (actions?: UiAction | UiAction[]) => {
      if (!actions) return;
      const list = Array.isArray(actions) ? actions : [actions];
      for (const action of list) {
        switch (action.kind) {
          case "message": {
            const text = resolveBindable(action.text, state);
            if (typeof text === "string" && text.length > 0) {
              runtime?.append({
                role: "user",
                content: [{ type: "text", text }],
              });
            }
            break;
          }
          case "set": {
            const value = resolveBindable(action.value, state);
            dispatch({ type: "set", path: action.path, value });
            break;
          }
          case "toggle": {
            dispatch({ type: "toggle", path: action.path });
            break;
          }
          case "emit": {
            emit?.({ name: action.name, payload: action.payload });
            break;
          }
        }
      }
    },
    [state, dispatch, runtime, emit],
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const ALIGN_CLS = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const JUSTIFY_CLS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

const BoxNode: FC<{ node: UiBoxNode }> = ({ node }) => {
  const dir = node.direction ?? "col";
  return (
    <div
      className={cn(
        "aui-ui-box flex",
        dir === "col" ? "flex-col" : "flex-row",
        node.wrap && "flex-wrap",
        node.align && ALIGN_CLS[node.align],
        node.justify && JUSTIFY_CLS[node.justify],
        node.className,
      )}
      style={{
        gap: node.gap !== undefined ? `${node.gap * 0.25}rem` : undefined,
        padding:
          node.padding !== undefined ? `${node.padding * 0.25}rem` : undefined,
      }}
    >
      {node.children?.map((child, i) => (
        <UiNodeView key={child.id ?? i} node={child} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const TEXT_SIZE = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
} as const;

const TEXT_WEIGHT = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

const TextNode: FC<{ node: UiTextNode }> = ({ node }) => {
  const state = useUiState();
  const value = resolveBindable(node.value, state);
  return (
    <span
      className={cn(
        "aui-ui-text",
        node.muted && "text-muted-foreground",
        node.size && TEXT_SIZE[node.size],
        node.weight && TEXT_WEIGHT[node.weight],
        node.className,
      )}
    >
      {value === undefined || value === null ? "" : String(value)}
    </span>
  );
};

const HEADING_CLS = {
  1: "text-2xl",
  2: "text-xl",
  3: "text-lg",
  4: "text-base",
} as const;

const HeadingNode: FC<{ node: UiHeadingNode }> = ({ node }) => {
  const state = useUiState();
  const value = String(resolveBindable(node.value, state) ?? "");
  const level = node.level ?? 2;
  const cls = cn(
    "aui-ui-heading font-semibold text-foreground",
    HEADING_CLS[level],
    node.className,
  );
  switch (level) {
    case 1:
      return <h1 className={cls}>{value}</h1>;
    case 2:
      return <h2 className={cls}>{value}</h2>;
    case 3:
      return <h3 className={cls}>{value}</h3>;
    case 4:
      return <h4 className={cls}>{value}</h4>;
  }
};

const BADGE_TONE = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
} as const;

const BadgeNode: FC<{ node: UiBadgeNode }> = ({ node }) => {
  const state = useUiState();
  const value = String(resolveBindable(node.value, state) ?? "");
  return (
    <span
      className={cn(
        "aui-ui-badge inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        BADGE_TONE[node.tone ?? "default"],
        node.className,
      )}
    >
      {value}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Interactive
// ---------------------------------------------------------------------------

const ButtonNode: FC<{ node: UiButtonNode }> = ({ node }) => {
  const state = useUiState();
  const run = useActionRunner();
  const label = String(resolveBindable(node.label, state) ?? "");
  const disabled =
    node.disabled !== undefined
      ? Boolean(resolveBindable(node.disabled, state))
      : false;
  return (
    <Button
      variant={node.variant ?? "default"}
      size={node.size ?? "default"}
      disabled={disabled}
      className={node.className}
      onClick={() => run(node.onClick)}
    >
      {label}
    </Button>
  );
};

const ToggleNode: FC<{ node: UiToggleNode }> = ({ node }) => {
  const state = useUiState();
  const dispatch = useUiDispatch();
  const run = useActionRunner();
  const value = Boolean(getPath(state, node.binding));
  const label = node.label
    ? String(resolveBindable(node.label, state) ?? "")
    : null;

  const onToggle = () => {
    dispatch({ type: "toggle", path: node.binding });
    run(node.onChange);
  };

  return (
    <label
      className={cn(
        "aui-ui-toggle inline-flex cursor-pointer items-center gap-2 text-sm select-none",
        node.className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          value
            ? "border-primary bg-primary"
            : "border-border bg-muted hover:bg-muted/80",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-background shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
          aria-hidden
        />
      </button>
      {label && <span className="text-foreground/85">{label}</span>}
    </label>
  );
};

const SliderNode: FC<{ node: UiSliderNode }> = ({ node }) => {
  const state = useUiState();
  const dispatch = useUiDispatch();
  const run = useActionRunner();
  const min = node.min ?? 0;
  const max = node.max ?? 100;
  const step = node.step ?? 1;
  const raw = getPath(state, node.binding);
  const value = typeof raw === "number" ? raw : min;
  const showValue = node.showValue ?? true;
  const label = node.label
    ? String(resolveBindable(node.label, state) ?? "")
    : null;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    dispatch({ type: "set", path: node.binding, value: next });
  };

  return (
    <div className={cn("aui-ui-slider flex flex-col gap-1", node.className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono">{value}</span>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        onMouseUp={() => run(node.onChange)}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") run(node.onChange);
        }}
        onTouchEnd={() => run(node.onChange)}
        className="aui-ui-slider-input h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Disclosure / motion
// ---------------------------------------------------------------------------

const TooltipNode: FC<{ node: UiTooltipNode }> = ({ node }) => {
  const state = useUiState();
  const content = String(resolveBindable(node.content, state) ?? "");
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("aui-ui-tooltip-trigger inline-flex", node.className)}>
            <UiNodeView node={node.child} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={node.side ?? "top"}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DraggableNode: FC<{ node: UiDraggableNode }> = ({ node }) => {
  const run = useActionRunner();
  const snapBack = node.snapBack ?? true;
  const axis = node.axis ?? "both";
  const dragProp: true | "x" | "y" = axis === "both" ? true : axis;

  return (
    <motion.div
      drag={dragProp}
      dragMomentum={false}
      dragSnapToOrigin={snapBack}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      onDragEnd={() => run(node.onDragEnd)}
      className={cn(
        "aui-ui-draggable inline-block cursor-grab touch-none",
        node.className,
      )}
    >
      <UiNodeView node={node.child} />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Custom escape hatch
// ---------------------------------------------------------------------------

const CustomNode: FC<{ node: UiCustomNode }> = ({ node }) => {
  const state = useUiState();
  const registry = useUiCustomNodeRegistry();
  const Renderer = registry[node.name];
  if (!Renderer) return null;

  const resolvedProps = resolveProps(node.props ?? {}, state);
  const children: ReactNode = node.children?.map((child, i) => (
    <UiNodeView key={child.id ?? i} node={child} />
  ));

  return <Renderer props={resolvedProps} children={children} />;
};

function resolveProps(
  props: Record<string, unknown>,
  state: UiState,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    out[k] = resolveBindable(v, state);
  }
  return out;
}
