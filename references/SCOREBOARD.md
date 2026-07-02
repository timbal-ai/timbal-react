# SCOREBOARD — fidelity + cost, per reference, over time

The only progress truth for the reference-faithful generation arc. See
[RUBRIC.md](RUBRIC.md) for scoring and failure classes. Method for each run:
consumer role-play (scratch app under `references/runs/<ref>/run-NN/`, consuming
ONLY `dist/` + exported prompt strings), first attempt measured before any fix
round. `~` marks analytic (non-rendered) scores.

## Fidelity (0–5 per trait, 25 max)

| Reference | Run | Nav | Surface | Type | Density | Accent | Total | Notes |
|---|---|---|---|---|---|---|---|---|
| cream-editorial | 01 | ~4 | ~2 | ~3 | ~3 | ~4 | **~16** | pre-`neutrals`: faked cream by mixing brand into white (pinkish); serif only via span wrappers; DataTable forced airy rows |
| cream-editorial | 02 | ~4 | ~4 | ~4 | ~4 | ~5 | **~21** | true cream via `neutrals`; kit-wide serif h1–h3; protocol's blockPlan swapped DataTable → whitespace-stacked ArticleRows; 3 named invention-lane shapes |
| dark-console | 01 | ~5 | ~5 | ~4 | ~4 | ~4 | **~22** | CORE-tier run; regression baseline holds (console+dark = shipped range); slop-bait declined in nonGoals; SeverityBadge extracted on 3rd use |
| soft-consumer | 01 | ~4 | ~4 | ~4 | ~4 | ~4 | **~20** | CORE-tier; warm canvas via `neutrals(78)`, pastel category washes via sanctioned color-mix, 24px cards via radius 1.25; base type scaled via `:root font-size` hack (type-scale intent gap) |
| dark-console | — | — | — | — | — | — | — | regression baseline |
| glass-saas | — | — | — | — | — | — | — | |
| brutalist-tool | — | — | — | — | — | — | — | |
| soft-consumer | — | — | — | — | — | — | — | |
| dense-grid | — | — | — | — | — | — | — | |
| mono-docs | — | — | — | — | — | — | — | |
| topbar-saas | — | — | — | — | — | — | — | adaptation exercise |
| warm-enterprise | — | — | — | — | — | — | — | |
| neon-analytics | — | — | — | — | — | — | — | slop-bait |

## Cost (per W1 run — must trend down while fidelity trends up)

| Run | Prompt tokens supplied | First-pass lint | TS retries | Wall-clock to valid build | Total agent tokens |
|---|---|---|---|---|---|
| cream-editorial/01 | ~15.1k (appkit 53.9k + theme 5.7k chars) | PASS | 0 | ~11.5m gen + 7s build | 115,718 |
| cream-editorial/02 | ~16.4k (+ reference protocol 2.8k chars) | PASS | 0 | ~25.4m gen + 14s build ⚠️ | 109,850 |
| dark-console/01 | **~1.7k injected** (core.md only; agent pulled appkit/theme/styles/.d.ts on demand) | PASS | 0 | ~10.8m gen + 5s build | 120,906 |
| soft-consumer/01 | ~1.7k injected (core.md only) | 1 warn (`no-title-repetition`) → clean after 1 revision | 0 | ~12.3m gen + 5s build | 125,437 |

Arc so far: first-pass lint 3/4 (75%), TS retries 0/4 median 0, CORE tiering holds
fidelity (≥20 on both CORE-tier runs) at ~1/10th the injected tokens.

⚠️ run-02 wall-clock doubled: the protocol makes the agent read/plan more before
writing. Fidelity +5 justifies it once, but this is the W4 signal to build the
TIERED CORE prompt — most of the 56k-char appkit monolith wasn't needed for an
editorial app with no charts beyond two panels.

## Invented-but-not-promoted shapes (W3 promotion pipeline)

| Shape | First seen (ref/run) | Seen again | Promote when |
|---|---|---|---|
| Reading-list / media-list row (title + quiet meta + hairline progress) | cream-editorial/01 (hand-rolled list) | cream-editorial/02 (`ArticleRow`) | a **second reference** needs it (podcast/queue/media apps will) |
| Pull-quote / blockquote figure (accent left rule + serif quote + muted caption) | cream-editorial/01 | cream-editorial/02 (`HighlightQuote`) | second reference (docs/editorial/testimonial) |
| Hairline linear progress + caption (`ReadingProgress`) | cream-editorial/02 | — | second reference; `/ui Progress` now cataloged, so the composition may stay bespoke |
| Severity→StatusBadge tone map (`SeverityBadge`) | dark-console/01 | — | second ops/status reference (neon-analytics or dense-grid likely) |
| Calendar / month heat grid (`MonthHeat`) | soft-consumer/01 | — | second reference (activity/contribution views recur) |
| Pastel category card (`HabitCard` — color-mix wash over `--chart-N`) | soft-consumer/01 | — | second reference; may become a `tone`/`tint` prop on `SurfaceCard` instead |
| Triage detail pane (badges + actions + DescriptionList + payload `<pre>` + Timeline) | dark-console/01 | — | second master–detail reference |
| Raw payload / log block (multi-line code well on semantic tokens) | dark-console/01 | — | second reference; candidate `/ui` Snippet-multiline |

