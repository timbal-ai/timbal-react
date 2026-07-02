import { describe, expect, it } from "bun:test";

import { REFERENCE_AGENT_INSTRUCTIONS } from "./reference-instructions";
import type { TimbalThemeIntent } from "./theme";

describe("REFERENCE_AGENT_INSTRUCTIONS", () => {
  it("names only intent fields that actually exist on TimbalThemeIntent", () => {
    // Compile-time contract: every field the protocol teaches must be a real
    // key — if a field is renamed/removed, this list fails to typecheck.
    const taught: (keyof TimbalThemeIntent)[] = [
      "brand",
      "accent",
      "neutrals",
      "surfaces",
      "defaultMode",
      "radius",
      "shadow",
      "chartPalette",
      "typography",
      "overrides",
    ];
    for (const field of taught) {
      expect(REFERENCE_AGENT_INSTRUCTIONS).toContain(field);
    }
  });

  it("teaches the loop discipline: intent-first, never claim a match", () => {
    expect(REFERENCE_AGENT_INSTRUCTIONS).toMatch(/Never claim/i);
    expect(REFERENCE_AGENT_INSTRUCTIONS).toMatch(/intent, not CSS/i);
    expect(REFERENCE_AGENT_INSTRUCTIONS).toContain("nonGoals");
    expect(REFERENCE_AGENT_INSTRUCTIONS).toContain("inventionPlan");
  });

  it("stays CORE-tier compact (< 4500 chars — measured, not vibes)", () => {
    expect(REFERENCE_AGENT_INSTRUCTIONS.length).toBeLessThan(4500);
  });
});
