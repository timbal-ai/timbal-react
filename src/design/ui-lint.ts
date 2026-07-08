/**
 * Deterministic correctness linter for generated Timbal UI code (v2).
 *
 * Runs a dependency-free line scan over a `.tsx` string and flags patterns
 * that **silently break at runtime or punch through the theme system**:
 * hardcoded colors, `hsl(var(--token))` wrapping (invalid CSS → blank
 * charts), unsafe chart dataKeys, inline style colors, hand-authored theme
 * tokens / `forcedTheme`, and chat surfaces wrapped in bordered containers.
 *
 * ## v2 severity policy — correctness only
 *
 * Every check in this file is an **`error`**: it blocks regardless of model
 * tier because the output is objectively broken (invalid CSS, dead dark
 * mode, un-rebrandable app), not merely ugly.
 *
 * **Taste rules are no longer linted.** Icon budgets, bold metrics, glow,
 * uppercase headings, card nesting, hand-rolled rails and controls moved to
 * the screenshot critique rubric (the `timbal-ui` skill's `critique.md`) —
 * judged on rendered output, where taste is actually visible. On fork-first
 * projects the component source is project-owned, so "hand-rolled control"
 * checks would flag the design system itself. The corresponding
 * `HOUSE_RULES` entries are annotated `enforcement: "prompt-only"`.
 *
 * The linter intentionally avoids an AST dependency — the checks are
 * line/regex heuristics tuned for high precision. Feed
 * `formatLintReport(findings)` back to the generating agent (see
 * `reviewGeneratedUi`) so it can self-correct.
 *
 * Public, documented API — exported from the package root and `/app`.
 */

