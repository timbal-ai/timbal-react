# Changelog

All notable changes to `@timbal-ai/timbal-react` are documented here.

## [0.8.1] — 2026-06-02

### Added

- **Programmatic theming** — derive a complete, paired light + dark palette from a single brand color so apps and UI-generation agents never hand-author OKLCH or risk a light-only override:
  - **`createTimbalTheme({ brand, accent?, radius?, tintNeutrals? })`** — owns the OKLCH math for `--primary`, its foreground, `--ring`, the full primary button gradient, and the soft playground tint. Returns paired `{ light, dark, root }` token maps.
  - **`themeToCss(theme, { scope? })`** — serialize to a paired `:root` / `.dark` (or `[data-timbal-theme]`-scoped) CSS string for build-time/SSR.
  - **`applyTimbalTheme(theme)` / `clearTimbalTheme()`** — runtime apply via a managed `<style>` (works with the `.dark` toggle); returns a disposer.
  - **`TimbalThemeStyle`** — render a generated theme (or `preset`) as a `<style>` near the app root.
  - **`TIMBAL_THEME_PRESETS`** + **`getThemePreset`**, **`applyThemePreset`**, **`getStoredThemePreset`** — a closed catalog (`platform`, `indigo`, `violet`, `forest`, `warm`, `slate`) to offer styles by stable id; persists to `STORAGE_KEYS.themePreset` (`timbal-theme-preset`).
  - **`ThemePresetGallery`** — preview + pick presets with real-component swatches, scoped so the live app doesn't change until selection.
  - **`THEME_AGENT_INSTRUCTIONS`** — system-prompt text directing UI-generation agents to theme via these APIs, never raw OKLCH.

---

## [0.8.0] — 2026-06-02

### Added

- **Headless UI primitives** (`@timbal-ai/timbal-react/ui`, also re-exported from the root) — token-styled Radix wrappers so apps stop hand-rolling raw HTML:
  - **`DropdownMenu`** family (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`/`DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuSub`/`DropdownMenuSubTrigger`/`DropdownMenuSubContent`) — row actions and overflow menus.
  - **`Popover`** family (`Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`) — filters, pickers, lightweight floating panels.
  - **`Select`** family (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`, scroll buttons) — rich select beyond the native `FieldSelect`.
- **`DialogHeader`**, **`DialogFooter`**, **`DialogDescription`** added to the `Dialog` family so dialog layout no longer has to be hand-rolled.

All new primitives use the package design tokens (`bg-popover`, `border-border`, `shadow-card`, `focus:bg-accent`, …), portal above dialogs (`z-[80]`), and require no extra dependencies — `radix-ui` and `tw-animate-css` are already in the stack.

---

## [0.7.1] — 2026-06-02

### Changed

- **Opaque elevated surfaces** — `--elevated-from` / `--elevated-to` no longer use alpha in light or dark themes, preserving the signature vertical gradient with no background bleed-through.

### Added

- **`TIMBAL_V2_ELEVATED_SURFACE`** — elevated card/list surface (gradient + border + `shadow-card`) without hover/active fill shifts, for catalog cards and connection lists.
- **`TIMBAL_V2_LOGO_TILE`** — logo/integration mark tile pinned to the light plate in both themes so dark provider logos stay legible.
- **`STORAGE_KEYS.theme`** — localStorage key used by `ModeToggle` in uncontrolled mode.

### Fixed

- **`StatTile`** typography aligned with platform metrics (normal weight, compact labels, tabular numerals).

---

## [0.7.0] — 2026-05-29

### Added

- **App kit premade components** under `@timbal-ai/timbal-react/app`:
  - **Metrics:** `MetricRow`, `MetricChartCard`, `MetricTile` (platform-style KPI strip + flush chart)
  - **Integrations:** `IntegrationCard`, `ConnectionRow`, `ConnectionRowList`, `IntegrationsEmptyState`, `PlanBadge`
  - **Settings:** `SettingsSection`, `FieldRow`, `DangerZone`, `FloatingUnsavedChangesBar`
  - **Surfaces:** `InfoCard`, `DescriptionList`, `ExpandableSection`, `ResourceCard`, `StatusDot`
- **Charts engine** (`LineAreaChart`, `Sparkline`, `CHART_PALETTE`) — dependency-free SVG + motion; shared by app kit and chart artifacts
- **`APP_KIT_AGENT_INSTRUCTIONS`** — codegen system-prompt text (component menu, recipes, accessibility)
- **`TIMBAL_V2_ELEVATED_SURFACE`** and **`TIMBAL_V2_LOGO_TILE`** design tokens for catalog/resource cards
- **`@timbal-ai/timbal-react/vite`** — `timbalReactLocalDev()` plugin: linked-package dev, `dist/` watch, src alias when `dist/` is missing
- **`examples/app-kit`** recipe gallery and reference dashboard
- **`AGENTS.md`** section for app kit + recipes

### Changed

- **`ChartPanel`** — same shell as `MetricChartCard` (title row + flush plot); `ChartArtifactView` supports `embedded` mode
- **Chart artifacts** — area/line/bar route through `LineAreaChart` with flush layout and improved styling
- **`Button`** — pill shape by default; re-exported from `/app` for catalog CTAs
- **`StatTile`** — typography aligned with platform metrics (normal weight, compact labels)
- **Integration / resource / metric cards** — elevated secondary chrome; no background flash on card click (reserved for `Button`)

### Fixed

- Local dev **404 on `*.esm.js`** when `dist/` is empty — vite plugin falls back to `src/` with a console warning

---

## [0.6.1]

Subpath exports (`/chat`, `/studio`, `/ui`, `/app`), layered package architecture, initial app kit (`AppShell`, `Page`, `DataTable`, …).
