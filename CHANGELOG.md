# Changelog

All notable changes to `@timbal-ai/timbal-react` are documented here.

## [Unreleased]

## [1.6.1] — 2026-06-27

### Fixed

- **recharts charts no longer white-screen under React 19** — recharts 3.6+ stores React elements inside a Redux-Toolkit/`immer` store, and `immer` **11.0.0** froze React 19's Fiber internals, so chart routes crashed with `Cannot assign to read only property 'lanes'`. The crash was always a transitive-dependency mismatch (a stale lockfile pinning `immer@11.0.0`), not a problem with the chart components — `LineAreaChart`, `PieChart`, `RadialChart`, and `RadarChart` are unchanged. The package now forces `immer` to `>=11.0.1` via `overrides`/`resolutions`, deduping to a single safe copy.

### Changed

- **recharts pinned to an exact tested version (`3.8.1`)** so the recharts/Redux-Toolkit/`immer` matrix the package validates against can't float into an untested 3.x range.
- **`APP_KIT_AGENT_INSTRUCTIONS` charts section** now tells codegen agents that the React 19 chart crash is a dependency override (`"overrides": { "immer": ">=11.0.1" }`), **not** a code change — and to keep using the chart components instead of hand-rolling SVG/CSS charts as a workaround.

### Tooling

- **`check:deps` preflight guard** (`scripts/check-immer.mjs`, wired into CI) fails the build if any installed `immer` falls in the broken `[11.0.0, 11.0.1)` window, turning a silent runtime white-screen into a loud, actionable error. Example apps (`examples/app-kit`, `examples/mock-ui`) carry the same `immer` override.

## [1.6.0] — 2026-06-26

### Changed

- **Condensed layout density across all UI primitives** — heights, paddings, and gaps were stepped down one notch library-wide for a tighter, more data-dense default. Driven from the shared tokens (`CONTROL_SIZE` h-10→h-9 / h-9→h-8 in `src/design/control-surface.ts`, `TOPBAR_HEIGHT_PX` 48→44 and `PILL_HEIGHT_PX` 40→36 in `src/design/tokens.ts`, `TIMBAL_V2_SIZE_HEIGHT`/`SIZE_ICON`/`SIZE_LABEL_PX` in `src/design/button-tokens.ts`, segmented-control paddings in `src/design/pill-segmented-classes.ts`) and applied consistently to `Button`, `UntitledButton`, `Card`, `Table`, `Alert`, `Dialog`, `Sheet`, `Popover`, `Accordion`, `Select`, `DropdownMenu`, `Menubar`, `Command`, `TagInput`, `Toolbar`, `Toast`, `Avatar`, `Calendar`, `Textarea`, `CopyButton`, `Snippet`, `InputOTP`, and `Breadcrumb`. Non-breaking: all component APIs and size variant names are unchanged.

### Fixed

- **Badges no longer stretch inside flex-column layouts** — `StatusBadge` (`src/app/surfaces/StatusBadge.tsx`) and the artifact `badge` node (`src/artifacts/ui/nodes.tsx`) now carry `w-fit shrink-0`, so a badge placed in a vertical flex container (e.g. a `Kanban` card) hugs its label instead of expanding to the full column width.

## [1.5.0] — 2026-06-26

### Added

- **`Kanban` board primitive** (`src/ui/kanban.tsx`) — A fully-featured, highly accessible Kanban board with column customization, drag-and-drop capabilities powered by `@dnd-kit`, and a read-only mode for static board rendering.
- **App density system** (`src/app/layout/app-density-context.tsx`, `src/design/app-density.ts`) — Context-driven density controls supporting "standard" and "compact" layouts. Compact mode cascades tighter padding, smaller text, and lower default heights to descendant components (pages, charts, tables).
- **Advanced filtering** (`src/app/data/FilterDropdown.tsx`, `src/app/data/FilterField.tsx`) — `FilterDropdown` is a **data-driven** multi-facet filter popover: pass `fields` describing your actual columns (`multiselect` / `text` / `daterange` / `numeric`) and it adapts to the table's content. State is keyed by field `id`, controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); every control is on the shared control-surface contract. It renders **removable active-filter pills** (with "Clear all") next to the trigger by default (`showActiveChips`). `FilterField` is the labeled single-control wrapper for `FilterBar`.
- **Site/Marketing primitives** (`src/site/`) — A brand new `./site` subpath export containing five high-quality interactive and marketing-grade components:
  - **`Magnetic`** — magnetic hover effect that pulls elements toward the cursor.
  - **`Marquee`** — high-performance, infinite scrolling marquee.
  - **`Parallax`** — scroll-driven parallax container with custom speed factors.
  - **`Reveal`** — scroll or entrance fade-in reveal with custom directions and delays.
  - **`TextReveal`** — character-by-character or word-by-word scroll-reveal animations.

