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

1. **W4 tiered CORE prompt** — 56k-char appkit monolith is the top cost driver
   (run-02 wall-clock 2.2× run-01). Split: CORE (rules + archetype menu +
   catalog pointer + reference protocol, budget ≈8k chars, measured by test)
   vs on-demand layers.
2. **`surfaces: "paper"`** (run-02's top inexpressible): light-mode flat-canvas
   analog of `console` — cards/elevated/sidebar sit on the page tone. Currently
   4 token overrides; becomes intent if a second reference wants it
   (soft-consumer or mono-docs likely will).
3. **Display font beyond h1–h3** (pull-quotes, brand marks): a `font-display`
   utility via `@theme` registration, or accept the `[font-family:var(--font-display)]`
   arbitrary property as sanctioned (document it).
4. **Run dark-console** (regression baseline — should score ≥20 cheaply) and
   **soft-consumer** (second warmth + airy-density data point).

## Iteration log

<!-- newest first: date, reference, what shipped (trio), score delta, cost delta -->

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
