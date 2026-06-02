/**
 * Theme generator — turn brand *intent* into a complete, paired light + dark
 * token set, so agents and apps never hand-author `oklch(...)` or risk a
 * light-only override (the failure mode `theme-sanity.ts` warns about).
 *
 * The package owns the OKLCH math for every Timbal extension token (button
 * gradients, playground tint, ring, elevated surfaces) because deriving them
 * correctly requires knowing the full token contract in `styles.css`. Callers
 * only supply a brand color (and optional accent / radius / neutral tint).
 *
 *   const theme = createTimbalTheme({ brand: "#4f46e5" });
 *   document head ← themeToCss(theme)              // build-time / SSR
 *   applyTimbalTheme(theme)                          // runtime, swappable
 *
 * Tokens are returned as `{ light, dark }` maps of CSS variable name → value.
 * Only the keys that change from the package defaults are included — overrides
 * cascade over `styles.css`, so unset tokens keep their shipped values.
 */

import {
  lighten,
  oklchToString,
  parseColor,
  readableForeground,
  relativeLuminance,
  scaleChroma,
  withAlpha,
  type Oklch,
} from "./oklch";

/** CSS variable name → value. */
export type ThemeTokenMap = Record<string, string>;

export interface TimbalThemeTokens {
  /** Variables applied in `:root` (light mode). */
  light: ThemeTokenMap;
  /** Variables applied in `.dark`. */
  dark: ThemeTokenMap;
  /** Mode-independent variables (e.g. `--radius`) applied once in `:root`. */
  root?: ThemeTokenMap;
}

