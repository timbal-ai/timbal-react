/**
 * The single source of truth for what generated Timbal UIs are *allowed* to
 * look like — the anti-slop constraint, encoded as data.
 *
 * Both the deterministic linter (`ui-lint.ts`) and the agent prompt
 * (`APP_KIT_AGENT_INSTRUCTIONS`) read from this module, so the rules a model is
 * told and the rules it is checked against can never drift apart.
 *
 * "Slop" = the generic AI-dashboard look: a decorative icon on every tile,
 * loud green/red trend pills, arbitrary palette colors, gratuitous dividers,
 * card-in-card nesting, bold giant numbers. Taste lives here, not in prose.
 *
 * This is a **public, documented** API (exported from the package root and
 * `/app`), in the same tier as the theme generator — not an internal class
 * composite.
 */

/**
 * Semantic color token roots the design system defines (see `styles.css`).
 * Generated code may only reach for colors through these — `bg-background`,
 * `text-muted-foreground`, `border-border`, `text-primary`, `bg-destructive`,
 * the timbal chrome extensions, etc. Anything else is slop.
 */
export const SEMANTIC_COLOR_TOKENS = [
  // shadcn-style base tokens
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  // sidebar scope
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  // timbal chrome extensions
  "elevated-from",
  "elevated-to",
  "modal-from",
  "modal-to",
  "playground-from",
  "playground-via",
  "playground-to",
  "composer-bg",
  "composer-border",
  "composer-border-focus",
  "bubble-user",
  "bubble-user-foreground",
  "code-block-bg",
  "code-header-bg",
] as const;

export type SemanticColorToken = (typeof SEMANTIC_COLOR_TOKENS)[number];

/**
 * Gradient / fill tokens reserved for **chrome only** (buttons, the elevated
 * surface, the modal shell, the playground backdrop). They must never decorate
 * a data card, a stat tile, or a list — that is the canonical "slop gradient".
 */
export const RESERVED_GRADIENT_TOKENS = [
  "primary-fill-from",
  "primary-fill-to",
  "primary-fill-hover-from",
  "primary-fill-hover-to",
  "primary-fill-active-from",
  "primary-fill-active-to",
  "secondary-fill-hover-from",
  "secondary-fill-hover-to",
  "secondary-fill-active-from",
  "secondary-fill-active-to",
  "destructive-fill-hover-from",
  "destructive-fill-hover-to",
  "destructive-fill-active-from",
  "destructive-fill-active-to",
  "ghost-fill-hover",
  "ghost-fill-active",
  "elevated-from",
  "elevated-to",
  "modal-from",
  "modal-to",
  "playground-from",
  "playground-via",
  "playground-to",
] as const;

/**
 * The Tailwind named palette. Any of these followed by a numeric shade
 * (`-50`..`-950`) in a color utility is a hardcoded color — not a token —
 * and is rejected by the linter.
 */
export const TAILWIND_PALETTE_COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

/** Tailwind color-bearing utility prefixes the linter inspects. */
export const COLOR_UTILITY_PREFIXES = [
  "bg",
  "text",
  "border",
  "ring",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
  "decoration",
  "outline",
  "shadow",
  "divide",
  "accent",
  "caret",
] as const;

/**
 * Numeric budgets the linter enforces. Tuned for "tasteful dashboard", not
 * "icon confetti". A view that needs more icons than this is almost always
 * decorating instead of communicating.
 */
export const SLOP_BUDGETS = {
  /** Max decorative/standalone icons rendered in a single generated file. */
  maxIconsPerView: 6,
  /** Max consecutive list rows separated by an explicit border/divider before
   *  it reads as a "ruled table" — prefer spacing or zebra instead. */
  maxRowDividers: 2,
} as const;

/**
 * House-style rules in plain language. The prompt renders these verbatim and
 * the linter maps each `id` to a check, so the model is told and tested on the
 * exact same list.
 */
export interface HouseRule {
  id: string;
  /** One-line imperative the agent reads. */
  rule: string;
  /** Why it matters (kept short — models follow rules with rationale better). */
  why: string;
  /** A wrong example (kept to a fragment). */
  slop?: string;
  /** The tasteful equivalent. */
  good?: string;
}

export const HOUSE_RULES: readonly HouseRule[] = [
  {
    id: "semantic-color",
    rule: "Color only through semantic tokens — never a raw palette color, hex, or oklch literal.",
    why: "The theme generator owns every color; hardcoding breaks dark mode and rebranding.",
    slop: `<span className="text-blue-600 bg-green-50">`,
    good: `<span className="text-primary bg-muted">`,
  },
  {
    id: "no-decorative-icons",
    rule: "Icons must earn their place (action, nav, or status). Never add an icon beside a label that already says the thing.",
    why: "An icon on every tile/card is the #1 tell of generated slop.",
    slop: `<StatTile label={<><BarChart2 /> Revenue</>} value="$95k" />`,
    good: `<StatTile label="Revenue" value="$95k" />`,
  },
  {
    id: "neutral-trend",
    rule: "Don't put a colored trend pill on every metric. Use a trend only when the delta is the point, and keep it muted.",
    why: "Loud green/red pills everywhere are noise, not signal.",
    slop: `<MetricTile trend="+8%" className="text-green-500" />`,
    good: `<MetricTile label="Win rate" value="50%" />`,
  },
  {
    id: "values-normal-weight",
    rule: "Metric values use normal font weight, not bold.",
    why: "Giant bold numbers read as a template; normal weight reads as a product.",
    slop: `<span className="text-3xl font-bold tabular-nums">$322k</span>`,
    good: `<span className="text-2xl font-normal tabular-nums">$322k</span>`,
  },
  {
    id: "no-card-in-card",
    rule: "Don't nest a bordered card inside another bordered card. Group with spacing or a Section instead.",
    why: "Card-in-card doubles borders and shadows for no information gain.",
  },
  {
    id: "no-row-dividers",
    rule: "Don't put a divider between every list row. Use spacing or zebra striping.",
    why: "A rule under every row turns a clean list into a dense ledger.",
  },
  {
    id: "no-data-gradient",
    rule: "Gradients are reserved for chrome (composer, elevated surface, playground). Never on a data card, tile, or table.",
    why: "Gradient stat cards are the canonical 'AI dashboard' look.",
  },
  {
    id: "compose-from-blocks",
    rule: "Build from premade blocks (MetricRow, MetricChartCard, DataTable, IntegrationCard). Drop to raw primitives only when no block fits.",
    why: "Slop appears the moment generation falls below the curated block layer.",
  },
  {
    id: "use-kit-controls",
    rule: "Use the kit's controls (SearchInput, Select, DropdownMenu, FieldInput, FieldSelect) — never hand-roll an input/trigger surface (`border-input rounded-* bg-…`).",
    why: "Hand-rolled controls drift from the shared control-surface skin and look foreign next to kit controls.",
    slop: `<button className="rounded-lg border border-input bg-transparent px-3 h-9">`,
    good: `<SelectTrigger><SelectValue /></SelectTrigger>`,
  },
] as const;
