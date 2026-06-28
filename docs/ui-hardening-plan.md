# UI package hardening — tracking doc

Working branch: `feat/ui-hardening` (from `origin/main`, v1.6.1 — the real published source).

**Guiding principle:** the composer largely ignores prose instructions, so the code must speak for itself. Invest in types, defaults, JSDoc-with-examples on the `.d.ts` surface agents grep, and fail-loud runtime/lint errors. Instruction strings (`APP_KIT_AGENT_INSTRUCTIONS` etc.) and `timbal-ui-skill.md` stay as a thin fallback only.

This doc is the turn-by-turn checklist. Check items off as they land.

## Phase 0 — Anchor to the real source (blocking)
- [x] Fetch `origin`, confirm `origin/main` is the published source (v1.6.1).
- [x] Check out `feat/ui-hardening` from `origin/main`.
- [x] Verify baseline: `bun install`, `bun run typecheck` (clean), `bun test` (290 pass), `bun run build` (green).
- [x] Write this tracking doc.

## Phase 1 — Detach mobile sidebar trigger from the topbar (finding #1) — DONE
- [x] Added neutral `src/layout/shell-nav-context.tsx` channel (shared by app + studio, like the inset channel).
- [x] `AppShell` auto-renders a floating mobile hamburger (`md:hidden`, top-left) when `sidebar` is present and there's no topbar, driving its nav controls. New `mobileSidebarTrigger?: "auto" | "topbar" | "none"` (default `"auto"`).
- [x] `StudioSidebar` drawer auto-syncs to the shell nav controls when `mobileOpen` isn't passed — `<AppShell sidebar={<StudioSidebar/>}>` works on mobile with zero wiring, no topbar.
- [x] Simplified `reference/operations-dashboard.tsx` (dropped `StudioSidebarBackdrop`, `isMobile`, manual Menu button + `mobileOpen` wiring).
- [x] Added `recipes/sidebar-dashboard.tsx` (canonical no-topbar sidebar dashboard) + registered in catalog/gallery/STANDALONE_SHELL_BLOCKS.
- [x] Tests: auto-trigger + open/backdrop swap + none/topbar/no-sidebar cases (`app.test.tsx`); shell-nav channel (`shell-nav-context.test.tsx`); StudioSidebar sync (`sidebar.test.tsx`). 299 pass, typecheck + boundaries clean.
- [ ] Blueprint `AppKitDemo.tsx` simplification deferred to Phase 6 (relink).

## Phase 2 — Fail-loud guardrails — DONE
- [x] Chart-color lint rule `chart-token-color-fn` (error): flags `hsl(var(--…))` / `rgb(var(--…))` / `oklch(var(--…))` wrapping a token; precise OKLCH message; suppresses the generic `color-literal` on the same line. `HOUSE_RULES` `chart-token-color` entry + coverage map + tests.
- [x] `lintGeneratedUi` throws a clear `TypeError` on non-string input (message states the signature + names the `{ filename, source }` misuse); `formatLintReport` throws when handed the whole result. `reviewGeneratedUi` inherits the guard. Tests.
- [x] `SheetDescription` + `DialogDescription` render as `<div>` (via `asChild`) so block children are valid HTML (no `<div>` in `<p>`). `AlertDescription` already a `<div>`. Tests (`sheet.test.tsx`).
- [x] Test env: inject `NodeFilter` + all `HTML*Element` constructors in `src/test/setup.ts` so open Radix Dialog/Sheet renders (general fix). 307 pass.