## Tooling gaps & product decisions

- **No screenshot pipeline yet** (no playwright/puppeteer in repo). Until one
  exists, scores are analytic (`~`) from generated code + computed theme values.
  Decision needed: add a `scripts/render-run.mjs` (playwright) dev-dep or keep
  analytic scoring. (Logged 2026-07-02.)
- **`examples/` does not exist** though package.json scripts reference
  `examples/mock-ui` / `examples/app-kit`. W3 promotions have nowhere to demo.
  (Logged 2026-07-02.)
- **Reference screenshots are textual trait specs for now** — drop a
  `reference.png` beside each `REFERENCE.md` to upgrade scoring from analytic to
  visual.

## Next up (worst score-to-effort first)

1. ~~W4 tiered CORE prompt~~ — **shipped** (iteration 2): `APP_KIT_CORE_INSTRUCTIONS`
   + `dist/prompts/*.md`; dark-console ran on ~1.7k injected tokens at ~22/25,
   wall-clock less than half of the monolith run.
2. **`DataTable` selected-row state** (STRUCTURAL, dark-console/01): the kit's
   own split master–detail archetype has no way to mark the active row
   (`selectedRowKey` or `rowClassName`). W3 trio next iteration.
3. **`surfaces: "paper"`** (cream-editorial/02): light-mode flat-canvas analog
   of `console`. Currently 4 token overrides; becomes intent if soft-consumer
   or mono-docs also needs it.
4. **Semantic chart severity tokens** (dark-console/01): StatusBadge's
   warn/success tones have no `--chart-*` equivalent; agents encode ad-hoc
   ambers into chartPalette slots. W2 candidate.
5. **Display font beyond h1–h3** (pull-quotes, brand marks): a `font-display`
   utility via `@theme` registration, or document the
   `[font-family:var(--font-display)]` arbitrary property as sanctioned.
6. **Remaining references**: soft-consumer (in flight), glass-saas, brutalist,
   dense-grid, mono-docs, topbar-saas, warm-enterprise, neon-analytics.

## Iteration log

<!-- newest first: date, reference, what shipped (trio), score delta, cost delta -->

### 2026-07-02 — iteration 2: tiered CORE prompts; dark-console ~22, soft-consumer ~20

- **Shipped (W4):** `APP_KIT_CORE_INSTRUCTIONS` (~6.8k chars, size + drift
  test-enforced: renders every HOUSE_RULE) + **prompts as readable files**
  (`dist/prompts/{core,appkit,theme,reference}.md`, exports `./prompts/*`,
  emitted by the build) — the mechanism that makes on-demand tiering real for
  no-import consumers.
- **Validated (W1):** two CORE-tier runs. dark-console **~22/25** (regression
  baseline holds) at **~1.7k injected tokens** (was ~16.4k) and **half the
  wall-clock** of the monolith run. soft-consumer **~20/25** — `neutrals` and
  sanctioned color-mix washes carried the pastel look; 1 lint warning
  (`no-title-repetition`), clean after one revision.
- **Shipped (W4, from run gap reports):** host CSS wiring + lucide-react note
  in core.md; chartPalette-vs-console precedence, light-default provider
  wiring, radius→`--radius-2xl` mapping, and the sanctioned category-tint
  recipe in theme.md.
- **Confirmed for next (W2/W3):** flat chrome wanted by a 3rd reference
  (sidebar-flatten overrides recur) → `surfaces: "paper"` awaits mono-docs;
  type-scale intent (soft-consumer's `font-size: 106.25%` hack); DataTable
  selected-row state (structural, from the kit's own archetype).

### 2026-07-02 — iteration 1: bootstrap + cream-editorial ~16 → ~21

- Bootstrapped rubric, 10 reference cards, scoreboard, scratch-run harness
  (`references/runs/`, consumer agents restricted to dist + exported prompts).
- **Shipped (W2):** `neutrals` intent — full warm/cool canvas family from one
  hue, both modes, wins over `tintNeutrals`; folio preset now cream. (+tests)
- **Shipped (W2):** `typography.display` now consumed by every `h1–h3` via
  `styles.css` (was emitted-but-consumed-by-nothing). (+test)
- **Shipped (W4):** `REFERENCE_AGENT_INSTRUCTIONS` export — screenshot→plan
  protocol, contract-tested against real intent fields, <4.5k chars enforced
  by test; one-shot fallback = emit the plan first.
- **Shipped (W3):** `invention-lane` HOUSE_RULES entry (prompt-only) + lane
  section in APP_KIT_AGENT_INSTRUCTIONS (substrate rules, props-over-forks,
  second-use-extract). Run-02 used it correctly: 3 named bespoke shapes, one
  extracted on second use.
- **Shipped (W4):** `/ui Progress` added to the component menu (was uncataloged
  → hand-roll bait); lint-message/docs alignment carried from the 3.1.0 work.
- Cost: first-pass lint 2/2, TS retries 0/2, agent tokens −5%; wall-clock ⚠️
  2.2× (protocol reading) → motivates tiered CORE prompt.
- Both runs' artifacts kept under `references/runs/cream-editorial/` for the
  re-lint-all-prior-outputs gate.
