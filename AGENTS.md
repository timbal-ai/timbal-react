# Agent instructions — @timbal-ai/timbal-react

When modifying **any part of this package** (`src/chat`, `src/studio`, `src/ui`, `src/app`, `src/runtime`, `src/artifacts`, `src/auth`, `src/design`, examples):

1. Read and follow **[`.cursor/skills/timbal-react/SKILL.md`](.cursor/skills/timbal-react/SKILL.md)**.
2. **Component-owned styling** — do not add single-component visual tokens to `src/design/*` or `src/styles.css`.
3. **Stable APIs** — extend via props and types; use `src/chat/layout.ts` only for intentional public layout helpers.
4. Verify with `bun test` and `bun run typecheck`; run `bun run build` when examples need fresh `dist/`.

Subpaths and API tiers: [README.md](README.md).

## App kit (dashboard / operations UI)

For **host-app dashboards** (not in-chat artifacts), use `@timbal-ai/timbal-react/app` and inject **`APP_KIT_AGENT_INSTRUCTIONS`** into the codegen system prompt:

```ts
import { APP_KIT_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react/app";
```

That string documents the component menu, design rules, accessibility, and **recipe index**. Prefer composing from it creatively — do not clone layouts wholesale.

| Resource | Purpose |
|----------|---------|
| [`examples/app-kit/recipes/`](examples/app-kit/recipes/) | One pattern per file (~20–80 lines) — grammar for agents |
| [`examples/app-kit/README.md`](examples/app-kit/README.md) | How to run the gallery locally |
| [`examples/app-kit/reference/operations-dashboard.tsx`](examples/app-kit/reference/operations-dashboard.tsx) | **Reference only** — not a default template |

**Browse locally:** `bun run build` at repo root, then `cd examples/app-kit && npm run dev` → http://localhost:5175/ (or `bun run example:app` from root if Vite is on PATH).

**Premade groups:** `src/app/data/` (metrics, charts), `src/app/integrations/`, `src/app/settings/`, `src/app/surfaces/`. In-chat widgets stay on **artifacts** (`ARTIFACT_AGENT_INSTRUCTIONS`), not the app kit.
