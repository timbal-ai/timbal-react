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

## The anti-slop lint gate must actually run (platform)

The deterministic gate is **`timbal-ui-lint`** (CLI) / `lintGeneratedUi` /
`reviewGeneratedUi`. It catches the slop class — hand-rolled topbar/sidebar
rails (`no-custom-shell-chrome`), neon glow shadows (`no-glow`), UPPERCASE
chrome (`no-uppercase-heading`), raw palette/hex colors, hand-authored theme
tokens / `forcedTheme` (`theme-via-generator`), etc. — and exits non-zero so a
turn can be blocked and the `revisionPrompt` fed back.

> **Known gap:** sessions that build UI via the **codegen MCP path** (not a
> compose turn) have historically **not** run this gate, so unchecked slop
> shipped even though the rules exist. The gate is only effective if the
> generation pipeline runs it on every generated `.tsx` before the turn
> finishes. Run it as:
>
> ```bash
> bun x @timbal-ai/timbal-react/cli/timbal-ui-lint --strict <files...>
> # or: node node_modules/@timbal-ai/timbal-react/dist/cli/timbal-ui-lint.mjs <files...>
> ```
>
> Exit 1 = slop found; stdout carries a ready-to-send revision prompt. This is
> a **pipeline/platform** wiring task — the package ships the gate, but cannot
> force a codegen session to invoke it.
