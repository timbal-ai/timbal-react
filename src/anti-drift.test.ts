/**
 * Anti-drift guard. The composer and the blueprint import a specific public
 * surface from each entrypoint; this test fails loudly if any of those exports
 * disappears or is renamed (the class of "AppShellTopbar doesn't exist" /
 * "Tabs from /ui" errors that sent agents grepping `dist/*.d.ts`).
 *
 * It asserts both runtime presence (the symbol is exported) and, for the props
 * agents get wrong most often, the exact prop name at the type level.
 */
import { describe, expect, it } from "bun:test";

import * as App from "./app/index";
import * as Ui from "./ui/index";
import * as Studio from "./studio/index";

import type { DataTableProps } from "./app/data/DataTable";
import type { AppShellProps } from "./app/layout/AppShell";
import type { LineAreaChartProps, PieChartProps } from "./charts/index";

function expectExports(mod: Record<string, unknown>, names: string[]) {
  const missing = names.filter((n) => mod[n] === undefined);
  expect({ missing }).toEqual({ missing: [] });
}

describe("anti-drift: /app entrypoint", () => {
  it("exports the app-kit surface the examples/blueprint use", () => {
    expectExports(App as Record<string, unknown>, [
      // shell + layout
      "AppShell",
      "Page",
      "Section",
      // mobile nav (Phase 1) — must be reachable from /app, not /studio
      "useAppShellNav",
      "AppShellSidebarTrigger",
      // data + surfaces
      "DataTable",
      "MetricRow",
      "MetricChartCard",
      "ChartPanel",
      "StatTile",
      "StatusBadge",
      "StatusDot",
      // charts (shared engine, re-exported from /app)
      "LineAreaChart",
      "PieChart",
      "RadialChart",
      "RadarChart",
      // anti-slop API
      "lintGeneratedUi",
      "reviewGeneratedUi",
      "formatLintReport",
      "HOUSE_RULES",
      "APP_KIT_AGENT_INSTRUCTIONS",
    ]);
  });
});

describe("anti-drift: /ui entrypoint", () => {
  it("exports the primitives the composer reaches for", () => {
    expectExports(Ui as Record<string, unknown>, [
      "Button",
      "Sheet",
      "SheetContent",
      "SheetDescription",
      "Dialog",
      "DialogDescription",
      // Tabs are PillSegmentedTabs — there is no Radix `Tabs` export here.
      "PillSegmentedTabs",
    ]);
  });

  it("does not resurrect a bare `Tabs` export (use PillSegmentedTabs)", () => {
    expect((Ui as Record<string, unknown>).Tabs).toBeUndefined();
  });
});

describe("anti-drift: /studio entrypoint", () => {
  it("exports the studio shell surface", () => {
    expectExports(Studio as Record<string, unknown>, [
      "StudioSidebar",
      "TimbalStudioShell",
    ]);
  });

  it("does not export an AppShellTopbar (use AppShell topbar={…})", () => {
    expect((App as Record<string, unknown>).AppShellTopbar).toBeUndefined();
    expect((Studio as Record<string, unknown>).AppShellTopbar).toBeUndefined();
  });
});

describe("anti-drift: prop names (type-level)", () => {
  it("DataTable takes `rows` (not `data`)", () => {
    const key: keyof DataTableProps<unknown> = "rows";
    expect(key).toBe("rows");
  });

  it("AppShell exposes `topbar` + `mobileSidebarTrigger`", () => {
    const topbar: keyof AppShellProps = "topbar";
    const trigger: keyof AppShellProps = "mobileSidebarTrigger";
    expect([topbar, trigger]).toEqual(["topbar", "mobileSidebarTrigger"]);
  });

  it("charts take `data` + `series`/`colors`", () => {
    const line: keyof LineAreaChartProps = "series";
    const pie: keyof PieChartProps = "colors";
    expect([line, pie]).toEqual(["series", "colors"]);
  });
});
