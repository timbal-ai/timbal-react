import type { Plugin } from "vite";

/**
 * Vite plugin for apps that link `@timbal-ai/timbal-react` via `file:../timbal-react`.
 * Aliases package entrypoints to `src/`, excludes the package from `optimizeDeps`, and
 * reloads when `src/` or `dist/` changes.
 */
export function timbalReactLocalDev(): Plugin;
