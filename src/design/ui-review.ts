/**
 * Layer 4 of the anti-slop system: the critique loop.
 *
 * `reviewGeneratedUi` runs the deterministic linter (Layer 2) and packages the
 * result into something a generating agent can act on in one round-trip — a
 * pass/fail verdict plus a ready-to-send revision prompt that names the exact
 * lines and fixes. The system prompt string (`UI_REVIEW_AGENT_INSTRUCTIONS`)
 * teaches the model to self-review *before* it returns code, so the loop is
 * usually closed without a second model call.
 *
 * Public, documented API — exported from the package root and `/app`.
 */

import {
  formatLintReport,
  lintGeneratedUi,
  type LintOptions,
  type LintResult,
} from "./ui-lint";

export interface ReviewResult {
  /** Raw linter output. */
  lint: LintResult;
  /** True when no blocking (error-severity, or any warning in strict mode) findings remain. */
  passed: boolean;
  /** Compact human/agent-readable report ("" when clean). */
  report: string;
  /**
   * A ready-to-send follow-up prompt instructing the agent to fix the findings,
   * or `null` when the UI passed. Send this back to the model and re-run
   * `reviewGeneratedUi` on its next output until `passed` is true.
   */
  revisionPrompt: string | null;
}

/**
 * Review a generated `.tsx` string for slop and produce an actionable verdict.
 *
 * @example
 * ```ts
 * let code = await generate(userPrompt);
 * for (let i = 0; i < 2; i++) {
 *   const review = reviewGeneratedUi(code, { strict: true });
 *   if (review.passed) break;
 *   code = await generate(review.revisionPrompt!); // agent fixes named issues
 * }
 * ```
 */
export function reviewGeneratedUi(
  source: string,
  options: LintOptions = {},
): ReviewResult {
  const lint = lintGeneratedUi(source, options);
  const report = formatLintReport(lint.findings);

  if (lint.ok) {
    return { lint, passed: true, report, revisionPrompt: null };
  }

  const revisionPrompt = [
    "The generated UI failed the Timbal anti-slop review. Fix every issue below, then return the corrected code only.",
    "",
    report,
    "",
    "Rules: colors come only from semantic tokens (text-primary, bg-muted, border-border, text-muted-foreground, …) — never palette colors, hex, or oklch. Icons mark actions/nav/status, not decoration. Metric values use font-normal. No gradients on data surfaces. No divider under every row. Do not change anything that already passed.",
  ].join("\n");

  return { lint, passed: false, report, revisionPrompt };
}

/**
 * Append to a UI-generation agent's system prompt so it self-reviews before
 * returning code. Pairs with `APP_KIT_AGENT_INSTRUCTIONS` and
 * `THEME_AGENT_INSTRUCTIONS`.
 */
export const UI_REVIEW_AGENT_INSTRUCTIONS = `
## Self-review before returning UI (anti-slop)

Before you output any generated UI code, silently re-read it and fix anything that matches the slop checklist — this is the same rubric an automated linter applies, so output that fails it will be rejected and sent back:

- **No hardcoded colors.** Every color is a semantic token (\`text-primary\`, \`bg-muted\`, \`border-border\`, \`text-muted-foreground\`, \`bg-destructive\`, …). No \`text-blue-600\`, no \`#hex\`, no \`oklch(...)\`, no \`style={{ color }}\`.
- **No decorative icons.** An icon must mark an action, nav target, or status. Remove icons that sit beside a label that already says the thing. Aim for very few icons per view.
- **Muted, sparse trends.** No colored up/down pill on every metric. Show a trend only when the change is the point.
- **Normal-weight values.** Metric numbers use \`font-normal\`, never \`font-bold\` at large sizes.
- **No card-in-card, no per-row dividers, no gradients on data surfaces.** Group with spacing/Sections; reserve gradients for chrome.
- **Compose from blocks.** Prefer \`MetricRow\` / \`MetricChartCard\` / \`DataTable\` / \`IntegrationCard\` over hand-assembled primitives.

If a check fails, fix it and re-read once more. Only return code that would pass clean.
`.trim();
