import { describe, expect, it } from "bun:test";

import {
  arcPath,
  areaPath,
  formatCompact,
  linearLinePath,
  linePath,
  monotoneAreaPath,
  monotoneLinePath,
  niceTicks,
  polarToCartesian,
  polygonPath,
  stepLinePath,
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

describe("linearLinePath", () => {
  it("connects points with straight segments", () => {
    expect(linearLinePath([{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }])).toBe(
      "M 0,0 L 5,5 L 10,0",
    );
  });
});

describe("stepLinePath", () => {
  it("inserts orthogonal step segments", () => {
    const d = stepLinePath([{ x: 0, y: 0 }, { x: 10, y: 8 }]);
    expect(d.startsWith("M 0,0")).toBe(true);
    // steps at the midpoint x = 5
    expect(d).toContain("5,0");
    expect(d).toContain("5,8");
    expect(d.endsWith("10,8")).toBe(true);
  });
});

describe("linePath dispatch", () => {
  it("routes by curve type", () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }];
    expect(linePath(pts, "linear")).toBe(linearLinePath(pts));
    expect(linePath(pts, "step")).toBe(stepLinePath(pts));
    expect(linePath(pts, "monotone")).toBe(monotoneLinePath(pts));
  });
});

describe("areaPath", () => {
  it("closes to the baseline without lower points", () => {
    const d = areaPath([{ x: 0, y: 0 }, { x: 10, y: 5 }], 20, "linear");
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("L 10,20");
  });
  it("closes onto lower points when stacked", () => {
    const top = [{ x: 0, y: 0 }, { x: 10, y: 5 }];
    const lower = [{ x: 0, y: 10 }, { x: 10, y: 12 }];
    const d = areaPath(top, 20, "linear", lower);
    expect(d.endsWith("Z")).toBe(true);
    // returns to the reversed lower edge (10,12) then (0,10)
    expect(d).toContain("L 10,12");
    expect(d).toContain("L 0,10");
  });
});

describe("polarToCartesian", () => {
  it("places angle 0 directly above the center", () => {
    const p = polarToCartesian(0, 0, 10, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-10);
  });
  it("places a quarter turn to the right", () => {
    const p = polarToCartesian(0, 0, 10, Math.PI / 2);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });
});

describe("arcPath", () => {
  it("draws a pie wedge from the center for innerRadius 0", () => {
    expect(arcPath(0, 0, 10, 0, Math.PI / 2).startsWith("M 0 0")).toBe(true);
  });
  it("draws a donut band for innerRadius > 0", () => {
    const d = arcPath(50, 50, 40, 0, Math.PI, 20);
    expect(d).toContain("A 40 40");
    expect(d).toContain("A 20 20");
  });
  it("sets the large-arc flag past a half turn", () => {
    const d = arcPath(0, 0, 10, 0, Math.PI * 1.5);
    expect(d).toContain("0 1 1");
  });
});

describe("polygonPath", () => {
  it("closes a polygon", () => {
    expect(polygonPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }])).toBe(
      "M 0,0 L 10,0 L 5,8 Z",
    );
  });
});