export interface TimbalThemeIntent {
  /** Primary brand color — any CSS color: `#4f46e5`, `rgb(...)`, `oklch(...)`. */
  brand: string;
  /** Optional secondary accent. Defaults to a desaturated brand. */
  accent?: string;
  /** Corner radius in rem (maps to `--radius`). Default keeps the shipped 0.75. */
  radius?: number;
  /**
   * Tint neutral surfaces (background / muted / border) toward the brand hue
   * with very low chroma, for a more cohesive branded feel. Default `false`
   * keeps the shipped neutral grays.
   */
  tintNeutrals?: boolean;
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/**
 * Build a usable solid-fill primary from the raw brand color. Brand hues vary
 * wildly in lightness; we clamp into a band that reads well as a button fill
 * while staying faithful to the input.
 */
function primaryForMode(brand: Oklch, mode: "light" | "dark"): Oklch {
  if (mode === "light") {
    return { ...brand, l: Math.min(Math.max(brand.l, 0.42), 0.68) };
  }
  // Dark surfaces need a slightly lighter, slightly less saturated fill.
  const lightened = lighten(brand, 0.06);
  return {
    ...lightened,
    l: Math.min(Math.max(lightened.l, 0.5), 0.78),
    c: Math.min(brand.c, 0.22),
  };
}

function brandGradient(primary: Oklch): {
  from: Oklch;
  to: Oklch;
  hoverFrom: Oklch;
  hoverTo: Oklch;
  activeFrom: Oklch;
  activeTo: Oklch;
} {
  // Subtle top→bottom sheen, mirroring the shipped neutral primary gradient.
  return {
    from: lighten(primary, 0.03),
    to: lighten(primary, -0.02),
    hoverFrom: lighten(primary, 0.06),
    hoverTo: lighten(primary, 0.01),
    activeFrom: lighten(primary, -0.02),
    activeTo: lighten(primary, -0.06),
  };
}

function neutralTints(brand: Oklch): {
  lightHue: number;
  darkHue: number;
  lightChroma: number;
  darkChroma: number;
} {
  return {
    lightHue: brand.h,
    darkHue: brand.h,
    lightChroma: 0.006,
    darkChroma: 0.008,
  };
}

/**
 * Derive a complete paired token set from brand intent. Pure — safe in SSR,
 * tests, and build scripts.
 */
export function createTimbalTheme(intent: TimbalThemeIntent): TimbalThemeTokens {
  const brand = parseColor(intent.brand);
  const accent = intent.accent ? parseColor(intent.accent) : null;

  const light: ThemeTokenMap = {};
  const dark: ThemeTokenMap = {};
  const root: ThemeTokenMap = {};

  if (typeof intent.radius === "number") {
    root["--radius"] = `${intent.radius}rem`;
  }

  // ── Primary + foreground + ring ──────────────────────────────────────────
  const primaryLight = primaryForMode(brand, "light");
  const primaryDark = primaryForMode(brand, "dark");

  light["--primary"] = oklchToString(primaryLight);
  light["--primary-foreground"] = readableForeground(primaryLight);
  light["--ring"] = oklchToString(
    scaleChroma({ ...primaryLight, l: 0.6 }, 0.7),
  );

  dark["--primary"] = oklchToString(primaryDark);
  dark["--primary-foreground"] = readableForeground(primaryDark);
  dark["--ring"] = oklchToString(scaleChroma({ ...primaryDark, l: 0.62 }, 0.6));

  // ── Primary button gradient (derived from primary) ───────────────────────
  const gLight = brandGradient(primaryLight);
  light["--primary-fill-from"] = oklchToString(gLight.from);
  light["--primary-fill-to"] = oklchToString(gLight.to);
  light["--primary-fill-hover-from"] = oklchToString(gLight.hoverFrom);
  light["--primary-fill-hover-to"] = oklchToString(gLight.hoverTo);
  light["--primary-fill-active-from"] = oklchToString(gLight.activeFrom);
  light["--primary-fill-active-to"] = oklchToString(gLight.activeTo);

  const gDark = brandGradient(primaryDark);
  dark["--primary-fill-from"] = oklchToString(gDark.from);
  dark["--primary-fill-to"] = oklchToString(gDark.to);
  dark["--primary-fill-hover-from"] = oklchToString(gDark.hoverFrom);
  dark["--primary-fill-hover-to"] = oklchToString(gDark.hoverTo);
  dark["--primary-fill-active-from"] = oklchToString(gDark.activeFrom);
  dark["--primary-fill-active-to"] = oklchToString(gDark.activeTo);

  // ── Accent (optional) ────────────────────────────────────────────────────
  if (accent) {
    const accentLight = { ...accent, l: Math.min(Math.max(accent.l, 0.9), 0.97) };
    const accentDark = { ...accent, l: 0.25, c: Math.min(accent.c, 0.04) };
    light["--accent"] = oklchToString(accentLight);
    light["--accent-foreground"] = readableForeground(accentLight);
    dark["--accent"] = oklchToString(accentDark);
    dark["--accent-foreground"] = readableForeground(accentDark);
  }

  // ── Playground tint (soft brand wash behind the chat column) ─────────────
  light["--playground-from"] = oklchToString(
    withAlpha({ l: 0.91, c: 0.03, h: brand.h, alpha: 0.6 }, 0.6),
  );
  light["--playground-via"] = oklchToString(
    withAlpha({ l: 0.965, c: 0.015, h: brand.h, alpha: 0.3 }, 0.3),
  );
  // `--playground-to` keeps `var(--background)` from styles.css.
  dark["--playground-from"] = oklchToString({
    l: 0.27,
    c: 0.03,
    h: brand.h,
    alpha: 1,
  });
  dark["--playground-via"] = oklchToString({
    l: 0.19,
    c: 0.02,
    h: brand.h,
    alpha: 1,
  });

  // ── Optional neutral tint ─────────────────────────────────────────────────
  if (intent.tintNeutrals) {
    const t = neutralTints(brand);
    light["--secondary"] = oklchToString({
      l: 0.975,
      c: t.lightChroma,
      h: t.lightHue,
      alpha: 1,
    });
    light["--muted"] = light["--secondary"];
    light["--accent"] ??= oklchToString({
      l: 0.965,
      c: t.lightChroma,
      h: t.lightHue,
      alpha: 1,
    });
    light["--border"] = oklchToString({
      l: 0.91,
      c: t.lightChroma,
      h: t.lightHue,
      alpha: 1,
    });
    dark["--secondary"] = oklchToString({
      l: 0.22,
      c: t.darkChroma,
      h: t.darkHue,
      alpha: 1,
    });
    dark["--muted"] = dark["--secondary"];
    dark["--border"] = oklchToString({
      l: 1,
      c: 0,
      h: 0,
      alpha: 0.1,
    });
  }

  // ── Dev-only low-contrast warning ─────────────────────────────────────────
  if (isDev()) {
    const lum = relativeLuminance(primaryLight);
    const fgIsLight = light["--primary-foreground"]!.includes("0.985");
    const fgLum = fgIsLight ? 1 : 0.05;
    const ratio =
      (Math.max(lum, fgLum) + 0.05) / (Math.min(lum, fgLum) + 0.05);
    if (ratio < 3.5) {
      console.warn(
        `[@timbal-ai/timbal-react] createTimbalTheme: brand "${intent.brand}" ` +
          `yields a low primary/foreground contrast (~${ratio.toFixed(2)}:1). ` +
          `Consider a darker or more saturated brand color for buttons/CTAs.`,
      );
    }
  }

  return { light, dark, root };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export interface ThemeToCssOptions {
  /**
   * Scope the theme to elements matching `[data-timbal-theme="<scope>"]`
   * instead of `:root`. Useful for previewing several themes on one page
   * without touching the live document.
   */
  scope?: string;
  /** Indentation for emitted declarations. Default two spaces. */
  indent?: string;
}

function declarations(map: ThemeTokenMap, indent: string): string {
  return Object.entries(map)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n");
}

/**
 * Serialize a theme to a CSS string with paired `:root` (light) and `.dark`
 * blocks — the exact shape apps would otherwise hand-author. Writing this in a
 * single block guarantees light + dark stay in sync.
 */
export function themeToCss(
  theme: TimbalThemeTokens,
  options: ThemeToCssOptions = {},
): string {
  const indent = options.indent ?? "  ";
  const blocks: string[] = [];

  const lightVars = { ...(theme.root ?? {}), ...theme.light };

  if (options.scope) {
    const sel = `[data-timbal-theme="${options.scope}"]`;
    if (Object.keys(lightVars).length) {
      blocks.push(`${sel} {\n${declarations(lightVars, indent)}\n}`);
    }
    if (Object.keys(theme.dark).length) {
      blocks.push(
        `.dark ${sel}, ${sel}.dark {\n${declarations(theme.dark, indent)}\n}`,
      );
    }
  } else {
    if (Object.keys(lightVars).length) {
      blocks.push(`:root {\n${declarations(lightVars, indent)}\n}`);
    }
    if (Object.keys(theme.dark).length) {
      blocks.push(`.dark {\n${declarations(theme.dark, indent)}\n}`);
    }
  }

  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// Runtime apply
// ---------------------------------------------------------------------------

const RUNTIME_STYLE_ID = "timbal-theme-runtime";

/**
 * Apply a theme at runtime by injecting (or replacing) a single managed
 * `<style>` element in `<head>`. Works with the `.dark` class toggle used by
 * `next-themes` / `ModeToggle` — both light and dark blocks are written, so
 * switching mode never desyncs. No-op in SSR / non-DOM contexts.
 *
 * Returns a disposer that removes the injected style.
 */
export function applyTimbalTheme(theme: TimbalThemeTokens): () => void {
  if (typeof document === "undefined") return () => {};

  let el = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = RUNTIME_STYLE_ID;
    el.setAttribute("data-timbal-theme-runtime", "");
    document.head.appendChild(el);
  }
  el.textContent = themeToCss(theme);

  return () => {
    el?.parentNode?.removeChild(el);
  };
}

/** Remove a runtime theme injected by {@link applyTimbalTheme}. */
export function clearTimbalTheme(): void {
  if (typeof document === "undefined") return;
  document.getElementById(RUNTIME_STYLE_ID)?.remove();
}

function isDev(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return false;
  }
  return true;
}
