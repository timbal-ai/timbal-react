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
  /** Mode-independent variables (e.g. `--radius`, `--font-sans`) applied once in `:root`. */
  root?: ThemeTokenMap;
  /**
   * Font stack applied as `font-family` on the theme scope (and `body`), so
   * every component re-skins. Set independently of the `--font-*` vars so the
   * serializer can emit the actual `font-family` declaration.
   */
  fontFamily?: string;
  /**
   * Optional stylesheet URL (e.g. a Google Fonts link) that loads the font in
   * `fontFamily`. Injected as a `<link>` by `applyTimbalTheme` / `TimbalThemeStyle`;
   * for build-time `themeToCss` the host should add the link itself.
   */
  fontImportUrl?: string;
}

/** Drop-shadow weight for cards / elevated surfaces. */
export type ThemeShadow = "none" | "hairline" | "soft" | "medium" | "strong";

export interface TimbalThemeTypography {
  /** Body / UI font stack. Applied as `font-family` and `--font-sans`. */
  sans: string;
  /** Optional heading/display stack (`--font-display`; falls back to sans). */
  display?: string;
  /** Optional monospace stack (`--font-mono`). */
  mono?: string;
  /** Optional stylesheet URL that loads the fonts (Google Fonts CSS, etc.). */
  importUrl?: string;
}

export interface TimbalThemeIntent {
  /** Primary brand color — any CSS color: `#4f46e5`, `rgb(...)`, `oklch(...)`. */
  brand: string;
  /** Optional secondary accent. Defaults to a desaturated brand. */
  accent?: string;
  /** Corner radius in rem (maps to `--radius` + `--radius-2xl`). Default 0.75. */
  radius?: number;
  /**
   * Tint neutral surfaces (background / muted / border) toward the brand hue
   * with very low chroma, for a more cohesive branded feel. Default `false`
   * keeps the shipped neutral grays.
   */
  tintNeutrals?: boolean;
  /**
   * Full typography personality (font stacks + optional web-font URL). When
   * set, the generated theme re-skins every component's font.
   */
  typography?: TimbalThemeTypography;
  /** Shadow weight for cards / elevated surfaces. Default keeps the shipped `medium`. */
  shadow?: ThemeShadow;
}

// Card / elevated shadow presets per weight, paired light + dark. `medium` is
// the shipped default (see `styles.css`) — included so presets can opt back in.
const SHADOW_PRESETS: Record<
  ThemeShadow,
  { lightCard: string; lightElevated: string; darkCard: string; darkElevated: string }
> = {
  none: {
    lightCard: "none",
    lightElevated: "none",
    darkCard: "none",
    darkElevated: "none",
  },
  hairline: {
    lightCard: "0 0 0 1px rgba(15, 23, 42, 0.06)",
    lightElevated: "0 1px 2px rgba(15, 23, 42, 0.06)",
    darkCard: "0 0 0 1px rgba(255, 255, 255, 0.06)",
    darkElevated: "0 2px 8px rgba(0, 0, 0, 0.4)",
  },
  soft: {
    lightCard: "0 1px 2px rgba(15, 23, 42, 0.04)",
    lightElevated: "0 8px 30px rgba(15, 23, 42, 0.07)",
    darkCard: "0 1px 2px rgba(0, 0, 0, 0.3)",
    darkElevated: "0 10px 34px rgba(0, 0, 0, 0.45)",
  },
  medium: {
    lightCard: "0 1px 2px -0.5px rgba(0, 0, 0, 0.05)",
    lightElevated: "0 4px 24px rgba(0, 0, 0, 0.06)",
    darkCard: "0 1px 3px rgba(0, 0, 0, 0.22)",
    darkElevated: "0 4px 24px rgba(0, 0, 0, 0.35)",
  },
  strong: {
    lightCard: "0 2px 6px rgba(15, 23, 42, 0.10)",
    lightElevated: "0 16px 48px rgba(15, 23, 42, 0.16)",
    darkCard: "0 2px 6px rgba(0, 0, 0, 0.4)",
    darkElevated: "0 18px 50px rgba(0, 0, 0, 0.6)",
  },
};

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
  let fontFamily: string | undefined;
  let fontImportUrl: string | undefined;

  if (typeof intent.radius === "number") {
    root["--radius"] = `${intent.radius}rem`;
    // `--radius-2xl` (composer shell) isn't derived from `--radius`, so scale it
    // alongside to keep the corner language consistent.
    root["--radius-2xl"] = `${Math.max(intent.radius + 0.25, 0)}rem`;
  }

  // ── Typography ────────────────────────────────────────────────────────────
  if (intent.typography) {
    const { sans, display, mono, importUrl } = intent.typography;
    root["--font-sans"] = sans;
    if (display) root["--font-display"] = display;
    if (mono) root["--font-mono"] = mono;
    fontFamily = sans;
    fontImportUrl = importUrl;
  }

  // ── Shadows ───────────────────────────────────────────────────────────────
  if (intent.shadow) {
    const s = SHADOW_PRESETS[intent.shadow];
    light["--shadow-card-value"] = s.lightCard;
    light["--shadow-card-elevated-value"] = s.lightElevated;
    dark["--shadow-card-value"] = s.darkCard;
    dark["--shadow-card-elevated-value"] = s.darkElevated;
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

  return { light, dark, root, fontFamily, fontImportUrl };
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
  /**
   * Prepend an `@import url("…")` for the theme's `fontImportUrl`. Off by
   * default — `@import` must precede all other rules, so this is only safe when
   * the returned CSS is the entire stylesheet. Prefer loading the font with a
   * `<link>` (which `applyTimbalTheme` / `TimbalThemeStyle` do automatically).
   */
  includeFontImport?: boolean;
}

