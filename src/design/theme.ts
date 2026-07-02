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

/** Color-scheme identifier — the value `next-themes` calls a theme. */
export type ThemeMode = "light" | "dark";

/**
 * Per-mode token overrides for {@link TimbalThemeIntent.overrides}. Prefer the
 * flat `ThemeTokenMap` form (applied to both modes) — token-referential values
 * resolve per-mode by construction, so a single declaration usually suffices.
 */
export interface TimbalThemeOverrides {
  /** Overrides applied in `:root` (light mode) only. */
  light?: ThemeTokenMap;
  /** Overrides applied in `.dark` only. */
  dark?: ThemeTokenMap;
  /** Mode-independent overrides (dimensions, fonts, radii). */
  root?: ThemeTokenMap;
}

/**
 * Surface treatment for app chrome.
 *
 * - `"panel"` (default) — the shipped look: sidebar on its own tinted panel,
 *   elevated-gradient active states.
 * - `"console"` — flat, dense, ops/terminal look: the sidebar merges into the
 *   page background, the active nav item is a brand-tinted flat fill, charts
 *   lead with the brand color, and shadows drop to hairline (unless the intent
 *   sets `shadow` explicitly). Pair with `defaultMode: "dark"` for dark-first
 *   consoles.
 */
export type ThemeSurfaces = "panel" | "console";

