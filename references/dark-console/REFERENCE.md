# dark-console

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** a pro trading/ops terminal (Kraken Pro, Grafana dark,
Datadog). Near-black flat surfaces, sidebar merges into the page, active nav is
a subtle brand-tinted fill, hairline borders, dense numerics, one saturated
brand accent (purple) leading the charts.

**App to generate:** "Log Sentinel" — a security-events console: live events
table (severity, source, rule, time), a triage detail pane, and an overview
dashboard (events/min sparkline, severity split, top rules).

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Compact icon+label left rail, flat, active = tinted fill (no gradient pill) |
| Surface treatment | `oklch(~0.14)` background; panels 1 step lighter at most; hairline borders; no elevation shadows |
| Type personality | Neutral grotesk UI; tabular numerals everywhere data shows |
| Density | Compact — 32px rows, tight section gaps |
| Accent strategy | Single saturated brand (e.g. #7132F5); charts lead with it; severity via muted semantic tones, not rainbow |

## Known tensions

- This is the language `surfaces: "console"` + `defaultMode: "dark"` was built
  for — it's the **regression baseline**: it should score high cheaply.
- Slop-bait: glows and neon gradients are tempting here; `no-glow` must hold.
