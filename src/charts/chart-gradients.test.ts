import { describe, expect, it } from "bun:test";

import {
  barGradientId,
  estimateYAxisWidth,
  pieGradientId,
  truncateLabel,
} from "./chart-gradient-utils";

describe("barGradientId", () => {
  it("sanitizes data keys for valid SVG ids", () => {
    expect(barGradientId("abc", "revenue")).toBe("bar-abc-revenue");
    expect(barGradientId("x", "a.b/c")).toBe("bar-x-a_b_c");
  });
});

describe("pieGradientId", () => {
  it("scopes pie gradients per chart instance", () => {
    expect(pieGradientId("scope1", "Malware")).toBe("pie-scope1-Malware");
  });
});

describe("truncateLabel", () => {
  it("leaves short labels unchanged", () => {
    expect(truncateLabel("MailGuard", 14)).toBe("MailGuard");
  });

  it("truncates with an ellipsis", () => {
    expect(truncateLabel("ThreatHunter", 8)).toBe("ThreatH…");
  });
});

describe("estimateYAxisWidth", () => {
  it("returns min width for empty labels", () => {
    expect(estimateYAxisWidth([])).toBe(48);
  });

  it("grows with label length up to max", () => {
    const w = estimateYAxisWidth(["MailGuard", "ComplianceBot"]);
    expect(w).toBeGreaterThan(48);
    expect(w).toBeLessThanOrEqual(112);
  });

  it("caps at max", () => {
    const w = estimateYAxisWidth(["VeryLongAgentNameThatShouldNotExpandForever"]);
    expect(w).toBe(112);
  });
});
