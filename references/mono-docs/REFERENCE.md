# mono-docs

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** developer documentation (Stripe docs, Vercel docs).
Near-monochrome, immaculate type hierarchy, code-first surfaces, a single cool
accent for links only, generous line-height prose measure.

**App to generate:** "Fieldguide" — an internal API docs portal: endpoint list
sidebar, endpoint detail page (params table, code samples, try-it panel), and a
changelog page.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Two-level docs sidebar (sections → pages), quiet |
| Surface treatment | White/near-black flat; code blocks are the only "cards" |
| Type personality | Crisp grotesk body + real mono for code; strong h1→h4 rhythm |
| Density | Prose-comfortable, tables compact |
| Accent strategy | Monochrome + one link accent; syntax highlighting is the only color moment |

## Known tensions

- Two-level nav: does `StudioSidebar` model nested sections, or is this
  STRUCTURAL (nav groups)?
- Long-form prose page archetype (`width="prose"`) — verify it's reachable and
  documented.
