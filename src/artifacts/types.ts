// Built-in artifact types. Agents can return these as structured tool results
// (preferred for interactive widgets) or embed them inline as
// ```timbal-artifact JSON``` fenced blocks in markdown text (for inline use).
//
// Custom types are supported by the registry — pass `renderers={{ "my:type":
// MyRenderer }}` when configuring artifacts.

/** Per-series presentation config (shadcn `ChartConfig` analog). */
export interface ChartSeriesConfig {
  dataKey: string;
  /** Legend / tooltip label. Defaults to `dataKey`. */
  label?: string;
  /** CSS color (token or literal). Defaults to the theme `--chart-N` palette. */
  color?: string;
}

export interface ChartArtifact {
  type: "chart";
  /** Chart kind. Cartesian kinds share one SVG engine; pie/donut/radial/radar are radial. */
  chartType?:
    | "bar"
    | "horizontalBar"
    | "line"
    | "area"
    | "pie"
    | "donut"
    | "radial"
    | "radar";
  /** Optional title rendered above the chart. */
  title?: string;
  /** Optional sub-title / caption rendered under the title. */
  description?: string;
  /** Array of data points. Keys map to series via `dataKey` / `xKey`. */
  data: Array<Record<string, unknown>>;
  /** Field name on each data point used for the X axis / category. */
  xKey?: string;
  /** Field name(s) used for series. Defaults to all keys except `xKey`. */
  dataKey?: string | string[];
  /**
   * Rich per-series config (labels + colors). Takes precedence over `dataKey`.
   * Mirrors shadcn's `ChartConfig`.
   */
  series?: ChartSeriesConfig[];
  /** Stack bar / area series on top of each other. */
  stacked?: boolean;
  /** Line / area interpolation. Default `monotone`. */
  curve?: "monotone" | "linear" | "step";
  /** Draw point markers on line / area series. */
  dots?: boolean;
  /** Tooltip series marker style. Default `dot`. */
  tooltipIndicator?: "dot" | "line" | "dashed";
  /** Show the series legend. */
  legend?: boolean;
  /** Show category / value axis ticks on flush cartesian charts. Default false (tooltips carry labels). */
  showAxes?: boolean;
  /** Per-slice / per-ring colors for pie / donut / radial. */
  colors?: string[];
  /** Optional unit label appended to numeric axis ticks and tooltip values. */
  unit?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * Question artifact — renders an in-thread choice widget. When the user picks
 * an option, the renderer calls back into the runtime with the selected
 * label as a new user message. Agents should treat the user response as the
 * answer.
 */
export interface QuestionArtifact {
  type: "question";
  /** Optional prompt shown above the options. Falls back to the message text. */
  prompt?: string;
  options: QuestionOption[];
  /** Allow selecting more than one option. Default: false. */
  multi?: boolean;
}

/** HTML/CSS/JS rendered in an iframe. See {@link HtmlArtifactView}. */
export interface HtmlArtifact {
  type: "html";
  content: string;
  /**
   * When true (default) the HTML renders inside a sandboxed iframe. The
   * sandbox allows scripts, forms, and modals but still isolates the
   * document from the host page. Set to `false` for fully unrestricted
   * inline HTML (scripts, external CDN assets, etc.) — trusted content only.
   */
  sandboxed?: boolean;
  /** Optional title rendered above the iframe. */
  title?: string;
  /** Iframe height in CSS pixels or any valid CSS length. Default: "320px". */
  height?: string;
}

export interface JsonArtifact {
  type: "json";
  title?: string;
  data: unknown;
}

export interface TableArtifact {
  type: "table";
  title?: string;
  columns?: Array<{ key: string; label?: string }>;
  rows: Array<Record<string, unknown>>;
}

export type { UiArtifact } from "./ui/types";
import type { UiArtifact } from "./ui/types";

export type TimbalArtifact =
  | ChartArtifact
  | QuestionArtifact
  | HtmlArtifact
  | JsonArtifact
  | TableArtifact
  | UiArtifact;

export type AnyArtifact = TimbalArtifact | { type: string; [key: string]: unknown };

/**
 * Type guard for artifact-shaped objects. Anything with a string `type` field
 * is considered a candidate; specific renderers narrow further.
 */
export function isArtifact(value: unknown): value is AnyArtifact {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { type?: unknown }).type === "string"
  );
}
