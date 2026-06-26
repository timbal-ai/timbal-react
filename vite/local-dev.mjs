/**
 * Vite plugin for apps that depend on `@timbal-ai/timbal-react` via `file:../timbal-react`.
 *
 * - Skips pre-bundling so `dist/` updates are not stuck in `node_modules/.vite/deps`
 * - Aliases package entrypoints to `src/` so gallery apps pick up source edits without rebuilding `dist/`
 * - Watches `src/` and `dist/` and triggers a full reload when either changes
 *
 * IMPORTANT: this is a no-op for normal npm installs. Excluding the package from
 * `optimizeDeps` only makes sense when it is `file:`-linked (a symlink in
 * `node_modules`). For published installs Vite must pre-bundle the package so its
 * CJS-only transitive deps (e.g. `use-sync-external-store/shim` reached via
 * `radix-ui` -> `@radix-ui/react-use-is-hydrated`) are converted to ESM instead of
 * leaking to the browser.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const TIMBAL_REACT_EXPORTS = [
  "@timbal-ai/timbal-react",
  "@timbal-ai/timbal-react/chat",
  "@timbal-ai/timbal-react/studio",
  "@timbal-ai/timbal-react/ui",
  "@timbal-ai/timbal-react/app",
];

/** Subpath → source entry (linked `file:` dev always resolves here). */
const SOURCE_ENTRIES = {
  "@timbal-ai/timbal-react": "src/index.ts",
  "@timbal-ai/timbal-react/chat": "src/chat.ts",
  "@timbal-ai/timbal-react/studio": "src/studio.ts",
  "@timbal-ai/timbal-react/ui": "src/ui.ts",
  "@timbal-ai/timbal-react/app": "src/app.ts",
  "@timbal-ai/timbal-react/styles.css": "src/styles.css",
};

function distIsBuilt(distDir) {
  try {
    return fs.statSync(path.join(distDir, "index.esm.js")).isFile();
  } catch {
    return false;
  }
}

/**
 * CJS-only transitive deps that must be pre-bundled even when the package itself
 * is excluded, so their `useSyncExternalStore` named imports resolve as ESM.
 */
const CJS_INTEROP_DEPS = [
  "radix-ui",
  "@radix-ui/react-use-is-hydrated",
  "use-sync-external-store/shim",
  "use-sync-external-store/shim/with-selector",
  "zustand",
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

/**
 * Only treat the install as "linked" when the `node_modules` entry is a symlink,
 * i.e. installed via `file:../timbal-react` (or a workspace link). Normal npm
 * installs are real directories and must be left to Vite's pre-bundler.
 *
 * @param {string} [root] consuming project root
 */
function isLinkedInstall(root) {
  const base = root || process.cwd();
  const entry = path.join(
    base,
    "node_modules",
    "@timbal-ai",
    "timbal-react",
  );
  try {
    return fs.lstatSync(entry).isSymbolicLink();
  } catch {
    return false;
  }
}

/** @returns {import('vite').Plugin} */
export function timbalReactLocalDev() {
  /** @type {string | null} */
  let distDir = null;

  return {
    name: "timbal-react-local-dev",
    enforce: "pre",
    config(config) {
      if (!isLinkedInstall(config.root)) return {};

      const pkgRoot = resolveLinkedPackageRoot();
      if (!pkgRoot) return {};

      distDir = path.join(pkgRoot, "dist");
      const built = distIsBuilt(distDir);
      const srcDir = path.join(pkgRoot, "src");
      const watchGlobs = [
        `${srcDir.replace(/\\/g, "/")}/**`,
        `${distDir.replace(/\\/g, "/")}/**`,
      ];

      if (!built) {
        console.warn(
          "[timbal-react] dist/ is missing — dev uses src/ only. " +
            "Run `bun run build` in timbal-react to verify the production bundle.",
        );
      }

      /** @type {Record<string, string>} */
      const alias = {};
      for (const [pkg, rel] of Object.entries(SOURCE_ENTRIES)) {
        alias[pkg] = path.join(pkgRoot, rel);
      }

      return {
        resolve: { alias },
        optimizeDeps: {
          exclude: TIMBAL_REACT_EXPORTS,
          include: CJS_INTEROP_DEPS,
        },
        server: {
          watch: {
            ignored: [
              "**/.git/**",
              "**/node_modules/**",
              ...watchGlobs.map((g) => `!${g}`),
            ],
          },
        },
      };
    },
    handleHotUpdate({ file, server }) {
      if (!distDir) return;
      const srcDir = path.join(path.dirname(distDir), "src");
      const isDist = file.startsWith(distDir);
      const isSrc = file.startsWith(srcDir);
      if (!isDist && !isSrc) return;

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
