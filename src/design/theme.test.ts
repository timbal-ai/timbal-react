import { describe, expect, it } from "bun:test";

import {
  oklchToHex,
  oklchToString,
  parseColor,
  readableForeground,
} from "./oklch";
import { createTimbalTheme, themeToCss } from "./theme";
import { TIMBAL_THEME_PRESETS, getThemePreset } from "./theme-presets";

describe("parseColor", () => {
  it("parses hex into OKLCH and round-trips close", () => {
    const oklch = parseColor("#4f46e5");
    expect(oklch.l).toBeGreaterThan(0);
    expect(oklch.l).toBeLessThan(1);
    expect(oklch.c).toBeGreaterThan(0);
    // Round-trip should land near the original hex.
    const hex = oklchToHex(oklch);
    expect(hex.toLowerCase()).toBe("#4f46e5");
  });

  it("parses short hex and rgb()", () => {
    expect(parseColor("#fff").l).toBeGreaterThan(0.99);
    const black = parseColor("rgb(0, 0, 0)");
    expect(black.l).toBeLessThan(0.01);
  });

  it("passes through oklch()", () => {
    const c = parseColor("oklch(0.62 0.2 264)");
    expect(c.l).toBeCloseTo(0.62, 2);
    expect(c.h).toBeCloseTo(264, 0);
  });

  it("throws on garbage", () => {
    expect(() => parseColor("not-a-color")).toThrow();
  });
});

describe("readableForeground", () => {
  it("returns dark text on light backgrounds", () => {
    expect(readableForeground(parseColor("#ffffff"))).toContain("0.205");
  });
  it("returns light text on dark backgrounds", () => {
    expect(readableForeground(parseColor("#1e1b4b"))).toContain("0.985");
  });
});

describe("oklchToString", () => {
  it("omits alpha when opaque", () => {
    expect(oklchToString({ l: 0.5, c: 0.1, h: 264, alpha: 1 })).toBe(
      "oklch(0.5 0.1 264)",
    );
  });
  it("includes alpha when translucent", () => {
    expect(oklchToString({ l: 0.5, c: 0.1, h: 264, alpha: 0.6 })).toContain(
      "/ 0.6",
    );
  });
});

describe("createTimbalTheme", () => {
  const theme = createTimbalTheme({ brand: "#4f46e5" });

  it("emits paired light and dark token maps", () => {
    expect(Object.keys(theme.light).length).toBeGreaterThan(0);
    expect(Object.keys(theme.dark).length).toBeGreaterThan(0);
  });

  it("derives primary + foreground + ring in both modes", () => {
    for (const mode of [theme.light, theme.dark]) {
      expect(mode["--primary"]).toMatch(/^oklch\(/);
      expect(mode["--primary-foreground"]).toMatch(/^oklch\(/);
      expect(mode["--ring"]).toMatch(/^oklch\(/);
    }
  });

  it("derives the full primary button gradient", () => {
    const keys = [
      "--primary-fill-from",
      "--primary-fill-to",
      "--primary-fill-hover-from",
      "--primary-fill-hover-to",
      "--primary-fill-active-from",
      "--primary-fill-active-to",
    ];
    for (const key of keys) {
      expect(theme.light[key]).toBeDefined();
      expect(theme.dark[key]).toBeDefined();
    }
  });

  it("keeps light and dark key sets in sync (no half-overrides)", () => {
    const lightKeys = Object.keys(theme.light).sort();
    const darkKeys = Object.keys(theme.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it("emits --radius only when requested", () => {
    expect(createTimbalTheme({ brand: "#000" }).root?.["--radius"]).toBeUndefined();
    expect(
      createTimbalTheme({ brand: "#000", radius: 1 }).root?.["--radius"],
    ).toBe("1rem");
  });

  it("adds accent tokens when an accent is given", () => {
    const withAccent = createTimbalTheme({ brand: "#4f46e5", accent: "#10b981" });
    expect(withAccent.light["--accent"]).toBeDefined();
    expect(withAccent.dark["--accent"]).toBeDefined();
  });
});

describe("themeToCss", () => {
  const theme = createTimbalTheme({ brand: "#4f46e5", radius: 1 });

  it("produces :root and .dark blocks", () => {
    const css = themeToCss(theme);
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("--primary:");
    expect(css).toContain("--radius: 1rem");
  });

  it("scopes to a data attribute when requested", () => {
    const css = themeToCss(theme, { scope: "indigo" });
    expect(css).toContain('[data-timbal-theme="indigo"] {');
    expect(css).toContain('.dark [data-timbal-theme="indigo"]');
    expect(css).not.toContain(":root {");
  });
});

describe("TIMBAL_THEME_PRESETS", () => {
  it("includes the platform baseline with no overrides", () => {
    const platform = getThemePreset("platform");
    expect(platform).toBeDefined();
    expect(Object.keys(platform!.tokens.light)).toHaveLength(0);
  });

  it("has unique ids and generated tokens for brand presets", () => {
    const ids = TIMBAL_THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const indigo = getThemePreset("indigo");
    expect(indigo!.tokens.light["--primary"]).toMatch(/^oklch\(/);
  });
});