function declarations(map: ThemeTokenMap, indent: string): string {
  return Object.entries(map)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n");
}

/**
 * Serialize a theme to a CSS string with paired `:root` (light) and `.dark`
 * blocks — the exact shape apps would otherwise hand-author. Writing this in a
 * single block guarantees light + dark stay in sync. When the theme carries a
 * `fontFamily`, a matching `font-family` rule is emitted so every component
 * re-skins (scoped to the subtree for previews, or `:root` + `body` globally).
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
    // Cascade the font into the scoped subtree.
    if (theme.fontFamily) {
      blocks.push(`${sel} {\n${indent}font-family: var(--font-sans);\n}`);
    }
  } else {
    if (Object.keys(lightVars).length) {
      blocks.push(`:root {\n${declarations(lightVars, indent)}\n}`);
    }
    if (Object.keys(theme.dark).length) {
      blocks.push(`.dark {\n${declarations(theme.dark, indent)}\n}`);
    }
    // Apply the font globally. Targeting `body` too overrides scaffolds that
    // pin `body { font-family }`; both resolve through `--font-sans`.
    if (theme.fontFamily) {
      blocks.push(`:root,\nbody {\n${indent}font-family: var(--font-sans);\n}`);
    }
  }

  const css = blocks.join("\n\n");

  if (options.includeFontImport && theme.fontImportUrl) {
    return `@import url("${theme.fontImportUrl}");\n\n${css}`;
  }
  return css;
}

// ---------------------------------------------------------------------------
// Runtime apply
// ---------------------------------------------------------------------------

const RUNTIME_STYLE_ID = "timbal-theme-runtime";
const FONT_LINK_ATTR = "data-timbal-theme-font";

/**
 * Ensure a stylesheet `<link>` for a web-font URL exists in `<head>`. Idempotent
 * per URL; replaces any previously injected theme font link. No-op in SSR.
 */
export function ensureThemeFontLink(url: string | undefined): void {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[${FONT_LINK_ATTR}]`,
  );
  if (!url) {
    existing?.remove();
    return;
  }
  if (existing?.getAttribute("href") === url) return;
  const link = existing ?? document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute(FONT_LINK_ATTR, "");
  if (!existing) document.head.appendChild(link);
}

/**
 * Apply a theme at runtime by injecting (or replacing) a single managed
 * `<style>` element in `<head>` (and a font `<link>` when the theme carries
 * one). Works with the `.dark` class toggle used by `next-themes` / `ModeToggle`
 * — both light and dark blocks are written, so switching mode never desyncs.
 * No-op in SSR / non-DOM contexts.
 *
 * Returns a disposer that removes the injected style + font link.
 */
export function applyTimbalTheme(theme: TimbalThemeTokens): () => void {
  if (typeof document === "undefined") return () => {};

  ensureThemeFontLink(theme.fontImportUrl);

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
    ensureThemeFontLink(undefined);
  };
}

/** Remove a runtime theme injected by {@link applyTimbalTheme}. */
export function clearTimbalTheme(): void {
  if (typeof document === "undefined") return;
  document.getElementById(RUNTIME_STYLE_ID)?.remove();
  ensureThemeFontLink(undefined);
}

function isDev(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return false;
  }
  return true;
}
