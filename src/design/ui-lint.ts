/**
 * Deterministic anti-slop linter for generated Timbal UI code.
 *
 * Runs a dependency-free line scan over a `.tsx` string and flags the patterns
 * that turn a clean dashboard into generic AI slop: hardcoded colors, icon
 * spam, bold giant numbers, divider-per-row lists, gradients on data cards.
 *
 * It intentionally avoids a full AST/parser dependency — the checks are
 * line/regex heuristics tuned for high precision on the patterns that actually
 * recur in generated output. Feed `formatLintReport(findings)` back to the
 * generating agent (see `reviewGeneratedUi`) so it can self-correct.
 *
 * Public, documented API — exported from the package root and `/app`.
 */

import {
  COLOR_UTILITY_PREFIXES,
  RESERVED_GRADIENT_TOKENS,
  SLOP_BUDGETS,
  TAILWIND_PALETTE_COLORS,
} from "./ui-vocabulary";

export type LintSeverity = "error" | "warn";

export interface LintFinding {
  /** Stable rule id (maps to a HouseRule where applicable). */
  rule: string;
  severity: LintSeverity;
  /** 1-based line number in the supplied source. */
  line: number;
  /** Human-readable explanation + fix. */
  message: string;
  /** The offending source fragment (trimmed). */
  snippet: string;
}

export interface LintResult {
  findings: LintFinding[];
  errorCount: number;
  warnCount: number;
  /** True when there are no `error`-severity findings. */
  ok: boolean;
}

export interface LintOptions {
  /** Max standalone icons before `icon-spam` fires. Defaults to the budget. */
  maxIconsPerView?: number;
  /** Max bordered list rows before `row-divider` fires. Defaults to the budget. */
  maxRowDividers?: number;
  /** Treat warnings as errors (so `ok` reflects them too). */
  strict?: boolean;
}

const PALETTE_GROUP = TAILWIND_PALETTE_COLORS.join("|");
const PREFIX_GROUP = COLOR_UTILITY_PREFIXES.join("|");

/**
 * `bg-blue-600`, `text-green-500/40`, `hover:border-rose-400`, `dark:to-sky-300`.
 * Matches a Tailwind color utility (optionally with a variant prefix like
 * `hover:` / `dark:`) bound to a named palette color + numeric shade.
 */
const RAW_COLOR_RE = new RegExp(
  `(?:^|[\\s"'\`:])(?:[a-z-]+:)*(?:${PREFIX_GROUP})-(?:${PALETTE_GROUP})-\\d{2,3}(?:/\\d{1,3})?`,
  "g",
);

/** Hex (#abc / #aabbcc / #aabbccdd) and oklch()/rgb()/hsl() literals. */
const COLOR_LITERAL_RE =
  /#[0-9a-fA-F]{3,8}\b|\b(?:oklch|rgba?|hsla?)\s*\(/g;

/**
 * A CSS color function wrapping a CSS variable — `hsl(var(--chart-1))`,
 * `rgb(var(--primary))`, etc. The design tokens are already full OKLCH colors,
 * so wrapping them in `hsl()` / `rgb()` produces **invalid CSS** and a silently
 * empty / uncolored result (e.g. a blank chart). tsc and the build never catch
 * it — the value is a string. The fix is to pass the token directly:
 * `var(--chart-1)`.
 */
