/**
 * Vite plugin for apps that depend on `@timbal-ai/timbal-react` via `file:../timbal-react`.
 *
 * - Skips pre-bundling so `dist/` updates are not stuck in `node_modules/.vite/deps`
 * - Watches the linked package `dist/` and triggers a full reload when it changes
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIMBAL_REACT_EXPORTS = [
  "@timbal-ai/timbal-react",
  "@timbal-ai/timbal-react/chat",
  "@timbal-ai/timbal-react/studio",
  "@timbal-ai/timbal-react/ui",
  "@timbal-ai/timbal-react/app",
];

function resolveLinkedPackageRoot() {
  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve("@timbal-ai/timbal-react/package.json");
    return path.dirname(pkgJson);
  } catch {
    return null;
  }
}

/** @returns {import('vite').Plugin} */
export function timbalReactLocalDev() {
  /** @type {string | null} */
  let distDir = null;

  return {
    name: "timbal-react-local-dev",
    enforce: "pre",
    config() {
      const pkgRoot = resolveLinkedPackageRoot();
      if (!pkgRoot) return {};

      distDir = path.join(pkgRoot, "dist");
      const distGlob = `${distDir.replace(/\\/g, "/")}/**`;

      return {
        optimizeDeps: {
          exclude: TIMBAL_REACT_EXPORTS,
        },
        server: {
          watch: {
            ignored: ["**/.git/**", "**/node_modules/**", `!${distGlob}`],
          },
        },
      };
    },
    handleHotUpdate({ file, server }) {
      if (!distDir || !file.startsWith(distDir)) return;

      for (const mod of server.moduleGraph.idToModuleMap.values()) {
        if (
          mod.id?.includes("@timbal-ai/timbal-react") ||
          mod.id?.includes(`${path.sep}timbal-react${path.sep}dist`)
        ) {
          server.moduleGraph.invalidateModule(mod);
        }
      }

      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}
