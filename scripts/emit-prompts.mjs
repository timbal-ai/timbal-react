/**
 * Emit the agent instruction strings as readable files in dist/prompts/.
 *
 * Why: consumers (and the agents driving them) cannot import the package to
 * read these strings — booting the runtime from a script hangs. Shipping them
 * as plain markdown makes the tiered-prompt contract real: CORE is injected,
 * every other layer is a file the agent Reads on demand.
 *
 * Runs under bun (build script), importing the TypeScript sources directly —
 * these modules are pure string/data modules with no React in their graph.
 */
import { mkdir } from "node:fs/promises";

import { APP_KIT_CORE_INSTRUCTIONS } from "../src/app/core-instructions.ts";
import { APP_KIT_AGENT_INSTRUCTIONS } from "../src/app/agent-instructions.ts";
import { THEME_AGENT_INSTRUCTIONS } from "../src/design/theme-instructions.ts";
import { REFERENCE_AGENT_INSTRUCTIONS } from "../src/design/reference-instructions.ts";

const OUT = new URL("../dist/prompts/", import.meta.url);
await mkdir(OUT, { recursive: true });

const files = {
  "core.md": APP_KIT_CORE_INSTRUCTIONS,
  "appkit.md": APP_KIT_AGENT_INSTRUCTIONS,
  "theme.md": THEME_AGENT_INSTRUCTIONS,
  "reference.md": REFERENCE_AGENT_INSTRUCTIONS,
};

for (const [name, content] of Object.entries(files)) {
  await Bun.write(new URL(name, OUT), content + "\n");
}

console.log(
  `emit-prompts: wrote ${Object.keys(files).length} files to dist/prompts/ ` +
    `(core ${APP_KIT_CORE_INSTRUCTIONS.length}ch, appkit ${APP_KIT_AGENT_INSTRUCTIONS.length}ch, ` +
    `theme ${THEME_AGENT_INSTRUCTIONS.length}ch, reference ${REFERENCE_AGENT_INSTRUCTIONS.length}ch)`,
);
