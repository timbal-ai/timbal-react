# soft-consumer

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** wellness/consumer mobile-first (Headspace, Calm, Oak).
Warm off-white background, very rounded cards (20–24px), soft pastel tints per
category, friendly rounded sans, gentle diffuse shadows.

**App to generate:** "Ritual" — a habits app: today view with habit cards and
streaks, a calendar heat view, and a gentle stats page.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Bottom-tab feel adapted to desktop = minimal sidebar with big friendly items |
| Surface treatment | Warm off-white page; big-radius cards with soft diffuse shadows; category cards carry *tinted* pastel washes |
| Type personality | Rounded/humanist sans, larger base size, cheerful weight contrast |
| Density | Airy; oversized touch targets |
| Accent strategy | Multi-tint pastels derived from one brand hue family; charts soft, no hard blues |

## Known tensions

- Warm neutrals again (shared with cream-editorial — the "two references, same
  trait" trigger for a W2 neutrals intent).
- Per-category pastel washes on cards flirt with `data-gradient`/colored-card
  rules — the sanctioned path (tinted `Badge`/`StatusBadge` tones? `color-mix`
  washes?) needs to be findable or this becomes UNREACHABLE/STRUCTURAL.
- Radius beyond ~1rem: check `--radius-2xl` scaling holds at 1.5rem.
