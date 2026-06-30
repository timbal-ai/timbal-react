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
import * as Chat from "./chat/index";
import * as Root from "./index";

import type { DataTableProps } from "./app/data/DataTable";
import type { AppShellProps } from "./app/layout/AppShell";
import type { SectionProps } from "./app/layout/Section";
import type { LineAreaChartProps, PieChartProps } from "./charts/index";
import type { StudioSidebarItem } from "./studio/index";
import type { StudioSidebarProps } from "./studio/sidebar/sidebar";
import type { UseLiveQueryResult } from "./hooks/use-live-query";
import type { ReactNode } from "react";

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
      "AlertCard",
      "CatalogCard",
      // charts (shared engine, re-exported from /app)
      "LineAreaChart",
      "PieChart",
      "RadialChart",
      "RadarChart",
      // density API
      "AppDensityProvider",
      "useAppDensity",
      "appDensityClass",
      // anti-slop API
      "lintGeneratedUi",
      "reviewGeneratedUi",
      "formatLintReport",
      "HOUSE_RULES",
      "APP_KIT_AGENT_INSTRUCTIONS",
      // catalog
      "APP_KIT_CATALOG",
      "getCatalogEntry",
    ]);
  });

  it("exports the self-contained copilot (drop-in, not an AppShell prop)", () => {
    expectExports(App as Record<string, unknown>, [
      "AppCopilot",
      "CopilotProvider",
      "CopilotPanel",
      "CopilotOverlay",
      "useCopilot",
      "AppCopilotProvider",
      "useAppCopilotContext",
      "SiriWave",
      // deprecated aliases kept one major
      "AppChatPanel",
      "useAppShellChat",
    ]);
  });

  it("exports the importable, forkable blocks", () => {
    expectExports(App as Record<string, unknown>, [
      "FilteredDataTable",
      "StatGrid",
      "IntegrationsGrid",
      "ResourceGallery",
      "SettingsLayout",
    ]);
  });

  it("AppShell no longer carries chat* props (copilot is decoupled)", () => {
    // Compile-time guard: if any chat* prop leaked back onto AppShellProps this
    // union resolves to `true` and the `false` assignment becomes a type error.
    type HasChatProp =
      "chat" extends keyof AppShellProps ? true
      : "chatTriggerLabel" extends keyof AppShellProps ? true
      : "chatCollapsible" extends keyof AppShellProps ? true
      : "chatWidth" extends keyof AppShellProps ? true
      : "chatHeight" extends keyof AppShellProps ? true
      : false;
    const hasChatProp: HasChatProp = false;
    expect(hasChatProp).toBe(false);
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

  it("StudioSidebar nav items accept an optional `icon` (route nav — no custom rail)", () => {
    // Compile-time guarantee: { id, name, icon } is a valid item, so an agent
    // never needs to hand-roll a <nav> rail just to get per-item icons.
    const icon: ReactNode = null;
    const item: StudioSidebarItem = { id: "dashboard", name: "Dashboard", icon };
    expect(item.id).toBe("dashboard");
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

  it("StudioSidebar takes `items` (with `workforces` as a back-compat alias)", () => {
    const items: keyof StudioSidebarProps = "items";
    const workforces: keyof StudioSidebarProps = "workforces";
    expect([items, workforces]).toEqual(["items", "workforces"]);
  });

  it("Section takes an `actions` slot", () => {
    const actions: keyof SectionProps = "actions";
    expect(actions).toBe("actions");
  });

  it("useLiveQuery exposes `refresh` (alias of `refetch`)", () => {
    const refresh: keyof UseLiveQueryResult<unknown> = "refresh";
    const refetch: keyof UseLiveQueryResult<unknown> = "refetch";
    expect([refresh, refetch]).toEqual(["refresh", "refetch"]);
  });
});

describe("anti-drift: root = subpaths (deterministic re-export contract)", () => {
  const root = Root as Record<string, unknown>;

  it("re-exports every /app, /ui, /studio, and /chat value (no `export *` collision drops them)", () => {
    // The root `export *`s these barrels; an unresolved name collision would
    // silently drop the symbol from the root. Assert parity for every value
    // export of each subpath (types erase at runtime, so we check values).
    const subpaths: Array<[string, Record<string, unknown>]> = [
      ["/app", App as Record<string, unknown>],
      ["/ui", Ui as Record<string, unknown>],
      ["/studio", Studio as Record<string, unknown>],
      ["/chat", Chat as Record<string, unknown>],
    ];
    const dropped: string[] = [];
    for (const [label, mod] of subpaths) {
      for (const name of Object.keys(mod)) {
        if (root[name] === undefined && mod[name] !== undefined) {
          dropped.push(`${label}:${name}`);
        }
      }
    }
    expect({ dropped }).toEqual({ dropped: [] });
  });

  it("pins collision names to a single canonical source", () => {
    // Button/Banner/Timeline/Kanban come from /ui; TimbalChat from /chat;
    // ChartArtifactView from /artifacts — all also re-exported by /app.
    expectExports(root, ["Button", "Banner", "Timeline", "Kanban", "TimbalChat", "ChartArtifactView"]);
    expect(root.Button).toBe((Ui as Record<string, unknown>).Button);
    expect(root.TimbalChat).toBe((Chat as Record<string, unknown>).TimbalChat);
  });

  it("keeps root-only modules reachable (auth, attachments, primitives, cn)", () => {
    expectExports(root, [
      "SessionProvider",
      "AuthGuard",
      "resolveAttachmentAdapter",
      "useWorkforces",
      "parseSSELine",
      "AssistantRuntimeProvider",
      "cn",
    ]);
  });
});
