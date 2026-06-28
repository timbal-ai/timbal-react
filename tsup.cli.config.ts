import { defineConfig } from "tsup";

/**
 * Dedicated build for the `timbal-ui-lint` CLI.
 *
 * Separate from the library `tsup.config.ts` because the bin needs a Node
 * shebang banner (which must NOT leak onto the library entrypoints) and a
 * fully self-contained bundle: the anti-slop linter has no runtime deps, so
 * inlining `ui-vocabulary` / `ui-lint` / `ui-review` produces an executable
 * that runs with bare Node, even in a project that never installed
 * `node_modules`.
 */
export default defineConfig({
  entry: { "cli/timbal-ui-lint": "src/cli/ui-lint.ts" },
  format: ["esm"],
  platform: "node",
  target: "node18",
  dts: false,
  // Don't wipe the library build that runs first in the `build` script.
  clean: false,
  bundle: true,
  banner: { js: "#!/usr/bin/env node" },
  outExtension() {
    return { js: ".mjs" };
  },
});