import {
  COLOR_UTILITY_PREFIXES,
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
  /**
   * Legacy knob (pre-4.0): treated warnings as errors. v2 emits no
   * warn-tier findings, so this flag has no effect — accepted so existing
   * callers and the `--strict` CLI flag keep working.
   */
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
 * The sanctioned places a raw color literal belongs: as *intent* fed to the
 * theme system. Legacy: `createTimbalTheme({ brand: "#4f46e5" })`. Fork-first:
 * the `color` fields of `dna.json` (JSON, not linted) — but theme-intent
 * objects built in TS (`brand:`/`accent:`/`swatch:` keys) stay allowed so
 * preset catalogs and intent builders don't false-positive. Hand-authored
 * theme *tokens* (`--primary: #…`) stay blocked by `HAND_AUTHORED_TOKEN_RE`.
 */
const THEME_INTENT_COLOR_RE =
  /\bcreateTimbalTheme\b|(?:^|[\s,{(])(?:brand|accent|swatch)\s*:/;

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

/**
 * A chart series `dataKey` string literal containing a space or `%` — an unsafe
 * key. The chart layer maps each `dataKey` to a CSS variable `--color-<dataKey>`,
 * so `"Water %"` becomes `--color-Water %` (invalid CSS) and the series renders
 * black/uncolored. The fix is a safe identifier key + a separate `label`. Only
 * whitespace and `%` are flagged (unambiguously CSS-breaking); other punctuation
 * is left alone to stay high-precision.
 */
const UNSAFE_DATA_KEY_RE = /\bdataKey\s*[:=]\s*\{?\s*["'][^"']*[ \t%][^"']*["']/;

/** Inline color via the style prop: style={{ color: ... }} / backgroundColor. */
const INLINE_STYLE_COLOR_RE =
  /style=\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b/;

/**
 * A SOLID status/selection fill (`bg-success`, `hover:bg-info`, …) whose
 * label is not guaranteed readable. The tokens' `*-foreground` pairs are
 * contrast-gated by the DNA compiler, so `bg-success text-success-foreground`
 * is always legible — but `bg-success` alone inherits the page foreground
 * (near-black on a saturated green: invisible). Tinted fills (`bg-success/15`)
 * and subtle surfaces (`bg-success-subtle`) pair with tone text and are fine.
 * Textless indicator dots are exempted via `rounded-full`.
 */
const STATUS_FILLS = ["success", "warning", "destructive", "info", "selection"];
const SOLID_STATUS_FILL_RE = new RegExp(
  `(?:^|[\\s"'\`])(?:[a-z-]+:)*bg-(${STATUS_FILLS.join("|")})(?=[\\s"'\`]|$)`,
  "g",
);

/**
 * Button opening tags — buttons must come from the variant system (default /
 * secondary / outline / ghost / destructive / link), whose label colors are
 * contrast-gated by the DNA compiler. A hand-painted fill (`bg-success`,
 * `bg-primary`, `bg-linear-to-r …`, `bg-[…]`) breaks that pairing — the
 * classic failure is a saturated green button with an unreadable label.
 */
const BUTTON_TAG_OPEN_RE =
  /<(?:[A-Za-z][\w]*\.)?(?:Button|IconButton|LoadingButton|TooltipIconButton)\b/;

/**
 * An UNPREFIXED background fill utility. State-scoped surfaces
 * (`hover:bg-…`, `data-[state=open]:bg-accent`) are deliberately allowed —
 * their `bg-` is preceded by `:` so the leading character class rejects
 * them. Non-color `bg-*` utilities (clip/position/size/repeat/blend) and
 * no-op fills (`bg-transparent`, `bg-inherit`, `bg-none`) are excluded.
 */
const BUTTON_CUSTOM_FILL_RE = new RegExp(
  "(?:^|[\\s\"'`{])bg-(?!transparent\\b|inherit\\b|none\\b|clip-|origin-|blend-|cover\\b|contain\\b|auto\\b|center\\b|top\\b|bottom\\b|left\\b|right\\b|fixed\\b|local\\b|scroll\\b|no-repeat|repeat)[a-z\\[]",
);

/** First `>` on a line that is a tag close, not an arrow function's `=>`. */
function tagCloseIndex(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ">" && text[i - 1] !== "=") return i;
  }
  return -1;
}

/**
 * Extract the parts of `line` that sit inside a Button-family opening tag,
 * carrying `inTag` state across lines (attributes often span lines).
 */
function buttonTagSegments(
  line: string,
  inTag: boolean,
): { segments: string[]; inTag: boolean } {
  const segments: string[] = [];
  let idx = 0;
  while (idx < line.length) {
    const rest = line.slice(idx);
    if (inTag) {
      const close = tagCloseIndex(rest);
      if (close === -1) {
        segments.push(rest);
        idx = line.length;
      } else {
        segments.push(rest.slice(0, close));
        idx += close + 1;
        inTag = false;
      }
    } else {
      const open = BUTTON_TAG_OPEN_RE.exec(rest);
      if (!open) break;
      idx += open.index + open[0].length;
      inTag = true;
    }
  }
  return { segments, inTag };
}

/** Forcing a theme (forcedTheme="dark") — bypasses the theme system. */
const FORCED_THEME_RE = /\bforcedTheme\b/;

/**
 * Hand-authored theme color variable: a CSS custom property the theme system
 * owns, assigned a literal color. `--background: oklch(…)`,
 * `--sidebar-bg: #060d1a`, `--primary: hsl(…)`. Catches the "punch through
 * the compiled tokens with hand-written values" anti-pattern in TS/TSX.
 * (`tokens.css` itself is generated and gated by `timbal-dna check`.)
 */
const HAND_AUTHORED_TOKEN_RE =
  /--(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring|sidebar[a-z-]*|chart-\d)\s*:\s*(?:oklch|hsla?|rgba?|#[0-9a-fA-F]{3,8})/i;

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
 * Lint a single generated `.tsx` (or fragment) string for correctness.
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
  void options;

  const findings: LintFinding[] = [];
  const lines = source.split("\n");

  const hasChat = /\b(?:TimbalChat|AppChatPanel|Thread)\b/.test(source);
  let inButtonTag = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (isCommentOrImport(line)) continue;

    // ── custom fill painted on a Button (variant-system bypass) ─────────
    // Runs first because it tracks open-tag state across lines.
    {
      const scan = buttonTagSegments(line, inButtonTag);
      inButtonTag = scan.inTag;
      if (scan.segments.some((seg) => BUTTON_CUSTOM_FILL_RE.test(seg))) {
        findings.push({
          rule: "button-custom-fill",
          severity: "error",
          line: lineNo,
          message:
            "Custom fill painted on a Button. Buttons come from the variant system ONLY — default (dark), secondary (white), outline, ghost, destructive, link — whose label colors are contrast-gated by the compiler. A hand-painted bg-* (bg-success, bg-primary, gradients, arbitrary values) breaks that pairing and yields unreadable labels (e.g. dark text on saturated green). Pick the closest variant; status color belongs in a Badge or icon, not the button fill. (State-scoped surfaces like hover:bg-…/10 are allowed.)",
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
            "Hardcoded palette color. Use a semantic token (text-primary, bg-muted, border-border, text-muted-foreground, …) so dark mode and re-theming work. New color roles belong in the design DNA (dna.json), not inline.",
          snippet: m.trim().replace(/^["'`:\s]+/, ""),
        });
      }
    }

    // ── color function wrapping a token (the silent empty-chart bug) ────
    const wrapsTokenInColorFn = COLOR_FN_WRAPPING_VAR_RE.test(line);
    if (wrapsTokenInColorFn) {
      findings.push({
        rule: "chart-token-color-fn",
        severity: "error",
        line: lineNo,
        message:
          "Color function wrapping a token (e.g. hsl(var(--chart-1))). The --chart-N and theme tokens are already OKLCH colors — wrapping them in hsl()/rgb() is invalid CSS and renders an empty/uncolored chart (the build still passes). Pass the token directly: var(--chart-1).",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── unsafe chart dataKey (space / % → broken --color-<key>) ─────────
    if (UNSAFE_DATA_KEY_RE.test(line)) {
      findings.push({
        rule: "chart-data-key",
        severity: "error",
        line: lineNo,
        message:
          "Unsafe chart dataKey (contains a space or %). The chart layer maps each dataKey to a CSS variable --color-<dataKey>, so a key like \"Water %\" yields invalid CSS and the series renders black/uncolored. Use a safe identifier key and put the human name in a separate `label` — e.g. { dataKey: \"waterPct\", label: \"Water %\" }.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── hex / oklch / rgb literals (skip sanctioned theme-intent lines) ──
    // Suppressed when the line already triggered the more specific
    // `chart-token-color-fn` rule so the agent gets one clear message.
    const literals =
      wrapsTokenInColorFn || THEME_INTENT_COLOR_RE.test(line)
        ? null
        : line.match(COLOR_LITERAL_RE);
    if (literals) {
      findings.push({
        rule: "color-literal",
        severity: "error",
        line: lineNo,
        message:
          "Hardcoded color literal. Colors come from the compiled design tokens — never inline hex/oklch/rgb in markup. Change the design DNA (dna.json) or, in legacy projects, the createTimbalTheme intent.",
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

    // ── solid status fill without its contrast-gated foreground ────────
    if (!line.includes("rounded-full")) {
      for (const m of line.matchAll(SOLID_STATUS_FILL_RE)) {
        const tone = m[1];
        if (!line.includes(`text-${tone}-foreground`)) {
          findings.push({
            rule: "status-fill-foreground",
            severity: "error",
            line: lineNo,
            message:
              `Solid bg-${tone} without text-${tone}-foreground — the label inherits the page foreground and can be unreadable on the saturated fill. Pair the fill with its contrast-gated foreground (bg-${tone} text-${tone}-foreground), use the Badge "*-solid" variants, or use a tinted chip (bg-${tone}/15 text-${tone}).`,
            snippet: line.trim().slice(0, 120),
          });
        }
      }
    }

    // ── theme bypass (forcedTheme / hand-authored tokens) ───────────────
    if (FORCED_THEME_RE.test(line)) {
      findings.push({
        rule: "theme-via-generator",
        severity: "error",
        line: lineNo,
        message:
          "forcedTheme bypasses the theme system. Don't pin a theme — set defaultMode in the design DNA (or createTimbalTheme in legacy projects) so light/dark and re-theming keep working.",
        snippet: line.trim().slice(0, 120),
      });
    }
    if (HAND_AUTHORED_TOKEN_RE.test(line)) {
      findings.push({
        rule: "theme-via-generator",
        severity: "error",
        line: lineNo,
        message:
          "Hand-authored theme token. A theme color variable (--background, --primary, --sidebar-bg, …) is assigned a literal color — that punches through the compiled token system. Change the design DNA (dna.json → dna:compile) or the createTimbalTheme intent instead.",
        snippet: line.trim().slice(0, 120),
      });
    }

    // ── chat wrapped in a bordered container (layout break) ─────────────
    if (hasChat) {
      const wrappingMatch = line.match(/<(Card|Section|SurfaceCard|FormSection|SettingsSection)\b/);
      if (wrappingMatch) {
        findings.push({
          rule: "no-chat-wrapping",
          severity: "error",
          line: lineNo,
          message: `Chat component wrapping. Never wrap TimbalChat or AppChatPanel inside a <${wrappingMatch[1]}> or custom bordered container — the chat is a full-bleed surface that owns its own layout, welcome screen, and scroll. Let it fill the page or slot directly.`,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }

  return {
    findings,
    errorCount: findings.filter((f) => f.severity === "error").length,
    warnCount: findings.filter((f) => f.severity === "warn").length,
    ok: findings.every((f) => f.severity !== "error"),
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
