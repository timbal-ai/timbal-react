# dense-grid

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** power-tool data grid (Linear, Bloomberg-lite, Airtable in
compact mode). Light neutral chrome, ruthless density, 28–32px rows, tiny
uppercase eyebrows, tabular numerals, keyboard-first affordances, near-invisible
chrome — the data IS the interface.

**App to generate:** "Manifest" — an inventory ops screen: 500-row SKU table
with inline status, filter bar, bulk actions, and a thin metrics strip on top.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Ultra-thin icon rail; everything else is the grid |
| Surface treatment | Flat; zebra or hairline rows; no cards around tables |
| Type personality | 13px UI grotesk, tabular nums, tiny `text-xs uppercase` eyebrows (sanctioned form) |
| Density | Maximum: compact density everywhere, thin paddings |
| Accent strategy | Semantic-only: status tones carry meaning; brand nearly invisible |

## Known tensions

- Probes `density="compact"` limits — if 28px rows aren't reachable, is a third
  density stop needed (W2) or a DataTable size prop (W3)?
- `row-divider` lint budget vs a 500-row hairline grid — zebra is the sanctioned
  path; confirm the agent can find that guidance (UNREACHABLE probe).
