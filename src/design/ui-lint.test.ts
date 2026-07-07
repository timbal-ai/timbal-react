import { describe, expect, it } from "bun:test";

import { formatLintReport, lintGeneratedUi } from "./ui-lint";
import { HOUSE_RULES } from "./ui-vocabulary";

function rules(source: string, opts?: Parameters<typeof lintGeneratedUi>[1]) {
  return lintGeneratedUi(source, opts).findings.map((f) => f.rule);
}

describe("lintGeneratedUi — raw colors", () => {
  it("flags hardcoded palette colors as errors", () => {
    const res = lintGeneratedUi(
      `<span className="text-blue-600 bg-green-50">Revenue</span>`,
    );
    expect(res.ok).toBe(false);
    expect(res.findings.filter((f) => f.rule === "raw-color").length).toBe(2);
  });

  it("flags palette colors behind variants and opacity", () => {
    expect(rules(`<div className="hover:bg-rose-400/40 dark:to-sky-300" />`)).toEqual(
      expect.arrayContaining(["raw-color"]),
    );
  });

  it("accepts semantic tokens", () => {
    const res = lintGeneratedUi(
      `<span className="text-primary bg-muted border-border text-muted-foreground" />`,
    );
    expect(res.ok).toBe(true);
    expect(res.findings).toHaveLength(0);
  });

  it("does not flag palette-like words without a numeric shade", () => {
    // `border` / `bg-card` etc. must not trip the palette matcher.
    const res = lintGeneratedUi(`<div className="border bg-card rounded-xl" />`);
    expect(res.findings).toHaveLength(0);
  });
});

describe("lintGeneratedUi — literals & inline styles", () => {
  it("flags hex and oklch literals", () => {
    expect(rules(`<div style={{ background: "#ff0066" }} />`)).toEqual(
      expect.arrayContaining(["color-literal", "inline-style-color"]),
    );
    expect(rules(`const c = "oklch(0.6 0.2 264)";`)).toEqual(
      expect.arrayContaining(["color-literal"]),
    );
  });

  it("flags inline style color", () => {
    expect(rules(`<span style={{ color: tone }}>x</span>`)).toEqual(
      expect.arrayContaining(["inline-style-color"]),
    );
  });

  it("allows a brand/accent hex passed to createTimbalTheme (the sanctioned path)", () => {
    const inline = lintGeneratedUi(
      `const theme = createTimbalTheme({ brand: "#ff5a5f", accent: "#c19a6b" });`,
    );
    expect(inline.findings.some((f) => f.rule === "color-literal")).toBe(false);
    expect(inline.ok).toBe(true);

    // brand/accent on their own lines inside a multi-line call (preset shape).
    const multiline = lintGeneratedUi(
      [
        `const theme = createTimbalTheme({`,
        `  brand: "#ff5a5f",`,
        `  accent: "#c19a6b",`,
        `  radius: 0.875,`,
        `});`,
      ].join("\n"),
    );
    expect(multiline.findings.some((f) => f.rule === "color-literal")).toBe(false);
  });

  it("allows a preset swatch color literal", () => {
    const res = lintGeneratedUi(`{ id: "warm", swatch: "#ea580c", label: "Warm" }`);
    expect(res.findings.some((f) => f.rule === "color-literal")).toBe(false);
  });

  it("skips comments and imports", () => {
    const res = lintGeneratedUi(
      [
        `// example: #ff0000 in a comment`,
        `import { x } from "y"; // rgb(1,2,3)`,
        `<div className="bg-background" />`,
      ].join("\n"),
    );
    expect(res.findings).toHaveLength(0);
  });
});

describe("lintGeneratedUi — chart correctness", () => {
  it("flags hsl(var(--token)) wrapping as the specific chart rule, not color-literal", () => {
    const res = lintGeneratedUi(`<Cell fill="hsl(var(--chart-1))" />`);
    const ids = res.findings.map((f) => f.rule);
    expect(ids).toContain("chart-token-color-fn");
    expect(ids).not.toContain("color-literal");
    expect(res.ok).toBe(false);
  });

  it("accepts the token passed directly", () => {
    const res = lintGeneratedUi(`<Cell fill="var(--chart-1)" />`);
    expect(res.findings).toHaveLength(0);
  });

  it("flags unsafe dataKeys (space / %)", () => {
    expect(rules(`series={[{ dataKey: "Water %" }]}`)).toContain("chart-data-key");
    expect(rules(`<Bar dataKey="Sleep hours" />`)).toContain("chart-data-key");
  });

  it("accepts safe identifier dataKeys", () => {
    const res = lintGeneratedUi(
      `series={[{ dataKey: "waterPct", label: "Water %" }]}`,
    );
    expect(res.findings.filter((f) => f.rule === "chart-data-key")).toHaveLength(0);
  });
});

describe("lintGeneratedUi — theme bypasses", () => {
  it("flags forcedTheme", () => {
    expect(rules(`<ThemeProvider forcedTheme="dark">`)).toContain(
      "theme-via-generator",
    );
  });

  it("flags hand-authored theme tokens", () => {
    expect(rules(`.dark { --background: oklch(0.09 0.025 248); }`)).toContain(
      "theme-via-generator",
    );
    // setProperty bypasses don't match the token:value shape, but the color
    // literal itself still blocks the line — the bypass cannot pass.
    const res = lintGeneratedUi(`root.style.setProperty("--primary", "#7132F5");`);
    expect(res.ok).toBe(false);
    expect(res.findings.map((f) => f.rule)).toContain("color-literal");
  });
});

