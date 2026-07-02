import { describe, expect, it } from "bun:test";

import { APP_KIT_CORE_INSTRUCTIONS } from "./core-instructions";
import { APP_KIT_AGENT_INSTRUCTIONS } from "./agent-instructions";
import { HOUSE_RULES } from "../design/ui-vocabulary";

describe("APP_KIT_CORE_INSTRUCTIONS", () => {
  it("fits the CORE token budget (≤ 10k chars ≈ 2.5k tokens — measured, not vibes)", () => {
    expect(APP_KIT_CORE_INSTRUCTIONS.length).toBeLessThanOrEqual(10_000);
  });

  it("is dramatically smaller than the full layer it fronts", () => {
    expect(APP_KIT_CORE_INSTRUCTIONS.length).toBeLessThan(
      APP_KIT_AGENT_INSTRUCTIONS.length / 4,
    );
  });

  it("renders EVERY house rule — the gate and the prompt can never drift", () => {
    for (const rule of HOUSE_RULES) {
      expect(APP_KIT_CORE_INSTRUCTIONS).toContain(rule.rule);
    }
  });

  it("routes to every on-demand layer", () => {
    for (const layer of [
      "dist/prompts/appkit.md",
      "dist/prompts/theme.md",
      "dist/prompts/reference.md",
      "dist/styles.css",
      "APP_KIT_CATALOG",
    ]) {
      expect(APP_KIT_CORE_INSTRUCTIONS).toContain(layer);
    }
  });

  it("carries the retry killers (subpath trap, no Tabs, raw chart tokens)", () => {
    expect(APP_KIT_CORE_INSTRUCTIONS).toMatch(/not `\/ui`/);
    expect(APP_KIT_CORE_INSTRUCTIONS).toContain("No `Tabs` export");
    expect(APP_KIT_CORE_INSTRUCTIONS).toContain('fill="var(--chart-1)"');
  });
});
