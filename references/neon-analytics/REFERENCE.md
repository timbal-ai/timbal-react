# neon-analytics

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** dark marketing-analytics product with saturated neon
accents (Amplitude dark, crypto dashboards). Deep navy-black, electric
cyan/magenta duotone charts, high-contrast metric displays.

**App to generate:** "Pulsegrid" — a campaign analytics dashboard: KPI strip,
multi-series engagement chart, channel breakdown, and a campaigns table.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Slim dark sidebar |
| Surface treatment | Deep near-black navy; flat panels with subtle tonal steps — **no glows** |
| Type personality | Geometric display for KPIs (weight discipline: size not boldness) |
| Density | Medium-dense dashboard |
| Accent strategy | Electric **duotone** (cyan + magenta) carried by `chartPalette`; accents saturated but applied only to data & primary actions |

## Known tensions

- **Slop-bait reference**: neon glows, gradient cards, and bold giant numbers
  are all tempting and all banned (`no-glow`, `data-gradient`, `bold-metric`).
  Success = neon *palette* fidelity with house discipline intact.
- Duotone = first real 2-accent test of `chartPalette` + `accent`.
