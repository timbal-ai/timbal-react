/**
 * `timbal-dna` — the Design DNA compiler CLI.
 *
 * Bundled dependency-free so it runs anywhere Node runs (including compose
 * worktrees). This is how a project's `dna.json` becomes `tokens.css`, and
 * how the pipeline's gate detects drift (hand-edited tokens).
 *
 * Commands:
 *   timbal-dna compile   [--dna <path>] [--out <path>] [--quiet]
 *       Validate + compile dna.json → tokens.css. Prints the compile report
 *       (contrast adjustments, warnings).
 *   timbal-dna check     [--dna <path>] [--out <path>]
 *       Recompile and byte-compare against the tokens.css on disk. Exit 1 on
 *       drift — tokens.css is generated, hand edits belong in dna.json.
 *   timbal-dna validate  [--dna <path>] [--json]
 *       Schema + contrast validation without writing anything.
 *   timbal-dna registries [--json]
 *       List the curated menus (font pairings, status sets, motion presets,
 *       chart recipes) an agent can pick from.
 *
 * Default paths (resolved from cwd): --dna src/design/dna.json,
 * --out src/design/tokens.css.
 *
 * Exit codes: 0 ok · 1 failed (invalid DNA / drift) · 2 usage error.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { compileDna, DNA_COMPILER_VERSION } from "../design/dna/compile";
import { DnaValidationError, parseDna } from "../design/dna/schema";
import {
  FONT_PAIRINGS,
  MOTION_PRESETS,
  STATUS_SETS,
} from "../design/dna/registries";

interface Args {
  command: string | null;
  dna: string;
  out: string;
  json: boolean;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: null,
    dna: "src/design/dna.json",
    out: "src/design/tokens.css",
    json: false,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "compile":
      case "check":
      case "validate":
      case "registries":
        args.command = a;
        break;
      case "--dna":
        args.dna = argv[++i] ?? args.dna;
        break;
      case "--out":
        args.out = argv[++i] ?? args.out;
        break;
      case "--json":
        args.json = true;
        break;
      case "--quiet":
        args.quiet = true;
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        process.stderr.write(`timbal-dna: unknown argument "${a}"\n`);
        process.exit(2);
    }
  }
  return args;
}

function printUsage(): void {
  process.stdout.write(
    `timbal-dna v${DNA_COMPILER_VERSION} — compile a project's design DNA to tokens.css

Usage:
  timbal-dna compile    [--dna src/design/dna.json] [--out src/design/tokens.css] [--quiet]
  timbal-dna check      [--dna …] [--out …]     # exit 1 when tokens.css drifted from dna.json
  timbal-dna validate   [--dna …] [--json]      # schema + contrast report, no writes
  timbal-dna registries [--json]                # curated font pairings, status sets, motion presets
`,
  );
}

function loadDna(path: string): ReturnType<typeof parseDna> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    process.stderr.write(
      `timbal-dna: cannot read ${path} — create the design DNA first (see the timbal-ui skill), or pass --dna <path>.\n`,
    );
    process.exit(2);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(
      `timbal-dna: ${path} is not valid JSON: ${e instanceof Error ? e.message : String(e)}\n`,
    );
    process.exit(1);
  }
  try {
    return parseDna(json);
  } catch (e) {
    if (e instanceof DnaValidationError) {
      process.stderr.write(`timbal-dna: ${e.message}\n`);
      process.exit(1);
    }
    throw e;
  }
}

function printReport(
  report: { adjustments: string[]; warnings: string[] },
  quiet: boolean,
): void {
  if (quiet) return;
  for (const a of report.adjustments) {
    process.stdout.write(`  adjusted  ${a}\n`);
  }
  for (const w of report.warnings) {
    process.stdout.write(`  warning   ${w}\n`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command) {
    printUsage();
    process.exit(2);
  }

  if (args.command === "registries") {
    const data = {
      fontPairings: FONT_PAIRINGS.map(({ id, label, vibe }) => ({ id, label, vibe })),
      statusSets: STATUS_SETS.map(({ id, label }) => ({ id, label })),
      motionPresets: MOTION_PRESETS.map(({ id, label }) => ({ id, label })),
      chartRecipes: [
        { id: "categorical", label: "Hue-spread categorical (default for neutral brands)" },
        { id: "brand", label: "Brand-anchored rotations (default for chromatic brands)" },
        { id: "monochrome", label: "Single-hue lightness ladder" },
      ],
      surfaceStrategies: [
        { id: "flat", label: "Canvas = cards; borders separate" },
        { id: "panel", label: "Gray canvas, elevated lighter cards (classic SaaS)" },
        { id: "console", label: "Dark-first dense near-black canvas" },
      ],
    };
    if (args.json) {
      process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    } else {
      process.stdout.write("Font pairings:\n");
      for (const f of data.fontPairings) {
        process.stdout.write(`  ${f.id.padEnd(22)} ${f.label}  [${f.vibe.join(", ")}]\n`);
      }
      process.stdout.write("\nStatus sets:      " + data.statusSets.map((s) => s.id).join(", "));
      process.stdout.write("\nMotion presets:   " + data.motionPresets.map((m) => m.id).join(", "));
      process.stdout.write("\nChart recipes:    " + data.chartRecipes.map((c) => c.id).join(", "));
      process.stdout.write("\nSurface strategies: " + data.surfaceStrategies.map((s) => s.id).join(", ") + "\n");
    }
    process.exit(0);
  }

  const dnaPath = resolve(args.dna);
  const outPath = resolve(args.out);
  const dna = loadDna(dnaPath);

  if (args.command === "validate") {
    const result = compileDna(dna);
    if (args.json) {
      process.stdout.write(
        JSON.stringify(
          { ok: true, fingerprint: result.fingerprint, defaultMode: result.defaultMode, report: result.report },
          null,
          2,
        ) + "\n",
      );
    } else {
      process.stdout.write(`DNA valid (fingerprint ${result.fingerprint}, default mode ${result.defaultMode}).\n`);
      printReport(result.report, false);
    }
    process.exit(0);
  }

  if (args.command === "compile") {
    const result = compileDna(dna);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, result.css + "\n", "utf8");
    if (!args.quiet) {
      process.stdout.write(
        `Compiled ${args.dna} → ${args.out} (fingerprint ${result.fingerprint}).\n`,
      );
      printReport(result.report, args.quiet);
    }
    process.exit(0);
  }

  if (args.command === "check") {
    const result = compileDna(dna);
    let onDisk: string;
    try {
      onDisk = readFileSync(outPath, "utf8");
    } catch {
      process.stderr.write(
        `timbal-dna check: ${args.out} is missing — run \`timbal-dna compile\` (or the project's dna:compile script).\n`,
      );
      process.exit(1);
    }
    if (onDisk.trim() !== result.css.trim()) {
      process.stderr.write(
        `timbal-dna check: ${args.out} has drifted from ${args.dna}.\n` +
          `tokens.css is GENERATED — never hand-edit it. Make the change in dna.json (or overrides) and run \`timbal-dna compile\`.\n` +
          `If you edited dna.json and forgot to recompile, run the compile now to fix this.\n`,
      );
      process.exit(1);
    }
    process.stdout.write("tokens.css matches dna.json.\n");
    process.exit(0);
  }
}

main();
