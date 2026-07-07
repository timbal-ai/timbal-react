import { describe, expect, test } from "bun:test";

import { parseColor, relativeLuminance } from "../oklch";
import { compileDna } from "./compile";
import { DnaValidationError, parseDna, type DesignDna } from "./schema";
import {
  DENSITY_SPECS,
  ELEVATION_LADDERS,
  FONT_PAIRINGS,
  MOTION_PRESETS,
  STATUS_SETS,
} from "./registries";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MINIMAL: DesignDna = {
  version: 1,
  color: { brand: "#4f46e5" },
};

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);
  const end = css.indexOf("\n}", start);
  return css.slice(start, end);
}

function tokenValue(blockCss: string, name: string): string {
  const m = blockCss.match(new RegExp(`${name}: ([^;]+);`));
  if (!m) throw new Error(`token ${name} not found`);
  return m[1]!;
}

function ratio(a: string, b: string): number {
  const la = relativeLuminance(parseColor(a));
  const lb = relativeLuminance(parseColor(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe("parseDna", () => {
  test("accepts a minimal DNA", () => {
    expect(parseDna({ version: 1, color: { brand: "#4f46e5" } })).toBeTruthy();
  });

  test("collects every problem in one error", () => {
    try {
      parseDna({
        version: 2,
        color: { brand: "not-a-color", surfaces: "glass" },
        typography: { scale: 3 },
        spacing: { density: "cozy" },
      });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(DnaValidationError);
      const problems = (e as DnaValidationError).problems;
      expect(problems.some((p) => p.startsWith("version:"))).toBe(true);
      expect(problems.some((p) => p.startsWith("color.brand:"))).toBe(true);
      expect(problems.some((p) => p.startsWith("color.surfaces:"))).toBe(true);
      expect(problems.some((p) => p.startsWith("typography.scale:"))).toBe(true);
      expect(problems.some((p) => p.startsWith("spacing.density:"))).toBe(true);
    }
  });

  test("rejects raw color literals in overrides — the anti-slop guarantee", () => {
    expect(() =>
      parseDna({
        version: 1,
        color: { brand: "#4f46e5" },
        overrides: { "--sidebar": "#060d1a" },
      }),
    ).toThrow(DnaValidationError);
    expect(() =>
      parseDna({
        version: 1,
        color: { brand: "#4f46e5" },
        overrides: { dark: { "--background": "oklch(0.09 0.02 250)" } },
      }),
    ).toThrow(DnaValidationError);
  });

  test("accepts token-referential overrides", () => {
    const dna = parseDna({
      version: 1,
      color: { brand: "#4f46e5" },
      overrides: {
        "--sidebar": "var(--background)",
        "--accent": "color-mix(in oklch, var(--primary) 8%, var(--background))",
      },
    });
    expect(dna.overrides).toBeTruthy();
  });

  test("rejects a bad explicit chart palette", () => {
    expect(() =>
      parseDna({
        version: 1,
        color: { brand: "#4f46e5", charts: ["#fff"] },
      }),
    ).toThrow(/3–8 colors/);
  });
});

// ---------------------------------------------------------------------------
// Compiler
// ---------------------------------------------------------------------------

describe("compileDna", () => {
  test("is deterministic", () => {
    const a = compileDna(MINIMAL);
    const b = compileDna(MINIMAL);
    expect(a.css).toBe(b.css);
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  test("emits the full token vocabulary in both modes", () => {
    const { css } = compileDna(MINIMAL);
    const root = block(css, ":root");
    const dark = block(css, ".dark");

    const required = [
      "--background",
      "--foreground",
      "--card",
      "--popover",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--border",
      "--input",
      "--ring",
      "--success",
      "--success-subtle",
      "--success-subtle-foreground",
      "--warning",
      "--destructive",
      "--info",
      "--chart-1",
      "--chart-8",
      "--sidebar",
      "--sidebar-accent",
      "--composer-bg",
      "--bubble-user",
      "--code-block-bg",
      "--shadow-md-value",
    ];
    for (const t of required) {
      expect(root).toContain(`${t}: `);
      expect(dark).toContain(`${t}: `);
    }

    // Root-only tokens.
    for (const t of ["--radius", "--font-sans", "--font-display", "--font-mono", "--motion-base", "--display-weight"]) {
      expect(root).toContain(`${t}: `);
    }

    // Tailwind mapping blocks.
    expect(css).toContain("@theme inline {");
    expect(css).toContain("--color-background: var(--background);");
    expect(css).toContain("--color-success-subtle: var(--success-subtle);");
    expect(css).toContain("--radius-control:");
    expect(css).toContain("--spacing-control:");
    expect(css).toContain("--text-2xl:");
    expect(css).toContain("--ease-standard:");
  });

  test("fixes unreadable primary foregrounds and reports it", () => {
    // A searing light yellow brand — white text on it would be unreadable.
    const { css } = compileDna({ version: 1, color: { brand: "#f9ff56" } });
    const root = block(css, ":root");
    const primary = tokenValue(root, "--primary");
    const primaryFg = tokenValue(root, "--primary-foreground");
    expect(ratio(primary, primaryFg)).toBeGreaterThanOrEqual(4.4);
  });

  test("keeps a near-neutral brand as a classy near-black button", () => {
    const { css } = compileDna({ version: 1, color: { brand: "#111111" } });
    const root = block(css, ":root");
    const dark = block(css, ".dark");
    expect(parseColor(tokenValue(root, "--primary")).l).toBeLessThanOrEqual(0.3);
    expect(parseColor(tokenValue(dark, "--primary")).l).toBeGreaterThanOrEqual(0.9);
  });

  test("meets WCAG minimums on core pairs in both modes", () => {
    for (const brand of ["#4f46e5", "#16a34a", "#f97316", "#0ea5e9", "#111111"]) {
      for (const surfaces of ["flat", "panel", "console"] as const) {
        const { css } = compileDna({ version: 1, color: { brand, surfaces } });
        for (const sel of [":root", ".dark"]) {
          const b = block(css, sel);
          expect(ratio(tokenValue(b, "--background"), tokenValue(b, "--foreground"))).toBeGreaterThanOrEqual(6.9);
          expect(ratio(tokenValue(b, "--background"), tokenValue(b, "--muted-foreground"))).toBeGreaterThanOrEqual(4.4);
          expect(ratio(tokenValue(b, "--primary"), tokenValue(b, "--primary-foreground"))).toBeGreaterThanOrEqual(4.4);
          expect(ratio(tokenValue(b, "--success-subtle"), tokenValue(b, "--success-subtle-foreground"))).toBeGreaterThanOrEqual(4.4);
        }
      }
    }
  });

  test("surface strategies produce distinct canvases", () => {
    const flat = block(compileDna({ version: 1, color: { brand: "#4f46e5", surfaces: "flat" } }).css, ":root");
    const panel = block(compileDna({ version: 1, color: { brand: "#4f46e5", surfaces: "panel" } }).css, ":root");
    expect(tokenValue(flat, "--background")).toBe(tokenValue(flat, "--card"));
    expect(tokenValue(panel, "--background")).not.toBe(tokenValue(panel, "--card"));

    const consoleDark = block(compileDna({ version: 1, color: { brand: "#4f46e5", surfaces: "console" } }).css, ".dark");
    expect(parseColor(tokenValue(consoleDark, "--background")).l).toBeLessThan(0.13);
  });

  test("applies overrides after generated tokens (both modes for flat maps)", () => {
    const { css } = compileDna({
      ...MINIMAL,
      overrides: { "--sidebar": "var(--background)" },
    });
    const root = block(css, ":root");
    const dark = block(css, ".dark");
    // Both the generated and the override line exist; override comes later.
    expect(root.lastIndexOf("--sidebar: var(--background);")).toBeGreaterThan(
      root.indexOf("--sidebar: oklch"),
    );
    expect(dark).toContain("--sidebar: var(--background);");
  });

  test("respects an explicit chart palette", () => {
    const { css } = compileDna({
      version: 1,
      color: { brand: "#4f46e5", charts: ["#e11d48", "#0891b2", "#ca8a04"] },
    });
    const root = block(css, ":root");
    const chart1 = parseColor(tokenValue(root, "--chart-1"));
    const rose = parseColor("#e11d48");
    expect(Math.abs(chart1.h - rose.h)).toBeLessThan(2);
    expect(root).not.toContain("--chart-4:");
  });

  test("falls back with a warning on unknown font pairing", () => {
    const { css, report } = compileDna({
      version: 1,
      color: { brand: "#4f46e5" },
      typography: { pairing: "does-not-exist" },
    });
    expect(report.warnings.some((w) => w.includes("does-not-exist"))).toBe(true);
    expect(block(css, ":root")).toContain(`--font-sans: "Inter"`);
  });

  test("pairing controls fonts + import; density controls spacing", () => {
    const { css } = compileDna({
      version: 1,
      color: { brand: "#4f46e5" },
      typography: { pairing: "fraunces-inter" },
      spacing: { density: "compact" },
      shape: { controls: "pill" },
    });
    expect(css).toContain('@import url("https://fonts.googleapis.com/css2?family=Fraunces');
    expect(block(css, ":root")).toContain(`--font-display: "Fraunces"`);
    expect(css).toContain("--spacing: 0.225rem;");
    expect(css).toContain("--radius-control: 9999px;");
  });

  test("default mode falls through from DNA", () => {
    expect(compileDna(MINIMAL).defaultMode).toBe("light");
    expect(
      compileDna({ version: 1, color: { brand: "#4f46e5", defaultMode: "dark" } }).defaultMode,
    ).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// Registries integrity
// ---------------------------------------------------------------------------

describe("registries", () => {
  test("font pairing ids are unique and complete", () => {
    const ids = FONT_PAIRINGS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of FONT_PAIRINGS) {
      expect(p.sans.length).toBeGreaterThan(0);
      expect(p.mono.length).toBeGreaterThan(0);
      expect(p.importUrl.startsWith("https://fonts.googleapis.com/css2?")).toBe(true);
      expect(p.importUrl).toContain("display=swap");
      expect(p.vibe.length).toBeGreaterThan(0);
    }
  });

  test("every registry enum is covered", () => {
    expect(STATUS_SETS.map((s) => s.id).sort()).toEqual(["muted", "signal", "vivid"]);
    expect(MOTION_PRESETS.map((m) => m.id).sort()).toEqual([
      "expressive",
      "instant",
      "smooth",
      "snappy",
    ]);
    expect(ELEVATION_LADDERS.map((e) => e.id).sort()).toEqual([
      "hairline",
      "medium",
      "none",
      "soft",
      "strong",
    ]);
    expect(Object.keys(DENSITY_SPECS).sort()).toEqual([
      "comfortable",
      "compact",
      "spacious",
    ]);
  });

  test("status anchors are parseable and mode-paired", () => {
    for (const set of STATUS_SETS) {
      for (const mode of ["light", "dark"] as const) {
        for (const name of ["success", "warning", "destructive", "info"] as const) {
          const a = set[mode][name];
          expect(a.l).toBeGreaterThan(0);
          expect(a.l).toBeLessThan(1);
          expect(a.c).toBeGreaterThan(0);
        }
      }
    }
  });
});
