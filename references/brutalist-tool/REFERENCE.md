# brutalist-tool

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** neo-brutalist utility (Gumroad-era, Figma community
brutalism). Stark paper-white background, pure-black 2px borders, **zero**
border radius, hard offset shadows or none, mono or grotesk labels, unapologetic
solid accent blocks.

**App to generate:** "Freight" — a simple invoicing tool: invoices table,
invoice editor form, and a revenue summary strip.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Flat text sidebar or simple stacked nav; no chrome softness |
| Surface treatment | Flat white; thick solid borders; radius 0; no gradients anywhere |
| Type personality | Mono or hard grotesk, all weights ≤ 600, big functional headings |
| Density | Medium; borders do the separating |
| Accent strategy | One loud solid accent (e.g. #FF4D00) used as fills on primary actions and highlights |

## Known tensions

- `radius: 0` and hairline→**thick** borders: border *weight* may be
  INEXPRESSIBLE (shipped system is 1px everywhere).
- The primary button's signature gradient sheen contradicts flat brutalism —
  probe whether the generator can flatten fills (`--primary-fill-*` exist as
  tokens; is there intent for "flat fills"?).
- Sentence-case rule vs brutalist ALL-CAPS headers: HELD-BACK, adapt with
  weight/size instead.
