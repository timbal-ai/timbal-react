# Agent instructions — @timbal-ai/timbal-react

When modifying **any part of this package** (`src/chat`, `src/studio`, `src/ui`, `src/app`, `src/runtime`, `src/artifacts`, `src/auth`, `src/design`, examples):

1. Read and follow **[`.cursor/skills/timbal-react/SKILL.md`](.cursor/skills/timbal-react/SKILL.md)**.
2. **Component-owned styling** — do not add single-component visual tokens to `src/design/*` or `src/styles.css`.
3. **Stable APIs** — extend via props and types; use `src/chat/layout.ts` only for intentional public layout helpers.
4. Verify with `bun test` and `bun run typecheck`; run `bun run build` when examples need fresh `dist/`.

Subpaths and API tiers: [README.md](README.md).
