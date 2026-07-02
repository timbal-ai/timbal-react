# Fidelity rubric — 5 traits, 0–5 each, 25 max

Score the **final artifact** a consumer agent produced for a reference (rendered
screenshot when tooling exists; code + computed theme values otherwise — mark
analytic scores with `~`). Score fidelity **to the design language**, not
pixel-identity.

| Score | Meaning |
|---|---|
| 0 | Trait absent or opposite of the reference |
| 1–2 | Wrong family; generic Timbal default shows through |
| 3 | Recognizable approximation; a designer sees the intent |
| 4 | Same family; differences need side-by-side to spot |
| 5 | A designer would accept it as the same design language |

## The five traits

1. **Nav paradigm** — sidebar / topbar / tabs / floating / none; hierarchy and
   placement of global actions. *House-rule adaptations score on faithfulness of
   the adaptation*: a reference topbar correctly relocated to `Page.actions` +
   sidebar without losing hierarchy can still score 4–5; silently shipping the
   banned pattern is an automatic 0 for the trait (and a failed run).
2. **Surface treatment** — background depth, card elevation vs flatness, borders
   vs shadows, translucency, sidebar/panel merging.
3. **Type personality** — family feel (serif / mono / geometric / humanist),
   display-vs-body contrast, weight discipline.
4. **Density** — information per viewport: padding scale, row heights, control
   sizes, section gaps.
5. **Accent strategy** — how color is deployed: single accent vs duotone,
   saturated fills vs tinted washes, chart palette relationship to brand,
   neutral warmth.

## Classifying every lost point

| Class | Meaning | Routes to |
|---|---|---|
| INEXPRESSIBLE | theme intent cannot say it | W2 (new intent field / surface treatment) |
| STRUCTURAL | no component/block has that anatomy | W3 (block or invention lane) |
| UNREACHABLE | exists but the agent couldn't find or afford it | W4 (exposition, catalog, tiering) |
| UNKNOWABLE | no protocol to extract it from the screenshot | W4 (REFERENCE_AGENT_INSTRUCTIONS) |
| HELD-BACK | house rules intentionally forbid it | not a defect — record in the run log |

A fix that doesn't move the score on rescore gets reverted.