describe("lintGeneratedUi — chat wrapping", () => {
  it("flags a chat surface wrapped in a Card as an error", () => {
    const res = lintGeneratedUi(
      [
        `<Card>`,
        `  <TimbalChat workforceId="w" />`,
        `</Card>`,
      ].join("\n"),
    );
    expect(res.findings.map((f) => f.rule)).toContain("no-chat-wrapping");
    expect(res.ok).toBe(false);
  });

  it("accepts an unwrapped chat surface", () => {
    const res = lintGeneratedUi(`<TimbalChat workforceId="w" className="min-h-0 flex-1" />`);
    expect(res.findings).toHaveLength(0);
  });
});

describe("lintGeneratedUi — v2 taste de-escalation", () => {
  // Taste patterns are NOT linted anymore — they belong to the screenshot
  // critique rubric. These patterns must produce zero findings so fork-first
  // projects (which own their component source) never get false-flagged.
  const TASTE_SNIPPETS: Record<string, string> = {
    "bold metric": `<span className="text-3xl font-bold tabular-nums">$322k</span>`,
    "uppercase heading": `<h2 className="text-2xl uppercase">Critical</h2>`,
    "glow shadow": `<div className="shadow-[0_0_20px_var(--ring)]">x</div>`,
    "hand-rolled control": `<button className="rounded-lg border border-input bg-transparent px-3 h-9">`,
    "colored hover": `<Card className="hover:bg-primary/5">x</Card>`,
    "card in card": [`<Card>`, `  <Card>x</Card>`, `</Card>`].join("\n"),
    "table in card": [`<Card>`, `  <DataTable columns={c} rows={r} />`, `</Card>`].join("\n"),
    "row dividers": [
      `<li className="border-b">a</li>`,
      `<li className="border-b">b</li>`,
      `<li className="border-b">c</li>`,
      `<li className="border-b">d</li>`,
    ].join("\n"),
    "nav rail": `<aside className="flex-col w-64 flex gap-2">…</aside>`,
    "gradient tile": `<div className="bg-gradient-to-br from-primary to-accent p-4">stat</div>`,
    "trend pill": `<span className="text-success">+8%</span>`,
  };

  for (const [name, snippet] of Object.entries(TASTE_SNIPPETS)) {
    it(`does not flag ${name}`, () => {
      const res = lintGeneratedUi(snippet);
      expect(res.findings).toHaveLength(0);
      expect(res.ok).toBe(true);
    });
  }

  it("emits zero warn-severity findings on a slop-heavy file", () => {
    const res = lintGeneratedUi(
      [
        `<Card><Card><h1 className="uppercase text-4xl font-bold">DASH</h1></Card></Card>`,
        `<div className="shadow-[0_0_30px_var(--ring)] bg-gradient-to-b from-primary to-accent" />`,
      ].join("\n"),
    );
    expect(res.warnCount).toBe(0);
  });

  it("keeps `strict` accepted as a no-op for legacy callers", () => {
    const src = `<span className="text-3xl font-bold">$1</span>`;
    expect(lintGeneratedUi(src).ok).toBe(true);
    expect(lintGeneratedUi(src, { strict: true }).ok).toBe(true);
  });
});

describe("HOUSE_RULES lint coverage", () => {
  // Every HouseRule must make an explicit coverage decision: either a
  // deterministic linter rule maps to it, or it is annotated prompt-only.
  // v2: only correctness rules keep lint coverage; every taste rule must be
  // explicitly prompt-only (they are enforced by the critique rubric).
  const LINT_COVERAGE: Record<string, string[]> = {
    "semantic-color": ["raw-color", "color-literal", "inline-style-color"],
    "chart-token-color": ["chart-token-color-fn"],
    "chart-data-key": ["chart-data-key"],
    "no-chat-wrapping": ["no-chat-wrapping"],
    "theme-via-generator": ["theme-via-generator"],
  };

  it("covers every HOUSE_RULES id with a lint check or a prompt-only annotation", () => {
    for (const rule of HOUSE_RULES) {
      const covered =
        rule.enforcement === "prompt-only" ||
        Array.isArray(LINT_COVERAGE[rule.id]);
      expect({ id: rule.id, covered }).toEqual({ id: rule.id, covered: true });
    }
  });

  it("keeps lint-covered rules NOT annotated prompt-only", () => {
    for (const id of Object.keys(LINT_COVERAGE)) {
      const rule = HOUSE_RULES.find((r) => r.id === id);
      expect(rule).toBeDefined();
      expect(rule!.enforcement ?? "lint").toBe("lint");
    }
  });
});

describe("formatLintReport", () => {
  it("returns empty string with no findings", () => {
    expect(formatLintReport([])).toBe("");
  });

  it("summarizes counts and lists findings", () => {
    const { findings } = lintGeneratedUi(
      `<span className="text-blue-600 font-bold text-3xl">x</span>`,
    );
    const report = formatLintReport(findings);
    expect(report).toContain("error(s)");
    expect(report).toContain("raw-color");
  });
});

describe("lintGeneratedUi — input validation", () => {
  it("throws a helpful TypeError on non-string input", () => {
    expect(() =>
      lintGeneratedUi({ filename: "a.tsx", source: "x" } as unknown as string),
    ).toThrow(TypeError);
  });

  it("formatLintReport throws a helpful TypeError on a LintResult", () => {
    const result = lintGeneratedUi(`<div />`);
    expect(() =>
      formatLintReport(result as unknown as Parameters<typeof formatLintReport>[0]),
    ).toThrow(TypeError);
  });
});
