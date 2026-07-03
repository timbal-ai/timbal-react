# Proposal: monolith `timbal-ui` skill + UI gate updates

**Audience:** whoever maintains `monolith/src/composer/skills/timbal-ui/SKILL.md` and
`monolith/src/composer/assets/ui_gate_hook.sh` (a copy of the skill also lives in
`leviosia/skills/timbal-ui/SKILL.md` — apply the same edits there).

**Context:** `@timbal-ai/timbal-react` relaxed its codegen guardrails to match current
model quality. The package now treats **errors = correctness/theming integrity** and
**warnings = taste**, supports the `AppShell topbar` slot, and ships a redesigned
`StudioSidebar`. The monolith skill and the stop-hook gate still describe (and enforce)
the old, stricter regime — and the skill still targets package **2.0.0** while
**3.0.0 is released** (breaking: `TimbalV2Button` removed).

## 1. Package changes these edits track

| Change | Where |
|---|---|
| `AppShell topbar={…}` is a **supported slot** (brand + nav + search + account); `AppShellSidebarTrigger` may sit inside it. `no-custom-shell-chrome` no longer fires on either. | `src/design/ui-lint.ts`, `HOUSE_RULES` |
| Lint severities re-tiered: `no-glow`, `no-uppercase-heading`, `no-table-in-card`, custom-heading-in-chat, and hand-rolled-rail are **warnings** (block only under `--strict`). Raw colors, color literals, `hsl(var(--token))`, unsafe chart dataKeys, theme bypasses, chat-wrapping stay **errors**. | `src/design/ui-lint.ts` |
| `StudioSidebar` redesigned: flat quiet nav rows; new `variant` prop — **`"flush"` full-height rail is the default**, `"floating"` keeps the studio card. Footer user menu now token-styled. | `src/studio/sidebar/*` |
| 3.0.0 (already released): **`TimbalV2Button` removed** — `Button` is the only button. | CHANGELOG 3.0.0 |

Suggested release for the new work: **3.1.0** (APIs additive; note the sidebar's default
appearance changed — apps wanting the old look pass `variant="floating"`).

## 2. `SKILL.md` edits (by current line)

- **Frontmatter (`description`) + L10 + L605 (tech stack):** bump "latest **2.0.0**" →
  "latest **3.x**". Add to the trigger list: `StudioSidebar variant`, `topbar`.
- **L12 (".d.ts note") and L46 ("TS2305 traps"):** delete the "never pass
  `AppShell topbar={…}` — hard lint error" claims. Keep "there is no `AppShellTopbar`
  component" (still true) and point to the **`topbar` prop**: compose it from kit
  controls (`SearchInput`, `DropdownMenu`, `Avatar`, ghost `Button`), put
  `<AppShellSidebarTrigger />` inside it when a sidebar drawer coexists.
- **L82 (layout archetypes):** replace "never a global topbar, which is a lint error"
  with a **Topbar app** archetype: browse/gallery/marketing-style products
  (`AppShell topbar={…}` + `Page`, sidebar optional).
- **L104–109 (CRM mandatory pattern):** keep "don't hand-roll `app-sidebar.tsx` or a
  `fixed top-0` bar" but route horizontal nav through the `topbar` slot instead of
  banning it. Mention `StudioSidebar` renders as a flush rail by default now.
- **L214 (component menu row for AppShell):** "layout-only; **no topbar**" →
  "layout-only; optional `sidebar` and/or `topbar` slots".
- **L307–309 + L484 (`Button` vs `TimbalV2Button`):** **stale since 3.0.0** —
  `TimbalV2Button` no longer exists (TS2305). Replace with `Button`-only guidance:
  `isLoading` and `asChild` live on `Button`; icon-only = `size="icon-*"`;
  `shape="pill"` for chat/studio chrome; `color="primary-destructive"` for solid
  destructive CTAs; `fullWidth` → `className="w-full"`.
- **L468 ("Global topbar | Never" row):** change to **Yes** — `AppShell topbar={…}`;
  still never a hand-rolled `fixed top-0` div outside the shell.
- **L446 ("A hard gate runs automatically"):** describe the new tiering — the gate
  always blocks **errors**; whether **warnings** block depends on the strictness knob
  (see §3). Keep "self-review against warnings anyway" as prompt guidance.
- **New (sidebar):** document `StudioSidebar variant="flush" | "floating"` (flush =
  default full-height rail, hairline border; floating = rounded studio card) — one line
  in the component menu and in the CRM pattern.

## 3. `ui_gate_hook.sh` — make strictness a knob, not a constant

Today line ~90 hard-codes `--strict` (warnings block every model). Proposal:

```bash
# strict by default; the pipeline can relax taste rules for frontier models
STRICT_FLAG="--strict"
case "${TIMBAL_UI_LINT_MODE:-strict}" in
  lenient) STRICT_FLAG="" ;;
esac
lint_out="$("$LINT" $STRICT_FLAG "${files[@]}" 2>&1)"
```

and set `TIMBAL_UI_LINT_MODE=lenient` in the compose-session env for top-tier
generation models (keep `strict` for cheap/fast tiers). Rationale: errors (correctness,
theming) still always block; taste warnings stop bouncing deliberate, defensible style
choices made by strong models. No hook-contract changes otherwise.

## 4. Why (one paragraph for the reviewer)

The old gate was calibrated for weaker models: it banned whole layout families
(topbar) and froze taste opinions as hard errors. With current models that inverted —
the allowlist made the kit's own components the quality ceiling (the ugly sidebar was
the visible symptom: models were forbidden from doing better). The package now fixes
the mandated components instead (sidebar redesign), keeps hard enforcement only where
output silently breaks (colors/tokens/charts/chat layout), and moves taste to a
per-model-tier strictness knob. The skill text should stop teaching the old bans, and
the gate should expose the knob.
