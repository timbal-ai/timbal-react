/**
 * `timbal-ui-lint` — standalone CLI wrapper around the anti-slop reviewer.
 *
 * Bundled dependency-free (the linter is pure string ops over a `.tsx` source +
 * the static `ui-vocabulary` data), so it runs anywhere Node runs — including a
 * compose worktree whose `node_modules` was never installed. This is the
 * deterministic gate the Timbal Composer pipeline runs on generated UI before a
 * turn is allowed to finish.
 *
 * Usage:
 *   timbal-ui-lint [--strict] [--max-icons N] [--max-row-dividers N] [--json]
 *                  <file.tsx> [more files...]
 *
 * Exit codes:
 *   0  every file passed
 *   1  at least one file failed review (slop findings)
 *   2  usage error (no files, unreadable input)
 *
 * Output (default): a per-file report plus a single combined revision prompt on
 * stdout, ready to feed straight back to the generating agent.
 * Output (`--json`): `{ ok, files: [{ file, passed, report, findings }],
 * revisionPrompt }`.
 */

import { readFileSync } from "node:fs";

import { reviewGeneratedUi } from "../design/ui-review";
import type { LintFinding } from "../design/ui-lint";

interface FileResult {
  file: string;
  passed: boolean;
  report: string;
  findings: LintFinding[];
  revisionPrompt: string | null;
  error?: string;
}

interface ParsedArgs {
  strict: boolean;
  json: boolean;
  maxIcons?: number;
  maxRowDividers?: number;
  files: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { strict: false, json: false, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--strict":
        parsed.strict = true;
        break;
      case "--json":
        parsed.json = true;
        break;
      case "--max-icons":
        parsed.maxIcons = Number(argv[++i]);
        break;
      case "--max-row-dividers":
        parsed.maxRowDividers = Number(argv[++i]);
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          process.stderr.write(`timbal-ui-lint: unknown flag ${arg}\n`);
          process.exit(2);
        }
        parsed.files.push(arg);
    }
  }
  return parsed;
}

function printUsage(): void {
  process.stdout.write(
    "Usage: timbal-ui-lint [--strict] [--max-icons N] [--max-row-dividers N] [--json] <file.tsx> [...]\n",
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.files.length === 0) {
    printUsage();
    process.exit(2);
  }

  const reviewOptions = {
    strict: args.strict,
    maxIconsPerView: Number.isFinite(args.maxIcons) ? args.maxIcons : undefined,
    maxRowDividers: Number.isFinite(args.maxRowDividers)
      ? args.maxRowDividers
      : undefined,
  };

  const results: FileResult[] = [];

  for (const file of args.files) {
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch (e) {
      // Unreadable file (deleted mid-turn, bad glob) — surface but don't crash
      // the whole gate over one path.
      results.push({
        file,
        passed: true,
        report: "",
        findings: [],
        revisionPrompt: null,
        error: e instanceof Error ? e.message : String(e),
      });
      continue;
    }

    const review = reviewGeneratedUi(source, reviewOptions);
    results.push({
      file,
      passed: review.passed,
      report: review.report,
      findings: review.lint.findings,
      revisionPrompt: review.revisionPrompt,
    });
  }

  const failed = results.filter((r) => !r.passed);
  const ok = failed.length === 0;

  if (args.json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok,
          files: results.map(({ revisionPrompt, ...rest }) => rest),
          revisionPrompt: ok ? null : buildCombinedPrompt(failed),
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(ok ? 0 : 1);
  }

  if (ok) {
    process.stdout.write("Anti-slop review passed.\n");
    process.exit(0);
  }

  for (const r of failed) {
    process.stdout.write(`\n=== ${r.file} ===\n${r.report}\n`);
  }
  process.stdout.write(`\n${buildCombinedPrompt(failed)}\n`);
  process.exit(1);
}

/**
 * Merge the per-file revision prompts into one message the agent can act on in
 * a single pass. Each file's findings are namespaced by path so the agent knows
 * which file to edit.
 */
function buildCombinedPrompt(failed: FileResult[]): string {
  const header =
    "The generated UI failed the Timbal anti-slop review. Fix every issue below, then re-check. Do not change anything that already passed.";
  const perFile = failed
    .filter((r) => r.report)
    .map((r) => `\n--- ${r.file} ---\n${r.report}`)
    .join("\n");
  const rules =
    "Rules: colors come only from semantic tokens (text-primary, bg-muted, border-border, text-muted-foreground, …) — never palette colors, hex, or oklch. Icons mark actions/nav/status, not decoration. Metric values use font-normal. No card-in-card, no per-row dividers, no gradients on data surfaces. Compose from kit blocks (MetricRow, DataTable, AlertCard) instead of hand-rolled primitives.";
  return [header, perFile, "", rules].join("\n");
}

main();