### Agent instructions & exports

- **`SITE_AGENT_INSTRUCTIONS`** — a new codegen prompt (exported from `./site` and the package root) documenting the `/site` motion primitives, their props, reduced-motion/SSR guarantees, and dosing/anti-overuse guidance.
- **`/site` primitives re-exported from the package root** — `Reveal`, `TextReveal`, `Parallax`, `Marquee`, `Magnetic` (plus the `EASE` / `DURATION` / `SPRING` motion tokens) are now reachable from both `@timbal-ai/timbal-react` and `@timbal-ai/timbal-react/site`, matching `/studio`, `/app`, and `/ui`.
- **`APP_KIT_AGENT_INSTRUCTIONS` expanded** — documents `FilterDropdown` and surfaces the new dependency-free `/ui` primitives (`Stepper`, `Rating`, `NumberField`, `TagInput`, `AvatarGroup`, `CircularProgress`, `CopyButton`, `Snippet`) so codegen agents discover them.

## [1.4.0] — 2026-06-05

### Added

- **`AppShell contentFill`** — makes the content region a bounded, non-scrolling flex column instead of the default padded scroll area. For full-bleed pages that own their own scroll (a full-page chat, a canvas, an editor, a split master–detail view): a `h-full` / `flex-1 min-h-0` child now fills exactly and a pinned footer (the chat composer) stays put instead of riding down on scroll. No `mainClassName` surgery and no `h-[calc(100dvh-…)]` guesses required.
- **`Page fill`** — makes a `Page` a `min-h-0 flex-1` flex column (pair with `AppShell contentFill` for full-height content). Give the fill child `min-h-0 flex-1`.
- **Headerless `Page`** — `Page.title` (and `PageHeader.title`) is now optional. Omit it to render a page with no `<h1>` header row (and no header padding), instead of dropping `Page` entirely to lose a heading.
- **New layout recipes** (`examples/app-kit/src/recipes/`): **full-page chat** (`contentFill` + headerless `fill` + `TimbalChat`), **split view** (master–detail two-pane), and **bento dashboard** (asymmetric `SurfaceCard`/`ChartPanel`/`StatTile` grid) — surfaced in the Blocks gallery and `APP_KIT_AGENT_INSTRUCTIONS` as distinct layout archetypes so generated UIs vary beyond the single sidebar+topbar+MetricRow+table shape.

### Changed

- **`AppShell` `main` is now a bounded flex column by default** (`flex min-h-0 flex-col`, keeping `pb-8 md:pb-10`). Previously the content `main` was content-sized, so every full-height child had to pass `mainClassName="flex min-h-0 flex-col"` to undo a layout deficiency; `h-full` / `flex-1` children now resolve a height out of the box. Scrolling `Page` content is unaffected (the outer scroll region still scrolls).
- **`APP_KIT_AGENT_INSTRUCTIONS`** documents a **Layout archetypes** menu (sidebar dashboard, focused, bento overview, split master–detail, full-page chat/canvas, copilot overlay, section-switcher) and the full-height contract (`contentFill` / `fill` / headerless `Page`), steering codegen away from shipping the same layout every time and away from `h-[calc(100dvh-…)]` / `min-h-[…]` sizing hacks.

### Fixed

- **`FieldSwitch` / `FieldSelect` id collision** — these derived their input id from `id ?? name ?? "switch"`, so multiple unlabeled instances all rendered `id="switch"` and toggling one flipped the others (and labels mis-associated). They now fall back to a `useId()`-generated id, so every instance is unique by default. `FieldInput` / `FieldTextarea` get the same `useId()` fallback (fixes silent label/control mis-association when no `name` is set).

## [1.3.0] — 2026-06-04

### Added

