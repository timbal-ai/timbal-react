# topbar-saas

> Drop `reference.png` beside this file. Until then this trait spec is the
> reference; scores against it are analytic (`~`).

**Design language:** classic horizontal-nav SaaS (Notion settings, Slack admin,
Intercom). Global topbar with product switcher + search + avatar; content in a
centered column; tidy white cards on cool gray.

**App to generate:** "Beacon" — a customer-feedback dashboard: inbox of feedback
items, tagging/triage view, and a trends page.

## Trait targets

| Trait | Target |
|---|---|
| Nav paradigm | Reference shows a global topbar — **house rules forbid it**. Score the *adaptation*: global actions in `Page.actions`/sidebar, search as a page-level control, hierarchy preserved |
| Surface treatment | Cool gray canvas, white cards, soft shadows — close to shipped defaults |
| Type personality | Neutral Inter-like |
| Density | Default |
| Accent strategy | Corporate blue, semantic status chips |

## Known tensions

- **This is the adaptation exercise**: the run fails outright if a topbar ships;
  it scores high if the agent *names the conflict up front* and adapts cleanly
  (reference-match protocol behavior).
- Otherwise deliberately easy — it isolates the adaptation skill from theming
  difficulty.
