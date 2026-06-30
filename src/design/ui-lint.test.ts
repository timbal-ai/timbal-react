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

  it("still blocks a hand-authored theme token with a hex (the real anti-pattern)", () => {
    const found = rules(`  --primary: #ff5a5f;`);
    expect(found).toEqual(expect.arrayContaining(["theme-via-generator"]));
  });

  it("still flags a stray hex that is not theme intent", () => {
    expect(rules(`const tone = "#ff0066";`)).toEqual(
      expect.arrayContaining(["color-literal"]),
    );
  });
});

describe("lintGeneratedUi — chart token color", () => {
  it("errors when a theme token is wrapped in a color function", () => {
    const res = lintGeneratedUi(`<Cell fill="hsl(var(--chart-1))" />`);
    expect(res.ok).toBe(false);
    expect(res.findings.map((f) => f.rule)).toEqual(
      expect.arrayContaining(["chart-token-color-fn"]),
    );
  });

  it("flags rgb()/oklch() wrapping of tokens too", () => {
    expect(rules(`const c = "rgb(var(--primary))";`)).toEqual(
      expect.arrayContaining(["chart-token-color-fn"]),
    );
    expect(rules(`const c = "oklch(var(--chart-2))";`)).toEqual(
      expect.arrayContaining(["chart-token-color-fn"]),
    );
  });

  it("does not also emit the generic color-literal for the same line", () => {
    const found = rules(`<Cell fill="hsl(var(--chart-1))" />`);
    expect(found.includes("chart-token-color-fn")).toBe(true);
    expect(found.includes("color-literal")).toBe(false);
  });

  it("accepts a token passed directly", () => {
    const res = lintGeneratedUi(`<Cell fill="var(--chart-1)" />`);
    expect(res.findings.some((f) => f.rule === "chart-token-color-fn")).toBe(false);
    expect(res.findings.some((f) => f.rule === "color-literal")).toBe(false);
  });
});

describe("lintGeneratedUi — chart data key", () => {
  it("errors on a series dataKey containing a space", () => {
    const src = `series={[{ dataKey: "Sleep hours", label: "Sleep" }]}`;
    expect(rules(src)).toEqual(expect.arrayContaining(["chart-data-key"]));
  });

  it("errors on a dataKey containing a percent sign", () => {
    expect(rules(`<Area dataKey="Water %" />`)).toEqual(
      expect.arrayContaining(["chart-data-key"]),
    );
  });

  it("accepts a safe identifier dataKey with a separate label", () => {
    const src = `series={[{ dataKey: "waterPct", label: "Water %" }]}`;
    expect(rules(src).includes("chart-data-key")).toBe(false);
  });

  it("does not flag a plain identifier dataKey prop", () => {
    expect(rules(`<Line dataKey="sleepHours" />`).includes("chart-data-key")).toBe(
      false,
    );
  });
});

