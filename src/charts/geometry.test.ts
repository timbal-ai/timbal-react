import { describe, expect, it } from "bun:test";

import {
  formatCompact,
  monotoneAreaPath,
  monotoneLinePath,
  niceTicks,
  toNum,
} from "./geometry";

describe("toNum", () => {
  it("passes through finite numbers", () => {
    expect(toNum(42)).toBe(42);
  });
  it("coerces numeric strings", () => {
    expect(toNum("3.5")).toBe(3.5);
  });
  it("falls back to 0 for non-numeric input", () => {
    expect(toNum("abc")).toBe(0);
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
  });
});

describe("monotoneLinePath", () => {
  it("returns empty string for no points", () => {
    expect(monotoneLinePath([])).toBe("");
  });
  it("moves to the single point", () => {
    expect(monotoneLinePath([{ x: 1, y: 2 }])).toBe("M 1,2");
  });
  it("draws a straight line between two points", () => {
    expect(monotoneLinePath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe("M 0,0 L 10,5");
  });
  it("emits cubic segments for three or more points", () => {
    const d = monotoneLinePath([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
    ]);
    expect(d.startsWith("M 0,0")).toBe(true);
    expect(d).toContain("C");
  });
});

describe("monotoneAreaPath", () => {
  it("closes the path back to the baseline", () => {
    const d = monotoneAreaPath([{ x: 0, y: 0 }, { x: 10, y: 5 }], 20);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("L 10,20");
    expect(d).toContain("L 0,20");
  });
});

describe("niceTicks", () => {
  it("returns a single tick when min equals max", () => {
    expect(niceTicks(5, 5)).toEqual([5]);
  });
  it("spans the range with rounded steps", () => {
    const ticks = niceTicks(0, 100, 4);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
  });
});

describe("formatCompact", () => {
  it("formats thousands and millions", () => {
    expect(formatCompact(1500)).toBe("1.5k");
    expect(formatCompact(2_000_000)).toBe("2M");
  });
  it("appends a unit", () => {
    expect(formatCompact(50, "%")).toBe("50%");
  });
});