const COLOR_FN_WRAPPING_VAR_RE =
  /\b(?:hsl|hsla|rgb|rgba|oklch|oklab|lab|lch|hwb|color)\s*\(\s*var\(\s*--/i;

/** Inline color via the style prop: style={{ color: ... }} / backgroundColor. */
const INLINE_STYLE_COLOR_RE =
  /style=\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b/;

/** A bold weight applied to a large text size (the "giant bold number" tell). */
const BOLD_VALUE_RE =
  /text-(?:xl|2xl|3xl|4xl|5xl|6xl)[^"'`]*\bfont-(?:bold|extrabold|black|semibold)|font-(?:bold|extrabold|black|semibold)[^"'`]*text-(?:xl|2xl|3xl|4xl|5xl|6xl)/;

/** Gradient utilities (bg-gradient-*, bg-linear-*). */
const GRADIENT_RE = /\bbg-(?:gradient|linear|radial|conic)-/;

/** Gradient *direction* keywords (e.g. `to-b` in `bg-gradient-to-b`) — not color stops. */
const GRADIENT_DIRECTIONS = new Set([
  "t",
  "tr",
  "r",
  "br",
  "b",
  "bl",
  "l",
  "tl",
]);

/** Standalone lucide-react icon usage as a JSX element. */
const ICON_IMPORT_RE = /from\s+["']lucide-react["']/;

/**
 * `border-input` is shadcn's input-border token; the kit defines control
 * surfaces only in `control-surface.ts`, so its appearance in generated code
 * means a hand-rolled control instead of `SearchInput` / `Select` / `FieldInput`.
 */
const RAW_CONTROL_SURFACE_RE = /\bborder-input\b/;

/** Colored hover backgrounds/gradients on interactive elements (e.g. hover:bg-primary). */
const COLORED_HOVER_RE = /\bhover:(?:bg|from|to|via)-(?:primary|destructive|success|warn|danger|blue|emerald|green|amber|red|indigo|violet|purple|pink|rose|sky|cyan|teal|lime|yellow|orange|fuchsia)\b/;

/**
 * Neon / glow shadow: an arbitrary `shadow-[…]` (or `drop-shadow-[…]`) whose
 * offsets are `0 0` (a halo around the element, not a drop shadow) — the
 * canonical "cyberpunk" tell. Matches `shadow-[0_0_20px_…]`,
 * `drop-shadow-[0px_0px_6px_…]`, etc. The kit's elevation is `shadow-card`.
 */
const GLOW_SHADOW_RE = /\b(?:drop-)?shadow-\[0(?:px)?_0(?:px)?_/;

/**
 * Hand-rolled top bar: the mobile menu trigger is rendered automatically by
 * `AppShell`, so any explicit `AppShellSidebarTrigger` in generated code means
 * the agent built a custom topbar (the thing we never want).
 */
const APP_SHELL_TRIGGER_RE = /\bAppShellSidebarTrigger\b/;

/**
 * Hand-rolled sidebar rail signature: a `<nav>` / `<aside>` element, laid out
 * as a vertical column (`flex-col`), at a fixed rail width (`w-48`…`w-80`).
 * Checked as three order-independent signals on one line to stay high-precision
 * (a generic `<aside>` won't carry all three). Use `StudioSidebar` instead.
 */
const NAV_RAIL_TAG_RE = /<(?:nav|aside)\b/;
const NAV_RAIL_COLUMN_RE = /\bflex-col\b/;
const NAV_RAIL_WIDTH_RE = /\bw-(?:48|52|56|60|64|72|80)\b/;

/**
 * UPPERCASE display text: the `uppercase` utility applied to a heading
 * (`<h1>`–`<h3>`) or to large text (`text-lg`+). A tiny `text-xs uppercase`
 * eyebrow is intentionally NOT matched (that's a legitimate label style).
 */
const UPPERCASE_HEADING_RE =
  /(<h[1-3]\b[^>]*\bclassName=[^>]*\buppercase\b)|(\buppercase\b[^"'`]*\btext-(?:lg|xl|2xl|3xl|4xl|5xl|6xl)\b)|(\btext-(?:lg|xl|2xl|3xl|4xl|5xl|6xl)\b[^"'`]*\buppercase\b)/;

/** Forcing a theme (forcedTheme="dark") — bypasses the theme generator. */
const FORCED_THEME_RE = /\bforcedTheme\b/;

/**
 * Hand-authored theme color variable: a CSS custom property the theme
 * generator owns, assigned a literal color. `--background: oklch(…)`,
 * `--sidebar-bg: #060d1a`, `--primary: hsl(…)`. Catches the "call
 * createTimbalTheme then punch through with hand-written tokens" anti-pattern.
 */
const HAND_AUTHORED_TOKEN_RE =
  /--(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring|sidebar[a-z-]*|chart-\d)\s*:\s*(?:oklch|hsla?|rgba?|#[0-9a-fA-F]{3,8})/i;

/**
 * Trend/delta context: a directional icon, a `trend`/`delta`/`change` prop, or
 * a signed percentage literal like `+8%` / `-3.2%`.
 */
const TREND_CONTEXT_RE =
  /\b(?:trend|delta|TrendingUp|TrendingDown|ArrowUp|ArrowDown|ArrowUpRight|ArrowDownRight|MoveUp|MoveDown)\b|[+\-]\d+(?:\.\d+)?\s*%/;

/** A positive/negative color (palette or semantic token) used as a trend tint. */
const TREND_COLOR_RE =
  /\b(?:text|bg|border)-(?:success|destructive|emerald|green|lime|teal|red|rose|orange|amber)(?:-\d{2,3})?(?:\/\d{1,3})?\b/;

const RESERVED_GRADIENT_SET = new Set<string>(RESERVED_GRADIENT_TOKENS);

function stripVariants(util: string): string {
  // bg-blue-600 -> base prefix for reserved-token allowance checks
  return util.replace(/^(?:[a-z-]+:)*/, "");
}

/** Short, safe description of a mis-typed argument for error messages. */
function describeArg(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  const t = typeof value;
  if (t === "object") {
    const keys = Object.keys(value as object).slice(0, 4);
    return keys.length
      ? `an object with keys { ${keys.join(", ")} }`
      : "an object";
  }
  return `a ${t}`;
}

function isCommentOrImport(line: string): boolean {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("/*") ||
    t.startsWith("import ") ||
    t.startsWith("export ")
  );
}

/**
 * Lint a single generated `.tsx` (or fragment) string for slop.
 *
 * @example
 * ```ts
 * const { ok, findings } = lintGeneratedUi(generatedTsx);
 * if (!ok) sendBackToAgent(formatLintReport(findings));
 * ```
 */
export function lintGeneratedUi(
  source: string,
  options: LintOptions = {},
): LintResult {
  if (typeof source !== "string") {
    throw new TypeError(
      `lintGeneratedUi(source, options?) expects the generated code as a string, but received ${describeArg(source)}. ` +
        "Pass the raw .tsx source — lintGeneratedUi(code) — not an object like { filename, source } and not a previous LintResult.",
    );
  }

  const maxIcons = options.maxIconsPerView ?? SLOP_BUDGETS.maxIconsPerView;
  const maxRowDividers = options.maxRowDividers ?? SLOP_BUDGETS.maxRowDividers;

  const findings: LintFinding[] = [];
  const lines = source.split("\n");

  let usesLucide = false;
  let iconUsageCount = 0;
  let dividerRunCount = 0;

  // Extract Page title if present
  let pageTitle: string | null = null;
  const pageTitleMatch = source.match(/<Page\s+[^>]*\btitle=(?:"([^"]+)"|\{["']([^"']+)["']\})/);
  if (pageTitleMatch) {
    pageTitle = (pageTitleMatch[1] || pageTitleMatch[2]).trim().toLowerCase();
  }

  const hasChat = /\b(?:TimbalChat|AppChatPanel|Thread)\b/.test(source);

  // Names imported from lucide-react, so we count their JSX usages as icons.
  const lucideNames = new Set<string>();

  const openCards: { type: string; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (ICON_IMPORT_RE.test(line)) {
      usesLucide = true;
      const named = line.match(/\{([^}]*)\}/);
      if (named) {
        for (const raw of named[1].split(",")) {
          const name = raw.trim().split(/\s+as\s+/)[0].trim();
          if (name) lucideNames.add(name);
        }
      }
      continue;
    }

    if (isCommentOrImport(line)) continue;

    // ── table inside card check ─────────────────────────────────────────
    const cardMatch = line.match(/<(Card|SurfaceCard|ArtifactCard)\b/);
    if (cardMatch) {
      const isSelfClosing = /\/>/.test(line) && line.indexOf(cardMatch[0]) < line.indexOf("/>");
      if (!isSelfClosing) {
        // A card opening while another is still open is card-in-card nesting.
        if (openCards.length > 0) {
          const parentCard = openCards[openCards.length - 1];
          findings.push({
            rule: "no-card-in-card",
            severity: "warn",
            line: lineNo,
            message: `Card inside card. A <${cardMatch[1]}> is nested inside the <${parentCard.type}> opened on L${parentCard.line}. Double borders/shadows add no information — group with spacing or a <Section> instead.`,
            snippet: line.trim().slice(0, 120),
          });
        }
        openCards.push({ type: cardMatch[1], line: lineNo });
      }
    }

    const closeMatch = line.match(/<\/(Card|SurfaceCard|ArtifactCard)\b/);
    if (closeMatch && openCards.length > 0) {
      const idx = openCards.map((c) => c.type).lastIndexOf(closeMatch[1]);
      if (idx !== -1) {
        openCards.splice(idx, 1);
      }
    }

    if (openCards.length > 0) {
      const tableMatch = line.match(/<(DataTable|table|Table)\b/);
      if (tableMatch) {
        const parentCard = openCards[openCards.length - 1];
        findings.push({
          rule: "no-table-in-card",
          severity: "error",
          line: lineNo,
          message: `Table inside card. Never wrap a <${tableMatch[1]}> or table inside a <${parentCard.type}> (opened on L${parentCard.line}). Place the table directly on the Page or Section instead.`,
          snippet: line.trim().slice(0, 120),
        });
      }
    }

    // ── raw palette colors ──────────────────────────────────────────────
    const rawColors = line.match(RAW_COLOR_RE);
    if (rawColors) {
      for (const m of rawColors) {
        findings.push({
          rule: "raw-color",
          severity: "error",
          line: lineNo,
          message:
            "Hardcoded palette color. Use a semantic token (text-primary, bg-muted, border-border, text-muted-foreground, …) so dark mode and rebranding work.",
          snippet: m.trim().replace(/^["'`:\s]+/, ""),
        });
      }
    }

    // ── color function wrapping a token (the silent empty-chart bug) ────
    // Higher precision than `color-literal`: it tells the agent the exact
    // reason (`--chart-N`/theme tokens are already OKLCH) and the exact fix.
    const wrapsTokenInColorFn = COLOR_FN_WRAPPING_VAR_RE.test(line);
    if (wrapsTokenInColorFn) {
      findings.push({
        rule: "chart-token-color-fn",
        severity: "error",
        line: lineNo,
        message:
          "Color function wrapping a token (e.g. hsl(var(--chart-1))). The --chart-N and theme tokens are already OKLCH colors — wrapping them in hsl()/rgb() is invalid CSS and renders an empty/uncolored chart (the build still passes). Pass the token directly: var(--chart-1), or let the app-kit charts use --chart-N automatically.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── hex / oklch / rgb literals (skip the gradient-token allowlist) ──
    // Suppressed when the line already triggered the more specific
    // `chart-token-color-fn` rule so the agent gets one clear message.
    const literals = wrapsTokenInColorFn ? null : line.match(COLOR_LITERAL_RE);
    if (literals) {
      findings.push({
        rule: "color-literal",
        severity: "error",
        line: lineNo,
        message:
          "Hardcoded color literal. Colors must come from the theme generator (createTimbalTheme) and semantic tokens — never inline hex/oklch/rgb.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── inline style colors ─────────────────────────────────────────────
    if (INLINE_STYLE_COLOR_RE.test(line)) {
      findings.push({
        rule: "inline-style-color",
        severity: "error",
        line: lineNo,
        message:
          "Inline style color. Move color to a semantic Tailwind token on className.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── hand-rolled control surface ─────────────────────────────────────
    if (RAW_CONTROL_SURFACE_RE.test(line)) {
      findings.push({
        rule: "raw-control-surface",
        severity: "warn",
        line: lineNo,
        message:
          "Hand-rolled control surface (border-input). Use a kit control — SearchInput, Select, DropdownMenu, FieldInput, FieldSelect — so it matches every other control.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── colored hover style check ───────────────────────────────────────
    if (COLORED_HOVER_RE.test(line)) {
      findings.push({
        rule: "no-colored-hover",
        severity: "warn",
        line: lineNo,
        message:
          "Colored hover background/gradient. House style: interactive cards and list items must use neutral hover states — never hard-code colored backgrounds or borders on hover.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── glow / neon shadow ──────────────────────────────────────────────
    if (GLOW_SHADOW_RE.test(line)) {
      findings.push({
        rule: "no-glow",
        severity: "error",
        line: lineNo,
        message:
          "Glow / neon shadow. shadow-[0_0_…] / drop-shadow-[0_0_…] halos are the canonical 'cyberpunk AI dashboard' tell. Use the kit elevation (shadow-card / shadow-card-elevated) — a 'glowing' brief is not permission to break the elevation system.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── hand-rolled topbar / sidebar rail ───────────────────────────────
    if (APP_SHELL_TRIGGER_RE.test(line)) {
      findings.push({
        rule: "no-custom-shell-chrome",
        severity: "error",
        line: lineNo,
        message:
          "Custom topbar. AppShell renders the mobile menu button itself — you do not need AppShellSidebarTrigger or a top bar. Default to no global topbar; put global actions in Page.actions or the sidebar.",
        snippet: line.trim().slice(0, 120),
      });
    }
    if (
      NAV_RAIL_TAG_RE.test(line) &&
      NAV_RAIL_COLUMN_RE.test(line) &&
      NAV_RAIL_WIDTH_RE.test(line)
    ) {
      findings.push({
        rule: "no-custom-shell-chrome",
        severity: "error",
        line: lineNo,
        message:
          "Hand-rolled sidebar rail. Don't build a custom <nav>/<aside> navigation column — use AppShell sidebar={<StudioSidebar workforces={items} selectedId={…} onSelect={…} />}. StudioSidebar nav items take an optional `icon`, so icon nav is no reason to go custom.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── UPPERCASE display text ──────────────────────────────────────────
    if (UPPERCASE_HEADING_RE.test(line)) {
      findings.push({
        rule: "no-uppercase-heading",
        severity: "error",
        line: lineNo,
        message:
          "UPPERCASE heading / display text. All-caps display text reads as shouty template chrome — use sentence case. Convey severity with StatusBadge/StatusDot tone, not screaming labels. (A small text-xs uppercase tracking-wide eyebrow is fine.)",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── theme bypass (forcedTheme / hand-authored tokens) ───────────────
    if (FORCED_THEME_RE.test(line)) {
      findings.push({
        rule: "theme-via-generator",
        severity: "error",
        line: lineNo,
        message:
          "forcedTheme bypasses the theme generator. Don't pin a theme — brand with createTimbalTheme({ brand }) + applyTimbalTheme (or a preset) so light/dark and rebranding keep working.",
        snippet: line.trim().slice(0, 120),
      });
    }
    if (HAND_AUTHORED_TOKEN_RE.test(line)) {
      findings.push({
        rule: "theme-via-generator",
        severity: "error",
        line: lineNo,
        message:
          "Hand-authored theme token. A theme color variable (--background, --primary, --sidebar-bg, …) is assigned a literal color — that punches through the theme generator. Generate the theme with createTimbalTheme({ brand }) instead of hand-writing OKLCH/hex token values.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── colored trend pill ──────────────────────────────────────────────
    // Fires only when a trend/delta context AND a positive/negative color
    // appear on the same line — the "loud green/red pill on every metric"
    // tell. Kept high-precision by requiring both signals.
    if (TREND_CONTEXT_RE.test(line) && TREND_COLOR_RE.test(line)) {
      findings.push({
        rule: "neutral-trend",
        severity: "warn",
        line: lineNo,
        message:
          "Colored trend indicator. House style: don't tint deltas green/red on every metric — show a trend only when the change is the point, and keep it muted (text-muted-foreground).",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── bold giant values ───────────────────────────────────────────────
    if (BOLD_VALUE_RE.test(line)) {
      findings.push({
        rule: "bold-metric",
        severity: "warn",
        line: lineNo,
        message:
          "Bold large value. House style: metric values use font-normal, not bold — bold giant numbers read as a template.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── gradient on a non-chrome surface ────────────────────────────────
    if (GRADIENT_RE.test(line)) {
      // Allow gradients composed purely from reserved chrome tokens.
      const fromTo = line.match(
        new RegExp(`(?:from|via|to)-([a-z-]+)`, "g"),
      );
      const colorStops = (fromTo ?? [])
        .map((u) => stripVariants(u).replace(/^(?:from|via|to)-/, ""))
        // Drop gradient direction keywords (`to-b`, `to-tr`, …) — not colors.
        .filter((token) => !GRADIENT_DIRECTIONS.has(token));
      const allReserved =
        colorStops.length > 0 &&
        colorStops.every((token) => RESERVED_GRADIENT_SET.has(token));
      if (!allReserved) {
        findings.push({
          rule: "data-gradient",
          severity: "warn",
          line: lineNo,
          message:
            "Gradient outside chrome. Gradients are reserved for buttons / elevated / modal / playground — never a data card, tile, or table.",
          snippet: line.trim().slice(0, 120),
        });
      }
    }

    // ── per-row dividers (consecutive bordered rows) ────────────────────
    if (/\b(?:border-t|border-b|divide-y)\b/.test(line)) {
      dividerRunCount++;
      if (dividerRunCount === maxRowDividers + 1) {
        findings.push({
          rule: "row-divider",
          severity: "warn",
          line: lineNo,
          message:
            "Divider on every row. Prefer spacing (gap-*) or zebra striping over a rule under each list item.",
          snippet: line.trim().slice(0, 120),
        });
      }
    } else if (line.trim() !== "" && !line.includes("className")) {
      // Reset the run only on substantive non-class lines so wrapped
      // className strings don't break the streak.
      if (!/^\s*[)>}/]/.test(line)) dividerRunCount = 0;
    }

    // ── icon usages (count JSX of imported lucide names) ────────────────
    if (usesLucide && lucideNames.size > 0) {
      for (const name of lucideNames) {
        const usage = new RegExp(`<${name}\\b`, "g");
        const hits = line.match(usage);
        if (hits) iconUsageCount += hits.length;
      }
    }

    // ── title repetition ────────────────────────────────────────────────
    if (pageTitle) {
      const titleMatch = line.match(/<(Section|ChartPanel|Card|DataTable|SurfaceCard)\s+[^>]*\btitle=(?:"([^"]+)"|\{["']([^"']+)["']\})/);
      if (titleMatch) {
        const element = titleMatch[1];
        const titleVal = (titleMatch[2] || titleMatch[3]).trim().toLowerCase();
        if (titleVal === pageTitle || titleVal.includes(pageTitle) || pageTitle.includes(titleVal)) {
          findings.push({
            rule: "no-title-repetition",
            severity: "warn",
            line: lineNo,
            message: `Title repetition. The <${element}> title "${titleVal}" repeats or is very similar to the <Page> title "${pageTitle}". Drop the title from the child element or use a title-less Section to avoid redundant headings.`,
            snippet: line.trim().slice(0, 120),
          });
        }
      }
    }

    // ── chat wrapping / custom header check ──────────────────────────────
    if (hasChat) {
      const wrappingMatch = line.match(/<(Card|Section|SurfaceCard|FormSection|SettingsSection)\b/);
      if (wrappingMatch) {
        findings.push({
          rule: "no-chat-wrapping",
          severity: "error",
          line: lineNo,
          message: `Chat component wrapping. Never wrap TimbalChat or AppChatPanel inside a <${wrappingMatch[1]}> or custom bordered container. Let the chat component fill the page or slot directly.`,
          snippet: line.trim().slice(0, 120),
        });
      }

      const headingMatch = line.match(/<(h[1-6])\b/);
      if (headingMatch) {
        findings.push({
          rule: "no-chat-wrapping",
          severity: "error",
          line: lineNo,
          message: `Custom heading in chat view. Do not render custom <${headingMatch[1]}> headings on the chat page. Pass welcome.heading to TimbalChat if you need to customize the welcome title.`,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }

  if (usesLucide && iconUsageCount > maxIcons) {
    findings.push({
      rule: "icon-spam",
      severity: "warn",
      line: 1,
      message: `Too many icons (${iconUsageCount} > ${maxIcons}). Icons should mark actions/nav/status — not decorate every label, tile, and card.`,
      snippet: `${iconUsageCount} lucide-react icon usages`,
    });
  }

  const effectiveErrors = findings.filter(
    (f) => f.severity === "error" || (options.strict && f.severity === "warn"),
  ).length;

  return {
    findings,
    errorCount: findings.filter((f) => f.severity === "error").length,
    warnCount: findings.filter((f) => f.severity === "warn").length,
    ok: effectiveErrors === 0,
  };
}

/**
 * Render lint findings as a compact, agent- and human-readable report.
 * Empty string when there are no findings.
 */
export function formatLintReport(findings: LintFinding[]): string {
  if (!Array.isArray(findings)) {
    throw new TypeError(
      `formatLintReport(findings) expects the findings array, but received ${describeArg(findings)}. ` +
        "Pass result.findings — formatLintReport(lintGeneratedUi(code).findings) — not the whole LintResult.",
    );
  }
  if (findings.length === 0) return "";
  const lines = findings
    .slice()
    .sort((a, b) => a.line - b.line)
    .map((f) => {
      const tag = f.severity === "error" ? "ERROR" : "warn ";
      return `  ${tag} L${f.line} [${f.rule}] ${f.message}\n        → ${f.snippet}`;
    });
  const errs = findings.filter((f) => f.severity === "error").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  return `Anti-slop review: ${errs} error(s), ${warns} warning(s)\n${lines.join("\n")}`;
}
