import { describe, expect, it } from "bun:test";

import {
  flushBarCategoryGap,
  flushLineAreaEdgeToEdge,
  resolveChartMargin,
  resolveTooltipCategory,
} from "./line-area-chart-utils";

describe("resolveChartMargin", () => {
  it("uses default layout margins", () => {
    expect(resolveChartMargin({ flush: false, showXAxis: true, showYAxis: true })).toEqual({
      top: 8,
      right: 12,
      bottom: 0,
      left: 0,
    });
  });

  it("uses symmetric inset when flush and axes hidden", () => {
    expect(resolveChartMargin({ flush: true, showXAxis: false, showYAxis: false })).toEqual({
      top: 8,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it("reserves bottom space when flush x-axis is shown", () => {
    expect(resolveChartMargin({ flush: true, showXAxis: true, showYAxis: false })).toMatchObject({
      bottom: 24,
    });
  });
});

describe("flushBarCategoryGap", () => {
  it("only zeroes gap when flush and category axis visible", () => {
    expect(flushBarCategoryGap(true, true)).toBe("0%");
    expect(flushBarCategoryGap(true, false)).toBeUndefined();
    expect(flushBarCategoryGap(false, true)).toBeUndefined();
  });
});

describe("flushLineAreaEdgeToEdge", () => {
  it("is true only for labeled flush line/area without value axis", () => {
    expect(flushLineAreaEdgeToEdge(true, "area", true, false)).toBe(true);
    expect(flushLineAreaEdgeToEdge(true, "bar", true, false)).toBe(false);
    expect(flushLineAreaEdgeToEdge(true, "area", false, false)).toBe(false);
  });
});

describe("resolveTooltipCategory", () => {
  const data = [
    { week: "W2", count: 148 },
    { week: "W3", count: 120 },
  ];
  const formatX = (raw: unknown) => String(raw);

  it("reads category from tooltip payload row", () => {
    expect(
      resolveTooltipCategory(undefined, [{ payload: data[0] }], "week", data, formatX),
    ).toBe("W2");
  });

  it("falls back to recharts label", () => {
    expect(resolveTooltipCategory("W3", [], "week", data, formatX)).toBe("W3");
  });
});