describe("lintGeneratedUi — input guards", () => {
  it("throws a TypeError with the correct signature when given a non-string", () => {
    // The classic misuse: passing { filename, source } instead of the string.
    expect(() =>
      // @ts-expect-error — intentionally wrong call shape
      lintGeneratedUi({ filename: "x.tsx", source: "<div/>" }),
    ).toThrow(TypeError);
    try {
      // @ts-expect-error — intentionally wrong call shape
      lintGeneratedUi({ filename: "x.tsx", source: "<div/>" });
    } catch (err) {
      expect((err as Error).message).toContain("expects the generated code as a string");
      expect((err as Error).message).toContain("{ filename, source }");
    }
  });

  it("formatLintReport throws when handed the whole result instead of findings", () => {
    const result = lintGeneratedUi(`<div className="text-blue-600" />`);
    expect(() =>
      // @ts-expect-error — intentionally wrong call shape
      formatLintReport(result),
    ).toThrow(TypeError);
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

describe("lintGeneratedUi — colored hover style", () => {
  it("warns when hover is colored", () => {
    expect(
      rules(`<div className="hover:bg-primary" />`),
    ).toEqual(expect.arrayContaining(["no-colored-hover"]));

    expect(
      rules(`<div className="hover:bg-emerald-500/10" />`),
    ).toEqual(expect.arrayContaining(["no-colored-hover"]));
  });

  it("does not warn when hover is neutral", () => {
    const res = lintGeneratedUi(
      `<div className="hover:bg-muted hover:text-foreground" />`,
    );
    expect(res.findings.some((f) => f.rule === "no-colored-hover")).toBe(false);
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

describe("lintGeneratedUi — title repetition", () => {
  it("warns when a Section title repeats the Page title", () => {
    const src = `
      <Page title="Orders" description="Manage orders">
        <Section title="Orders" />
      </Page>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-title-repetition"]));
  });

  it("warns when a Section title is very similar to the Page title", () => {
    const src = `
      <Page title="Orders" description="Manage orders">
        <Section title="Orders (ERP)" />
      </Page>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-title-repetition"]));
  });

  it("does not warn when titles are completely different", () => {
    const src = `
      <Page title="Orders" description="Manage orders">
        <Section title="Recent Activity" />
      </Page>
    `;
    expect(rules(src).includes("no-title-repetition")).toBe(false);
  });
});

describe("lintGeneratedUi — chat wrapping", () => {
  it("flags wrapping TimbalChat or AppChatPanel in Cards or Sections", () => {
    const src = `
      <Page title="Assistant">
        <Card>
          <TimbalChat workforceId="tiba" />
        </Card>
      </Page>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-chat-wrapping"]));
  });

  it("flags custom h1-6 headings in a chat view", () => {
    const src = `
      <Page title="Assistant">
        <h3>TIBA Concierge</h3>
        <AppChatPanel workforceId="tiba" />
      </Page>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-chat-wrapping"]));
  });

  it("does not flag standalone TimbalChat directly in Page", () => {
    const src = `
      <Page fill>
        <TimbalChat workforceId="tiba" />
      </Page>
    `;
    expect(rules(src).includes("no-chat-wrapping")).toBe(false);
  });
});

describe("lintGeneratedUi — table inside card", () => {
  it("flags wrapping DataTable, table, or Table inside Card, SurfaceCard, or ArtifactCard", () => {
    const src = `
      <Page title="Dashboard">
        <Card>
          <DataTable columns={columns} rows={rows} getRowKey={getRowKey} />
        </Card>
      </Page>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-table-in-card"]));
  });

  it("flags wrapping table inside SurfaceCard", () => {
    const src = `
      <SurfaceCard>
        <table>
          <thead><tr><th>Col</th></tr></thead>
        </table>
      </SurfaceCard>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-table-in-card"]));
  });

  it("does not flag DataTable directly in Page or Section", () => {
    const src = `
      <Page title="Dashboard">
        <Section title="Data">
          <DataTable columns={columns} rows={rows} getRowKey={getRowKey} />
        </Section>
      </Page>
    `;
    expect(rules(src).includes("no-table-in-card")).toBe(false);
  });
});

describe("lintGeneratedUi — card inside card", () => {
  it("warns when a Card is nested inside another Card", () => {
    const src = `
      <Card>
        <Card>
          <span>nested</span>
        </Card>
      </Card>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-card-in-card"]));
  });

  it("warns on SurfaceCard nested inside Card", () => {
    const src = `
      <Card>
        <SurfaceCard>
          <span>nested</span>
        </SurfaceCard>
      </Card>
    `;
    expect(rules(src)).toEqual(expect.arrayContaining(["no-card-in-card"]));
  });

  it("does not warn on sibling cards", () => {
    const src = `
      <Page>
        <Card><span>a</span></Card>
        <Card><span>b</span></Card>
      </Page>
    `;
    expect(rules(src).includes("no-card-in-card")).toBe(false);
  });

  it("does not warn on card subcomponents (CardHeader/CardContent)", () => {
    const src = `
      <Card>
        <CardHeader><span>title</span></CardHeader>
        <CardContent><span>body</span></CardContent>
      </Card>
    `;
    expect(rules(src).includes("no-card-in-card")).toBe(false);
  });
});

describe("lintGeneratedUi — neutral trend", () => {
  it("warns on a colored signed-percentage delta", () => {
    expect(
      rules(`<span className="text-emerald-500">+8%</span>`),
    ).toEqual(expect.arrayContaining(["neutral-trend"]));
  });

  it("warns on a colored trending icon", () => {
    expect(
      rules(`<TrendingUp className="text-success" />`),
    ).toEqual(expect.arrayContaining(["neutral-trend"]));
  });

  it("does not warn on a muted trend", () => {
    const res = lintGeneratedUi(
      `<span className="text-muted-foreground">+8%</span>`,
    );
    expect(res.findings.some((f) => f.rule === "neutral-trend")).toBe(false);
  });

  it("does not warn on a colored element without trend context", () => {
    const res = lintGeneratedUi(`<Badge className="text-destructive">Overdue</Badge>`);
    expect(res.findings.some((f) => f.rule === "neutral-trend")).toBe(false);
  });
});

describe("lintGeneratedUi — glow shadows", () => {
  it("errors on a neon glow box-shadow", () => {
    const res = lintGeneratedUi(
      `<span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />`,
    );
    expect(res.ok).toBe(false);
    expect(res.findings.map((f) => f.rule)).toEqual(
      expect.arrayContaining(["no-glow"]),
    );
  });

  it("errors on drop-shadow glow with px offsets", () => {
    expect(rules(`<div className="drop-shadow-[0px_0px_20px_var(--ring)]" />`)).toEqual(
      expect.arrayContaining(["no-glow"]),
    );
  });

  it("does not flag the kit elevation shadows", () => {
    const res = lintGeneratedUi(
      `<div className="shadow-card hover:shadow-card-elevated" />`,
    );
    expect(res.findings.some((f) => f.rule === "no-glow")).toBe(false);
  });

  it("does not flag an offset drop shadow (not a 0 0 halo)", () => {
    const res = lintGeneratedUi(`<div className="shadow-[0_2px_8px_var(--ring)]" />`);
    expect(res.findings.some((f) => f.rule === "no-glow")).toBe(false);
  });
});

describe("lintGeneratedUi — custom shell chrome", () => {
  it("errors when a custom topbar uses AppShellSidebarTrigger", () => {
    const src = `
      <div className="flex h-12 items-center border-b px-4">
        <AppShellSidebarTrigger className="lg:hidden" />
      </div>
    `;
    expect(rules(src)).toEqual(
      expect.arrayContaining(["no-custom-shell-chrome"]),
    );
  });

  it("errors on a hand-rolled full-height nav rail", () => {
    const src = `<nav className="flex h-full w-64 flex-col gap-1 p-3">{links}</nav>`;
    expect(rules(src)).toEqual(
      expect.arrayContaining(["no-custom-shell-chrome"]),
    );
  });

  it("errors on a hand-rolled aside sidebar pinned inset-y-0", () => {
    const src = `<aside className="fixed inset-y-0 left-0 flex w-60 flex-col">{nav}</aside>`;
    expect(rules(src)).toEqual(
      expect.arrayContaining(["no-custom-shell-chrome"]),
    );
  });

  it("errors when AppShell is given a topbar prop", () => {
    const src = `
      <AppShell
        sidebar={<StudioSidebar items={nav} selectedId={v} onSelect={set} />}
        topbar={
          <div className="flex items-center gap-2">
            <Button onClick={openCoach}>AI Coach</Button>
            <ModeToggle theme={theme} setTheme={setTheme} />
          </div>
        }
      >
        {main}
      </AppShell>
    `;
    expect(rules(src)).toEqual(
      expect.arrayContaining(["no-custom-shell-chrome"]),
    );
  });

  it("does not flag using StudioSidebar in AppShell.sidebar", () => {
    const src = `<AppShell sidebar={<StudioSidebar workforces={items} selectedId={v} onSelect={set} />}>{main}</AppShell>`;
    expect(rules(src).includes("no-custom-shell-chrome")).toBe(false);
  });

  it("does not flag global actions placed in Page.actions", () => {
    const src = `<Page title="Billing" actions={<ModeToggle theme={theme} setTheme={setTheme} />}>{content}</Page>`;
    expect(rules(src).includes("no-custom-shell-chrome")).toBe(false);
  });
});

describe("lintGeneratedUi — uppercase display text", () => {
  it("errors on an UPPERCASE heading element", () => {
    expect(rules(`<h2 className="text-xl uppercase">Critical</h2>`)).toEqual(
      expect.arrayContaining(["no-uppercase-heading"]),
    );
  });

  it("errors on uppercase applied to large text", () => {
    expect(
      rules(`<span className="text-2xl font-normal uppercase">Elevated</span>`),
    ).toEqual(expect.arrayContaining(["no-uppercase-heading"]));
  });

  it("does not flag a small uppercase eyebrow label", () => {
    const res = lintGeneratedUi(
      `<span className="text-xs uppercase tracking-wide text-muted-foreground">Threat level</span>`,
    );
    expect(res.findings.some((f) => f.rule === "no-uppercase-heading")).toBe(
      false,
    );
  });
});

describe("lintGeneratedUi — theme bypass", () => {
  it("errors on forcedTheme", () => {
    expect(rules(`<TimbalThemeStyle forcedTheme="dark" />`)).toEqual(
      expect.arrayContaining(["theme-via-generator"]),
    );
  });

  it("errors on a hand-authored theme token", () => {
    expect(rules(`  --background: oklch(0.09 0.025 248);`)).toEqual(
      expect.arrayContaining(["theme-via-generator"]),
    );
    expect(rules(`  --sidebar-bg: #060d1a;`)).toEqual(
      expect.arrayContaining(["theme-via-generator"]),
    );
  });

  it("does not flag using createTimbalTheme/applyTimbalTheme", () => {
    const res = lintGeneratedUi(
      `applyTimbalTheme(createTimbalTheme({ brand: "var(--brand)" }));`,
    );
    expect(res.findings.some((f) => f.rule === "theme-via-generator")).toBe(
      false,
    );
  });
});

describe("HOUSE_RULES lint coverage", () => {
  // Every HouseRule must make an explicit coverage decision: either a
  // deterministic linter rule maps to it, or it is annotated prompt-only.
  // This guards against a new rule being added without wiring up the gate.
  const LINT_COVERAGE: Record<string, string[]> = {
    "semantic-color": ["raw-color", "color-literal", "inline-style-color"],
    "chart-token-color": ["chart-token-color-fn"],
    "chart-data-key": ["chart-data-key"],
    "no-decorative-icons": ["icon-spam"],
    "neutral-trend": ["neutral-trend"],
    "values-normal-weight": ["bold-metric"],
    "no-card-in-card": ["no-card-in-card"],
    "no-table-in-card": ["no-table-in-card"],
    "no-row-dividers": ["row-divider"],
    "no-data-gradient": ["data-gradient"],
    "use-kit-controls": ["raw-control-surface"],
    "no-title-repetition": ["no-title-repetition"],
    "no-chat-wrapping": ["no-chat-wrapping"],
    "no-colored-hover": ["no-colored-hover"],
    "no-glow": ["no-glow"],
    "no-custom-shell-chrome": ["no-custom-shell-chrome"],
    "no-uppercase-heading": ["no-uppercase-heading"],
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
