/**
 * Catalog contract. `APP_KIT_CATALOG` is the machine-readable index agents read
 * to import (instead of rebuild) primitives + blocks, and the source for the
 * listing inside `APP_KIT_AGENT_INSTRUCTIONS`. If an entry names an export or a
 * source path that doesn't exist, an agent following it hits a TS error — the
 * exact drift this test fails on.
 *
 * Lives at `src/` (not `src/app/`) so it can read the `/studio` barrel without
 * tripping the `app-no-studio` dependency boundary.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";

import {
  APP_KIT_CATALOG,
  getCatalogEntry,
  type CatalogImportPath,
} from "./app/catalog";

import * as App from "./app/index";
import * as Ui from "./ui/index";
import * as Studio from "./studio/index";

const BARRELS: Record<CatalogImportPath, Record<string, unknown>> = {
  "@timbal-ai/timbal-react/app": App as Record<string, unknown>,
  "@timbal-ai/timbal-react/ui": Ui as Record<string, unknown>,
  "@timbal-ai/timbal-react/studio": Studio as Record<string, unknown>,
};

// repo root = one level up from src/
const REPO_ROOT = resolve(import.meta.dir, "..");

describe("APP_KIT_CATALOG", () => {
  it("has unique kebab-case ids", () => {
    const ids = APP_KIT_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const badIds = ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id));
    expect({ badIds }).toEqual({ badIds: [] });
  });

  it("every entry's exports resolve from its importFrom barrel", () => {
    const broken: string[] = [];
    for (const entry of APP_KIT_CATALOG) {
      const barrel = BARRELS[entry.importFrom];
      for (const name of entry.exports) {
        if (barrel[name] === undefined) broken.push(`${entry.id}: ${name} (${entry.importFrom})`);
      }
    }
    expect({ broken }).toEqual({ broken: [] });
  });

  it("every entry exports at least one symbol", () => {
    const empty = APP_KIT_CATALOG.filter((e) => e.exports.length === 0).map((e) => e.id);
    expect({ empty }).toEqual({ empty: [] });
  });

  it("blocks carry composedOf + an existing source file; primitives don't", () => {
    const missingSource: string[] = [];
    for (const entry of APP_KIT_CATALOG) {
      if (entry.kind === "block") {
        expect(entry.composedOf?.length ?? 0).toBeGreaterThan(0);
        expect(entry.source).toBeDefined();
        if (entry.source && !existsSync(resolve(REPO_ROOT, entry.source))) {
          missingSource.push(`${entry.id}: ${entry.source}`);
        }
      } else {
        expect(entry.source).toBeUndefined();
      }
    }
    expect({ missingSource }).toEqual({ missingSource: [] });
  });

  it("getCatalogEntry looks up by id (and misses safely)", () => {
    expect(getCatalogEntry("filtered-data-table")?.name).toBe("FilteredDataTable");
    expect(getCatalogEntry("app-copilot")?.importFrom).toBe("@timbal-ai/timbal-react/app");
    expect(getCatalogEntry("does-not-exist")).toBeUndefined();
  });

  it("APP_KIT_AGENT_INSTRUCTIONS lists every block (generated, not prose)", async () => {
    const { APP_KIT_AGENT_INSTRUCTIONS } = await import("./app/agent-instructions");
    for (const block of APP_KIT_CATALOG.filter((e) => e.kind === "block")) {
      expect(APP_KIT_AGENT_INSTRUCTIONS).toContain(block.name);
    }
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("@timbal-ai/timbal-react/app");
  });
});