## Phase 3 — Self-documenting API (core) — DONE
- [x] `@example` blocks on the hot surface: `LineAreaChart`, `PieChart`, `RadialChart`, `RadarChart`, `DataTable`, `StatusBadge`, `StatusDot`, `MetricRow` (AppShell `mobileSidebarTrigger` documented in Phase 1).
- [x] Tightened/clarified types: `ChartSeries.color` + chart `colors` docs warn against `hsl(var(--…))`; `DataTable.rows` (not `data`) + required `getRowKey` called out; `StatusBadge` vs `StatusDot` tone vocabularies disambiguated in JSDoc.
- [x] Defaults confirmed: charts default to `--chart-N` (CHART_PALETTE), mobile nav auto (Phase 1), headerless `Page` when `title` omitted (existing test).
- [x] Anti-drift test (`src/anti-drift.test.ts`): asserts the /app, /ui, /studio export surface the examples/blueprint use, that `Tabs`/`AppShellTopbar` are NOT exported, and key prop names (`rows`, `topbar`, `mobileSidebarTrigger`) at the type level.
- [x] Env/preview/cache notes captured once in `docs/agent-environment.md` (not prompt strings).

## Phase 4 — chat-with-drawer recipe — DONE
- [x] Added `examples/app-kit/src/recipes/chat-with-drawer.tsx` (AppShell contentFill + headerless Page fill + TimbalChat + right-side Sheet drawer with its own bounded scroll region).
- [x] Registered in `blocks-catalog.ts` (nav + entry), `blocks-gallery.tsx` (RECIPE_BLOCKS + STANDALONE_SHELL_BLOCKS). Example typechecks.

## Phase 5 — Trim + consolidate — DONE
- [x] Consolidated confusable APIs toward "one obvious way" via disambiguating JSDoc (the discovery surface agents read): `Button` is the default (TimbalV2Button/UntitledButton flagged as specialized chrome); `ChartPanel` vs `MetricChartCard` (single chart vs selectable-KPI+chart); `FieldSelect` (labeled native select for forms) vs the Radix `Select` composition.
- [x] Kept the public export surface stable — no automated dead-code tool exists (only `check:boundaries`/`check:bundle`/`check:deps`), and removing published exports from a republished package risks breaking consumers without consumer visibility. Trim is delivered as guidance/types, not deletions.
- [x] Did not grow the instruction strings (`agent-instructions.ts` untouched); `HOUSE_RULES` remains the lint source of truth (added `chart-token-color` in Phase 2). The types/examples now carry the load.

## Phase 6 — End-to-end verification — DONE
- [x] Bumped to **1.7.0** (package.json + CHANGELOG). `bun run build` green; verified the new JSDoc `@example`, `mobileSidebarTrigger`, and `chart-token-color-fn` all land in `dist/*.d.ts` / the CLI bundle.
- [x] Simplified the blueprint's canonical reference `AppKitDemo.tsx` to the no-topbar pattern (dropped `StudioSidebarBackdrop`, `isMobile`, the `TimbalV2Button` menu, the topbar slot, and manual `mobileOpen` wiring).
- [x] Refreshed `blueprint-ui-simple-chat/node_modules/@timbal-ai/timbal-react` to 1.7.0; blueprint `tsc -b` clean and `vite build` succeeds.
- [x] Smoke-tested the lint CLI end-to-end: `hsl(var(--chart-1))` → `chart-token-color-fn` error (exit 1); `sidebar-dashboard` + `chat-with-drawer` recipes lint clean (exit 0).
- [x] Final package gate: typecheck clean, boundaries clean, **315 tests pass**.

## Outcome summary
- Mobile sidebar nav no longer requires a topbar — `<AppShell sidebar={<StudioSidebar/>}>` just works (the highest-impact friction, finding #1).
- Silent failures are now loud: chart-token color (build-passes/empty-chart) and lint-API misuse throw/lint; Sheet/Dialog descriptions can't produce `<div>`-in-`<p>` hydration errors.
- The `.d.ts` surface agents grep now carries copyable `@example`s + disambiguation, and an anti-drift test fails if the surface drifts — addressing the "grep dist to reverse-engineer" loop and skill↔package drift at the source.

## Notes
- Concurrent-edit collisions (finding #9) are a process issue — out of scope beyond this note.
