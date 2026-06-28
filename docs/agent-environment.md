# Agent environment notes (preview / build / typecheck)

These are **environmental** facts about the preview/build sandbox — not part of
the component API. They caused repeated stalls in builder sessions, so they live
here once. They are not prompt material; surface them to an agent only when it
hits the specific symptom.

## TypeScript / typecheck

- Use **`bun x tsc -b`** (or the project's `typecheck` script). `npx` is **not on PATH**
  in the preview sandbox, so `npx tsc` fails — don't reach for it.
- A phantom error that points at a symbol you already fixed (e.g. an undefined
  identifier in a file you just corrected) is usually a **stale incremental
  build cache**. Delete the `*.tsbuildinfo` file(s) and re-run typecheck before
  treating it as a real error.

## node_modules resolution in previews

- Preview dependencies are installed under the **preview working tree**, e.g.
  `/tmp/previews/<id>/<branch>/<app>/node_modules`, **not** under the EFS project
  path. When you need to read installed `.d.ts`/source, resolve paths against the
  preview cwd, not the EFS checkout — `readlink -f` against the EFS path returns
  empty.
- Prefer reading types from the package's published `.d.ts` (now carrying
  JSDoc + `@example` for the hot surface) over reverse-engineering by grepping.

## Charts / colors

- The theme tokens (`--chart-N`, `--primary`, …) are **already OKLCH colors**.
  Pass them directly (`var(--chart-1)`); never wrap them in `hsl()/rgb()` —
  that's invalid CSS and renders an empty chart while the build still passes.
  The linter now flags this as `chart-token-color-fn` (error).
