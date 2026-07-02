# glass-saas

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** frosted-glass consumer SaaS (Arc, Raycast, macOS-adjacent).
Soft blurred gradient wash behind the app; panels are translucent with backdrop
blur and inner hairlines; large rounded corners; playful but restrained accent.

**App to generate:** "Slipstream" — a personal CRM: people list with avatars and
last-touch, a contact detail panel, and a follow-ups board.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Floating translucent sidebar panel, detached from edges |
| Surface treatment | Translucent panels (backdrop blur) over a soft tinted wash; hairline inner borders; depth via layering not drop shadows |
| Type personality | Geometric sans, medium contrast |
| Density | Comfortable — roomy cards, medium rows |
| Accent strategy | One vivid accent used sparingly on primary actions; wash carries a soft tint of it |

## Known tensions

- Translucency/backdrop-blur is a **surface treatment the generator doesn't own
  yet** (shipped panels are deliberately opaque); expect INEXPRESSIBLE here —
  this is the probe for a `glass` surfaces treatment.
- Opaque-surface house reasoning (no alpha bleed-through) may cap this at a
  deliberate product decision — record it either way.