- **Ten new `/ui` primitives** — all dependency-free, styled with the design tokens and (where applicable) the control-surface contract:
  - **`AvatarGroup`** — overlapping avatar stack with an optional `+N` overflow chip (`max`, `spacing`).
  - **`Stepper`** — ordered step indicator for wizards/onboarding; horizontal or vertical, with complete/active/upcoming states.
  - **`Timeline`** — vertical event rail with per-item `title` / `description` / `meta` and tones (activity logs, audit history).
  - **`Rating`** — star rating, interactive (keyboard + hover preview) or `readOnly`; controlled or uncontrolled.
  - **`NumberField`** — numeric input with −/+ steppers on the shared control surface; clamps to `min`/`max`, steps by `step`.
  - **`TagInput`** — chips/token input on the control surface; commits on Enter/comma, removes on Backspace, optional `dedupe`/`max`.
  - **`Banner`** — page-level announcement bar with tones, optional icon/actions, and a dismiss button (use `Alert` for in-flow messages).
  - **`CopyButton`** — click-to-copy with a transient check confirmation; icon-only or with a label.
  - **`Snippet`** — single-line code/command on the elevated surface with a built-in copy button.
  - **`CircularProgress`** — lightweight SVG progress ring, determinate (with optional center label) or indeterminate.

### Fixed

- **`Calendar` rebuilt for `react-day-picker` v10** — the previous build mixed v8-era `flex` classes onto v10's table-based grid, which broke alignment and left nav/day buttons unstyled (`buttonVariants` carries layout only in this package). The calendar now uses v10's native table layout with the correct class keys, roomy `size-10` cells, spaced rows, a clear weekday header, and on-token selected / range / today states. Fixes both the inline `Calendar` and the `DatePicker` popover.

## [1.2.0] — 2026-06-03

### Changed