export interface TimbalThemeTokens {
  /** Variables applied in `:root` (light mode). */
  light: ThemeTokenMap;
  /** Variables applied in `.dark`. */
  dark: ThemeTokenMap;
  /** Mode-independent variables (e.g. `--radius`, `--font-sans`) applied once in `:root`. */
  root?: ThemeTokenMap;
  /**
   * The mode the app is designed to open in. Not applied by the serializer —
   * wire it into the theme provider: `defaultTheme={theme.defaultMode ?? "light"}`.
   */
  defaultMode?: ThemeMode;
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
  /** Chrome treatment — `"panel"` (shipped default) or the flat `"console"` look. */
  surfaces?: ThemeSurfaces;
  /**
   * Chart series palette — up to 6 CSS colors mapped to `--chart-1..6` (extras
   * are ignored). Like `brand`/`accent`, these are *intent* literals: the
   * generator adapts each for light and dark surfaces. Keep the array on one
   * line so the lint gate recognizes it as theme intent.
   */
  chartPalette?: string[];
  /**
   * One-off token overrides for cases the generator doesn't model. Values must
   * be **token-referential** — composed from existing tokens via `var(--token)`
   * / `color-mix(in oklab, var(--a) N%, var(--b))` — never literal colors
   * (those belong in `brand` / `accent` / `chartPalette`; a literal here
   * throws). The flat map form applies to both modes, which is almost always
   * what a token-referential override wants.
   */
  overrides?: ThemeTokenMap | TimbalThemeOverrides;
  /**
   * The mode the app is designed to open in — `"dark"` for dark-first console
   * apps. Passed through on the returned tokens; wire it as
   * `defaultTheme={theme.defaultMode ?? "light"}` on the theme provider.
   */
  defaultMode?: ThemeMode;
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

/**
 * The `"console"` surface treatment, expressed purely in terms of other tokens
 * so it composes with whatever the brand derivation produced (and stays valid
 * in both modes from a single declaration).
 */
const CONSOLE_SURFACE_TOKENS: ThemeTokenMap = {
  "--sidebar": "var(--background)",
  "--sidebar-accent": "color-mix(in oklab, var(--primary) 12%, var(--background))",
  "--sidebar-accent-foreground": "var(--foreground)",
  "--sidebar-active": "var(--sidebar-accent)",
  "--sidebar-active-foreground": "var(--sidebar-accent-foreground)",
};

/**
 * A literal color inside an override *value*: hex, or a color function opening
 * on a numeric channel (`oklch(0.2 …)`, `rgba(0, …)`). Deliberately does NOT
 * match token-referential composition — `var(--x)`, `color-mix(in oklab, …)`,
 * and relative color syntax (`oklch(from var(--x) …)`) all stay allowed.
 */
const OVERRIDE_COLOR_LITERAL_RE =
  /#[0-9a-fA-F]{3,8}\b|\b(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch)\(\s*[\d.]/i;

function assertTokenReferential(map: ThemeTokenMap, where: string): void {
  for (const [name, value] of Object.entries(map)) {
    if (!name.startsWith("--")) {
      throw new TypeError(
        `createTimbalTheme: overrides${where} key "${name}" is not a CSS custom property — keys must start with "--" (e.g. "--sidebar-active").`,
      );
    }
    if (OVERRIDE_COLOR_LITERAL_RE.test(value)) {
      throw new TypeError(
        `createTimbalTheme: overrides${where} value for "${name}" contains a literal color (${JSON.stringify(value)}). ` +
          `Overrides must be token-referential — compose from existing tokens with var(--token) or ` +
          `color-mix(in oklab, var(--a) N%, var(--b)). New literal colors belong in intent: brand, accent, or chartPalette.`,
      );
    }
  }
}

function normalizeOverrides(
  overrides: ThemeTokenMap | TimbalThemeOverrides,
): Required<Pick<TimbalThemeOverrides, "light" | "dark">> & { root: ThemeTokenMap } {
  const keys = Object.keys(overrides);
  const structured =
    keys.length > 0 && keys.every((k) => k === "light" || k === "dark" || k === "root");
  if (structured) {
    const o = overrides as TimbalThemeOverrides;
    return { light: o.light ?? {}, dark: o.dark ?? {}, root: o.root ?? {} };
  }
  // Flat map — token-referential values resolve per-mode, so one declaration
  // covers both. Applying to light AND dark keeps the paired-key invariant.
  const flat = overrides as ThemeTokenMap;
  return { light: { ...flat }, dark: { ...flat }, root: {} };
}

/** Clamp an intent chart color into the lightness band that reads on each surface. */
function chartColorForMode(color: Oklch, mode: ThemeMode): Oklch {
  if (mode === "light") {
    return { ...color, l: Math.min(Math.max(color.l, 0.4), 0.75) };
  }
  // Dark surfaces need brighter series for contrast (shipped dark palette sits ≥0.62).
  return { ...color, l: Math.max(color.l, 0.62) };
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

  // ── Surface treatment ─────────────────────────────────────────────────────
  if (intent.surfaces === "console") {
    Object.assign(light, CONSOLE_SURFACE_TOKENS);
    Object.assign(dark, CONSOLE_SURFACE_TOKENS);
    // Console charts lead with the brand unless the intent picks its own palette.
    if (!intent.chartPalette?.length) {
      light["--chart-1"] = "var(--primary)";
      dark["--chart-1"] = "var(--primary)";
    }
    // Crisp, flat chrome — unless the caller expressed a shadow preference.
    if (!intent.shadow) {
      const s = SHADOW_PRESETS.hairline;
      light["--shadow-card-value"] = s.lightCard;
      light["--shadow-card-elevated-value"] = s.lightElevated;
      dark["--shadow-card-value"] = s.darkCard;
      dark["--shadow-card-elevated-value"] = s.darkElevated;
    }
  }

  // ── Chart palette (intent literals, adapted per mode) ────────────────────
  if (intent.chartPalette?.length) {
    intent.chartPalette.slice(0, 6).forEach((value, i) => {
      const color = parseColor(value);
      light[`--chart-${i + 1}`] = oklchToString(chartColorForMode(color, "light"));
      dark[`--chart-${i + 1}`] = oklchToString(chartColorForMode(color, "dark"));
    });
  }

  // ── Token-referential overrides (personalization escape hatch) ───────────
  if (intent.overrides) {
    const o = normalizeOverrides(intent.overrides);
    assertTokenReferential(o.light, ".light");
    assertTokenReferential(o.dark, ".dark");
    assertTokenReferential(o.root, ".root");
    Object.assign(light, o.light);
    Object.assign(dark, o.dark);
    Object.assign(root, o.root);
    if (isDev()) {
      const halfSet = [
        ...Object.keys(o.light).filter((k) => !(k in o.dark)),
        ...Object.keys(o.dark).filter((k) => !(k in o.light)),
      ];
      if (halfSet.length > 0) {
        console.warn(
          `[@timbal-ai/timbal-react] createTimbalTheme: overrides set ${halfSet.join(", ")} ` +
            `in only one mode. styles.css defines most tokens in both :root and .dark, so a ` +
            `one-mode override is usually shadowed in the other mode — prefer the flat map form ` +
            `(applied to both) unless the asymmetry is deliberate.`,
        );
      }
    }
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

  return {
    light,
    dark,
    root,
    fontFamily,
    fontImportUrl,
    defaultMode: intent.defaultMode,
  };
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
