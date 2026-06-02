import { describe, expect, it } from "bun:test";

import { formatLintReport, lintGeneratedUi } from "./ui-lint";

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
});

describe("lintGeneratedUi — house style", () => {
  it("warns on bold giant values", () => {
    expect(
      rules(`<span className="text-3xl font-bold tabular-nums">$322k</span>`),
    ).toEqual(expect.arrayContaining(["bold-metric"]));
  });

  it("does not warn on normal-weight values", () => {
    const res = lintGeneratedUi(
      `<span className="text-2xl font-normal tabular-nums">$322k</span>`,
    );
    expect(res.findings).toHaveLength(0);
  });

  it("warns on gradients outside chrome tokens", () => {
    expect(
      rules(`<div className="bg-gradient-to-br from-purple-500 to-pink-500" />`),
    ).toEqual(expect.arrayContaining(["data-gradient"]));
  });

  it("allows gradients built only from reserved chrome tokens", () => {
    const res = lintGeneratedUi(
      `<div className="bg-gradient-to-b from-elevated-from to-elevated-to" />`,
    );
    expect(res.findings.some((f) => f.rule === "data-gradient")).toBe(false);
  });
});

describe("lintGeneratedUi — hand-rolled controls", () => {
  it("warns when a control surface is hand-rolled with border-input", () => {
    expect(
      rules(`<button className="rounded-lg border border-input bg-transparent h-9 px-3" />`),
    ).toEqual(expect.arrayContaining(["raw-control-surface"]));
  });

  it("does not warn when using kit controls", () => {
    const res = lintGeneratedUi(
      `<SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>`,
    );
    expect(res.findings.some((f) => f.rule === "raw-control-surface")).toBe(false);
  });
});

describe("lintGeneratedUi — icon spam", () => {
  it("warns when icon usages exceed the budget", () => {
    const icons = Array.from({ length: 8 }, () => "<BarChart2 />").join("\n");
    const src = `import { BarChart2 } from "lucide-react";\n${icons}`;
    expect(rules(src)).toEqual(expect.arrayContaining(["icon-spam"]));
  });

  it("does not warn under the budget", () => {
    const src = `import { Check } from "lucide-react";\n<Check />\n<Check />`;
    expect(rules(src).includes("icon-spam")).toBe(false);
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

describe("lintGeneratedUi — strict mode", () => {
  it("treats warnings as failures when strict", () => {
    const src = `<span className="text-3xl font-bold">$1</span>`;
    expect(lintGeneratedUi(src).ok).toBe(true); // warn only
    expect(lintGeneratedUi(src, { strict: true }).ok).toBe(false);
  });
});