- **App-kit charts now run on [recharts](https://recharts.org)** (native shadcn chart layer). `LineAreaChart`, `PieChart`, `RadialChart`, and `RadarChart` keep the same public props but render via recharts under the shadcn `ChartContainer` / `ChartTooltipContent` / `ChartLegendContent` chrome — so tooltips, hover states, and animation match shadcn exactly across every chart kind. Series colors still flow from the theme `--chart-1..6` tokens.
- **Flush dashboard charts are tooltip-first** — `ChartPanel`, `MetricChartCard`, and cartesian `ChartArtifact` views use `layout="flush"` with **axes hidden by default**; category labels and formatted values appear in shadcn tooltips on hover. Fixes clipped axis ticks and edge-cropped bars/lines in card shells.
- **`LineAreaChart` margins and scales** — symmetric plot inset when axes are off; `no-gap` / zero bar gap only when category axes are explicitly shown; horizontal bars use band category scale (no misaligned Y ticks).
- **Linked Vite dev** — `timbalReactLocalDev()` always aliases `file:../timbal-react` installs to `src/` so gallery apps pick up source edits without rebuilding `dist/` first.
- Polish: in-card legends no longer clip outside the card; line/area charts use a thin crosshair cursor; tooltips animate in; radial/radar charts have hover tooltips.

### Added

- **shadcn chart primitives exported from `/ui`**: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `useChart`, and the `ChartConfig` type.
- **`ChartArtifact.showAxes`** — opt-in axis ticks on flush cartesian charts (default off).
- **`resolveChartMargin`**, **`resolveTooltipCategory`**, and related helpers exported from the charts entry for tests and custom wrappers.

### Dependencies

- Adds **`recharts`** as a dependency and **`react-is`** as a peer dependency (`react-is` must match your React version).

## [1.1.0] — 2026-06-03

### Added

- **`DataTable` scales to real datasets** — three additive props (all backward-compatible):
  - **`pageSize`** — built-in client-side pagination with a compact footer pager (row range + prev/next). Controlled via `pageIndex` / `onPageChange`, or uncontrolled with `defaultPageIndex`; out-of-range pages snap back after filtering.
  - **`selectable`** + **`selectedKeys`** / **`defaultSelectedKeys`** / **`onSelectionChange`** — a leading checkbox column with header select-all (indeterminate state) for bulk actions (acknowledge/resolve/export). Toggling a checkbox never triggers `onRowClick`.
  - **`loading`** (+ **`loadingRows`**) — shaped skeleton rows that preserve the header/columns so the table doesn't jump when data arrives.
- **Loading states across the data kit** — `MetricRow`, `MetricChartCard`, and `ChartPanel` accept **`loading`**, rendering skeleton tiles / plot-height skeletons. Every async dashboard gets a consistent pending state without re-inventing one.
- **`useLiveQuery` / `useInterval`** (root + `/app`) — poll an async source on an interval for live dashboards (alerts, metrics, logs). Handles loading vs. background `refreshing`, drops stale/post-unmount responses, pauses while the tab is hidden + refetches on focus, and exposes `lastUpdated` + a manual `refetch`. Pairs with `authFetch`.
- **`AppShell` owns the mobile nav** — `AppShell` manages the drawer open-state (`navOpen` / `defaultNavOpen` / `onNavOpenChange`), renders the mobile backdrop automatically, and provides **`useAppShellNav()`** + **`AppShellSidebarTrigger`** (an `md:hidden` hamburger). Wiring a responsive `StudioSidebar` drops from ~30 lines of `isMobile`/resize/backdrop boilerplate to passing `mobileOpen={nav.open}` / `onMobileOpenChange={nav.setOpen}`.
- **`StatusBadge` `tone="danger"`** — a destructive/red tone for critical severity, so error/critical states aren't forced onto the brand `primary` tone.

## [1.0.0] — 2026-06-02

First stable release. The `@timbal-ai/timbal-react/ui` primitive layer, the control-surface contract, and the app-kit are now a settled public surface.

### Added

- **Built-in motion engine** — Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tooltip, Toast, NavigationMenu, and Accordion / Collapsible now animate (fade / zoom / slide / height) out of the box. The `animate-in` / `animate-out` / `fade-*` / `zoom-*` / `slide-*` utilities and the `accordion` / `collapsible` / `caret-blink` keyframes are **inlined in `styles.css`** — no `tailwindcss-animate` / `tw-animate-css` dependency and no consumer config. Duration flows from any `duration-*` utility via `--tw-duration` (default 150ms). Compose `overlayAnimationClass` for custom overlays.
- **Complete vendored primitive catalog** on the control-surface contract: `Form`, `AspectRatio`, `Toolbar`, `Menubar`, `NavigationMenu`, `Breadcrumb`, `Pagination`, `Command` (cmdk), `Calendar` (react-day-picker), `Combobox`, `DatePicker`, `InputOTP`, `Kbd`, `Spinner`, `InputGroup` — alongside the existing `Input`, `Select`, `Dialog`, `Sheet`, `AlertDialog`, `Table`, `Toast`, `Card`, `Badge`, `Slider`, `Progress`, and more.
- **`overlayListPanelClass`** + **`PopoverContent` `variant="list"`** — one shared listbox/menu chrome so `Select`, `DropdownMenu`, `Combobox`, and `Command` panels are visually identical. `Combobox` uses `ComboboxTrigger` (control skin), not a `Button`.
- **App-kit organized into two libraries** (example): a **UI primitives** catalog (per-family audit, sidebar) and a **Blocks** library (composed sections — Project settings, Settings form, Metrics, Analytics, Charts, Table, Integrations, Resources, Confirm & destructive, Detail sheet, Empty states, Sign-in). Driven by `primitives-catalog.ts` / `blocks-catalog.ts`.

### Changed

- `overlayAnimationClass` is now exported from `@timbal-ai/timbal-react/ui` and the root for composing custom overlays.

### Removed (breaking)

- **`Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` are no longer exported.** Radix/shadcn Tabs are intentionally not part of this package. Use **`PillSegmentedTabs`** (`trackVariant="flush"`) or the app-kit **`SubNav`** for section bars; switch panel content with local state or the router. Use `Accordion` / `Collapsible` for expand-collapse.

---

## [0.8.2] — 2026-06-02

### Added

- **Full theme personalities** — extend programmatic theming beyond brand color to **roundness, shadows, and fonts** in one intent object:
  - **`createTimbalTheme`** — new options: `shadow` (`none` | `hairline` | `soft` | `medium` | `strong`), `typography` (`sans`, optional `display`/`mono`, `importUrl` for web fonts). `radius` now also sets `--radius-2xl` (composer shell). Returns `fontFamily` + `fontImportUrl` for runtime font loading.
  - **`themeToCss(theme, { scope?, includeFontImport? })`** — emits a `font-family: var(--font-sans)` rule when the theme carries a font; optional `@import` for standalone stylesheets.
  - **`ensureThemeFontLink(url)`** — inject/remove a managed font `<link>` in `<head>`.
  - **`applyTimbalTheme` / `TimbalThemeStyle`** — auto-load preset/custom web fonts via `<link>`.
  - **`TIMBAL_THEME_PRESETS`** — each preset is now a full personality (color + radius + shadow + font), not color-only. New presets: **`folio`** (Fraunces serif, sharp corners), **`carbon`** (JetBrains Mono, green accent). Existing presets (`indigo`, `violet`, …) ship distinct fonts and radii.
  - **`ThemePresetGallery`** — shows font name on each swatch card.
  - **`THEME_AGENT_INSTRUCTIONS`** — documents typography, shadow, and font-loading rules for UI-generation agents.

### Changed

- **`TimbalThemePreset`** — adds optional `font` label for pickers.

---

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
