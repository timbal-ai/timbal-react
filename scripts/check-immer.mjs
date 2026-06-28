// Preflight guard for the recharts + React 19 white-screen.
//
// recharts 3.6+ keeps React elements/refs inside a Redux Toolkit store, and RTK
// uses immer with auto-freeze on. immer 11.0.0 froze React's Fiber internals, so
// React 19 (which mutates `fiber.lanes` during scheduling) throws
// `Cannot assign to read only property 'lanes'` and the whole route blanks out.
// Fixed in immer 11.0.1. The 10.x line predates the bug. So the only forbidden
// window is exactly [11.0.0, 11.0.1).
//
// This fails loudly at build/CI time instead of letting a stale lockfile ship a
// runtime crash. See https://github.com/recharts/recharts/issues/6781.

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const MIN_SAFE_11 = [11, 0, 1];

function parse(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function isForbidden(version) {
  const v = parse(version);
  if (!v) return false;
  if (v[0] !== 11) return false; // 10.x is fine; 11.1+ is fine
  // forbidden iff 11.0.0 <= v < 11.0.1
  return compare(v, [11, 0, 0]) >= 0 && compare(v, MIN_SAFE_11) < 0;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

async function* findImmer(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === "immer") {
      yield full;
      continue;
    }
    // Recurse into scopes (@scope/*) and nested node_modules only.
    if (entry.name.startsWith("@") || entry.name === "node_modules") {
      yield* findImmer(full);
    } else {
      const nested = join(full, "node_modules");
      yield* findImmer(nested);
    }
  }
}

const root = resolve(process.argv[2] ?? ".", "node_modules");
const offenders = [];
let checked = 0;

for await (const immerDir of findImmer(root)) {
  let pkg;
  try {
    pkg = JSON.parse(await readFile(join(immerDir, "package.json"), "utf8"));
  } catch {
    continue;
  }
  if (pkg.name !== "immer") continue;
  checked += 1;
  if (isForbidden(pkg.version)) {
    offenders.push(`${pkg.version} at ${immerDir.replace(`${process.cwd()}/`, "")}`);
  }
}

if (offenders.length > 0) {
  console.error(
    "\nimmer 11.0.0 detected — recharts charts will crash under React 19\n" +
      "(`Cannot assign to read only property 'lanes'`). Pin immer >= 11.0.1.\n\n" +
      "Add to the consuming app's package.json:\n" +
      '  "overrides": { "immer": ">=11.0.1" }   (Yarn: "resolutions")\n' +
      "then reinstall.\n\nOffending installs:\n" +
      offenders.map((o) => `  - ${o}`).join("\n") +
      "\n",
  );
  process.exit(1);
}

console.log(`OK immer: ${checked} install(s) checked, none in the broken 11.0.0 window`);
