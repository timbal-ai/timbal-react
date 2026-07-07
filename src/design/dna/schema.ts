/**
 * Design DNA — the per-project design specification.
 *
 * A `dna.json` file is the single durable artifact that records every visual
 * decision for a generated app: brand color, neutral temperature, surface
 * strategy, type system, shape, elevation, density, motion, and layout intent.
 * It is authored once (by an agent or a human), versioned with the project,
 * and compiled deterministically to `tokens.css` by `compileDna`.
 *
 * Design goals of the schema:
 *
 * - **Bounded freedom.** Every field is either an enum, a number in a
 *   validated range, or a color that the compiler re-derives into a coherent
 *   system. There is no way to express "hot pink text on lime" — bad raw
 *   material can't enter.
 * - **Curated registries.** Typography comes from a curated pairing registry
 *   (or explicit stacks), statuses and chart palettes from named recipes —
 *   see `registries.ts`.
 * - **Durable consistency.** Because every later edit reads the same file,
 *   page 12 looks like page 1, and a re-theme is a one-field diff.
 *
 * Validation is hand-rolled (no runtime deps — this ships inside a
 * self-contained CLI) and collects *all* problems before throwing, so an
 * agent can fix a bad file in one pass.
 */

export type DnaSurfaceStrategy = "flat" | "panel" | "console";
export type DnaMode = "light" | "dark";
export type DnaStatusSetId = "signal" | "muted" | "vivid";
export type DnaChartRecipeId = "categorical" | "brand" | "monochrome";
export type DnaControlShape = "rounded" | "sharp" | "pill";
export type DnaElevationLevel =
  | "none"
  | "hairline"
  | "soft"
  | "medium"
  | "strong";
export type DnaElevationStrategy = "border" | "shadow" | "both";
export type DnaDensity = "compact" | "comfortable" | "spacious";
export type DnaMotionPreset = "instant" | "snappy" | "smooth" | "expressive";

/**
 * Personality axes, each 0–1. They bias derivation defaults when the
 * corresponding explicit field is omitted, and they are read by review
 * tooling as the project's intent record. 0.5 is always neutral.
 */
export interface DnaPersonality {
  /** 0 = stripped/minimal, 1 = expressive/decorated. */
  minimal_expressive?: number;
  /** 0 = flat (borders separate), 1 = dimensional (shadows separate). */
  flat_dimensional?: number;
  /** 0 = cool neutrals, 1 = warm neutrals. */
  cool_warm?: number;
  /** 0 = dense/data-first, 1 = airy/marketing. */
  dense_airy?: number;
  /** 0 = sober/enterprise, 1 = playful/consumer. */
  serious_playful?: number;
}

export interface DnaReference {
  /** Where the reference came from. */
  source: "mobbin" | "user" | "url" | "other";
  /** Screen id, file path, or URL. */
  ref: string;
  /** What was borrowed — e.g. "layout: split list+detail; warm canvas". */
  borrowed?: string;
}

export interface DnaMeta {
  /** Product/app name the DNA was authored for. */
  name?: string;
  /** One-sentence design intent, e.g. "calm, data-dense logistics console". */
  summary?: string;
  /** Provenance: which references informed this DNA and what was taken. */
  references?: DnaReference[];
}

export interface DnaColor {
  /** Primary brand color — hex / rgb() / oklch(). The only required color. */
  brand: string;
  /** Optional secondary accent color. */
  accent?: string;
  /**
   * Neutral temperature. `hue` defaults to the brand hue (cohesive tint);
   * `chroma` 0–0.03 controls how visibly tinted neutrals are (default is a
   * near-imperceptible 0.004–0.01 depending on strategy).
   */
  neutrals?: { hue?: number; chroma?: number };
  /**
   * Surface strategy:
   * - `flat`    — canvas and cards share a background; borders separate.
   * - `panel`   — gray canvas, lighter elevated cards (classic SaaS).
   * - `console` — dark-first, dense, near-black canvas with flat cards.
   */
  surfaces?: DnaSurfaceStrategy;
  /** Which mode the app should boot into. Both are always compiled. */
  defaultMode?: DnaMode;
  /** Status color set (success / warning / info / destructive). */
  status?: DnaStatusSetId;
  /**
   * Chart palette: a named recipe (`categorical` | `brand` | `monochrome`)
   * or an explicit array of 3–8 colors.
   */
  charts?: DnaChartRecipeId | string[];
}

export interface DnaTypography {
  /** Curated pairing id from the font registry (see `registries.ts`). */
  pairing?: string;
  /** Explicit stacks — override the pairing (or stand alone). */
  sans?: string;
  display?: string;
  mono?: string;
  /** Stylesheet URL that loads the fonts (Google Fonts css2 etc.). */
  importUrl?: string;
  /** Modular type-scale ratio, 1.1–1.4. Default 1.2. */
  scale?: number;
  /** Body size in px, 13–17. Default 15. */
  baseSize?: number;
  /** Heading weight. Default derives from personality (500/600). */
  headingWeight?: 400 | 500 | 600 | 700;
  /** Heading letter-spacing personality. Default "normal". */
  tracking?: "tight" | "normal";
}

export interface DnaShape {
  /** Base corner radius in rem, 0–1.5. Default 0.625. */
  radius?: number;
  /** Control corner language: rounded (default) / sharp / pill. */
  controls?: DnaControlShape;
  /** Border width in px for separating borders. Default 1. */
  borderWidth?: 1 | 2;
}

export interface DnaElevation {
  /** Shadow weight for cards/overlays. Default derives from personality. */
  level?: DnaElevationLevel;
  /** What carries separation: borders, shadows, or both. Default "both". */
  strategy?: DnaElevationStrategy;
}

export interface DnaSpacing {
  /** Global density. Scales the Tailwind spacing unit + control heights. */
  density?: DnaDensity;
}

export interface DnaMotion {
  /** Motion personality: durations + easing set. Default "snappy". */
  preset?: DnaMotionPreset;
}

/**
 * Layout intent — NOT compiled to tokens. This is the durable record of
 * structural decisions that every later edit must respect: the shell
 * archetype, nav model, page width. Review tooling reads it; the compiler
 * carries it through untouched.
 */
export interface DnaLayout {
  /** Shell archetype, e.g. "sidebar", "topbar", "sidebar+topbar", "minimal", "split". */
  shell?: string;
  /** Page content width, e.g. "boxed" | "full" | "narrow". */
  pageWidth?: string;
  /** Free-form structural notes ("nav groups: Ops, Billing; detail = drawer"). */
  notes?: string;
}

export interface DnaVoice {
  /** Casing rule for headings/labels. Timbal house style is "sentence". */
  case?: "sentence";
  /** Copy tone notes, e.g. "direct, no exclamation marks". */
  tone?: string;
}

/**
 * Escape hatch for one-off token tweaks. Values must be token-referential —
 * `var(...)`, `color-mix(...)`, `calc(...)`, `transparent`, or a plain
 * dimension. Raw color literals (`#hex`, `oklch(...)`, `rgb(...)`) are
 * rejected: the compiled system stays the single color source.
 *
 * Either a flat map (applies to both modes) or `{ light, dark }`.
 */
export type DnaOverrides =
  | Record<string, string>
  | { light?: Record<string, string>; dark?: Record<string, string> };

export interface DesignDna {
  version: 1;
  meta?: DnaMeta;
  personality?: DnaPersonality;
  color: DnaColor;
  typography?: DnaTypography;
  shape?: DnaShape;
  elevation?: DnaElevation;
  spacing?: DnaSpacing;
  motion?: DnaMotion;
  layout?: DnaLayout;
  voice?: DnaVoice;
  overrides?: DnaOverrides;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class DnaValidationError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(
      `Invalid design DNA (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
    this.name = "DnaValidationError";
    this.problems = problems;
  }
}

const SURFACES: readonly string[] = ["flat", "panel", "console"];
const MODES: readonly string[] = ["light", "dark"];
const STATUS_SETS: readonly string[] = ["signal", "muted", "vivid"];
const CHART_RECIPES: readonly string[] = ["categorical", "brand", "monochrome"];
const CONTROL_SHAPES: readonly string[] = ["rounded", "sharp", "pill"];
const ELEVATION_LEVELS: readonly string[] = [
  "none",
  "hairline",
  "soft",
  "medium",
  "strong",
];
const ELEVATION_STRATEGIES: readonly string[] = ["border", "shadow", "both"];
const DENSITIES: readonly string[] = ["compact", "comfortable", "spacious"];
const MOTION_PRESETS: readonly string[] = [
  "instant",
  "snappy",
  "smooth",
  "expressive",
];
const PERSONALITY_AXES: readonly (keyof DnaPersonality)[] = [
  "minimal_expressive",
  "flat_dimensional",
  "cool_warm",
  "dense_airy",
  "serious_playful",
];

/** Loose CSS color shape check; the compiler's parser is the real gate. */
const COLOR_SHAPE_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(|oklch\()/;

/**
 * Values allowed in `overrides`: token-referential expressions and plain
 * dimensions — never a raw color literal.
 */
const OVERRIDE_VALUE_RE =
  /^(var\(--[a-z0-9-]+\)|color-mix\(.+\)|calc\(.+\)|light-dark\(.+\)|transparent|inherit|currentColor|-?\d+(\.\d+)?(rem|px|em|ms|s|%)?|none)$/i;

const OVERRIDE_LITERAL_RE = /#[0-9a-fA-F]{3,8}|\b(?:oklch|rgba?|hsla?)\s*\(/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkEnum(
  problems: string[],
  path: string,
  value: unknown,
  allowed: readonly string[],
): void {
  if (value === undefined) return;
  if (typeof value !== "string" || !allowed.includes(value)) {
    problems.push(
      `${path}: expected one of ${allowed.map((a) => `"${a}"`).join(" | ")}, got ${JSON.stringify(value)}`,
    );
  }
}

function checkNumber(
  problems: string[],
  path: string,
  value: unknown,
  min: number,
  max: number,
): void {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    problems.push(`${path}: expected a number, got ${JSON.stringify(value)}`);
    return;
  }
  if (value < min || value > max) {
    problems.push(`${path}: ${value} is outside the allowed range ${min}–${max}`);
  }
}

function checkColorString(
  problems: string[],
  path: string,
  value: unknown,
  required = false,
): void {
  if (value === undefined) {
    if (required) problems.push(`${path}: required (hex, rgb(), or oklch() string)`);
    return;
  }
  if (typeof value !== "string" || !COLOR_SHAPE_RE.test(value.trim())) {
    problems.push(
      `${path}: expected a CSS color (hex "#4f46e5", rgb(), or oklch()), got ${JSON.stringify(value)}`,
    );
  }
}

function checkOverrideMap(
  problems: string[],
  path: string,
  map: unknown,
): void {
  if (map === undefined) return;
  if (!isRecord(map)) {
    problems.push(`${path}: expected an object of { "--token": "value" }`);
    return;
  }
  for (const [key, value] of Object.entries(map)) {
    if (!key.startsWith("--")) {
      problems.push(`${path}["${key}"]: override keys must be CSS custom properties starting with "--"`);
    }
    if (typeof value !== "string") {
      problems.push(`${path}["${key}"]: expected a string value`);
      continue;
    }
    if (OVERRIDE_LITERAL_RE.test(value)) {
      problems.push(
        `${path}["${key}"]: raw color literal "${value}" — overrides must be token-referential (var(--…), color-mix(…)). Change the DNA color fields instead of punching through with literals.`,
      );
      continue;
    }
    if (!OVERRIDE_VALUE_RE.test(value.trim())) {
      problems.push(
        `${path}["${key}"]: "${value}" is not an allowed override value (var(…), color-mix(…), calc(…), transparent, or a plain dimension)`,
      );
    }
  }
}

/**
 * Validate a parsed JSON value as a `DesignDna`. Collects every problem and
 * throws a single `DnaValidationError`, so one fix pass suffices.
 */
export function parseDna(input: unknown): DesignDna {
  const problems: string[] = [];

  if (!isRecord(input)) {
    throw new DnaValidationError([
      `expected a JSON object, got ${Array.isArray(input) ? "an array" : typeof input}`,
    ]);
  }

  if (input.version !== 1) {
    problems.push(`version: must be 1, got ${JSON.stringify(input.version)}`);
  }

  // color (required)
  if (!isRecord(input.color)) {
    problems.push(`color: required object with at least { "brand": "<color>" }`);
  } else {
    checkColorString(problems, "color.brand", input.color.brand, true);
    checkColorString(problems, "color.accent", input.color.accent);
    checkEnum(problems, "color.surfaces", input.color.surfaces, SURFACES);
    checkEnum(problems, "color.defaultMode", input.color.defaultMode, MODES);
    checkEnum(problems, "color.status", input.color.status, STATUS_SETS);
    if (input.color.neutrals !== undefined) {
      if (!isRecord(input.color.neutrals)) {
        problems.push(`color.neutrals: expected an object { hue?, chroma? }`);
      } else {
        checkNumber(problems, "color.neutrals.hue", input.color.neutrals.hue, 0, 360);
        checkNumber(problems, "color.neutrals.chroma", input.color.neutrals.chroma, 0, 0.03);
      }
    }
    const charts = input.color.charts;
    if (charts !== undefined) {
      if (typeof charts === "string") {
        checkEnum(problems, "color.charts", charts, CHART_RECIPES);
      } else if (Array.isArray(charts)) {
        if (charts.length < 3 || charts.length > 8) {
          problems.push(`color.charts: explicit palette needs 3–8 colors, got ${charts.length}`);
        }
        charts.forEach((c, i) => checkColorString(problems, `color.charts[${i}]`, c));
      } else {
        problems.push(`color.charts: expected a recipe name or an array of colors`);
      }
    }
  }

  // personality
  if (input.personality !== undefined) {
    if (!isRecord(input.personality)) {
      problems.push(`personality: expected an object of axes (0–1)`);
    } else {
      for (const [key, value] of Object.entries(input.personality)) {
        if (!PERSONALITY_AXES.includes(key as keyof DnaPersonality)) {
          problems.push(
            `personality.${key}: unknown axis (allowed: ${PERSONALITY_AXES.join(", ")})`,
          );
          continue;
        }
        checkNumber(problems, `personality.${key}`, value, 0, 1);
      }
    }
  }

  // typography
  if (input.typography !== undefined) {
    if (!isRecord(input.typography)) {
      problems.push(`typography: expected an object`);
    } else {
      const t = input.typography;
      for (const k of ["pairing", "sans", "display", "mono", "importUrl"] as const) {
        if (t[k] !== undefined && typeof t[k] !== "string") {
          problems.push(`typography.${k}: expected a string`);
        }
      }
      checkNumber(problems, "typography.scale", t.scale, 1.1, 1.4);
      checkNumber(problems, "typography.baseSize", t.baseSize, 13, 17);
      if (
        t.headingWeight !== undefined &&
        ![400, 500, 600, 700].includes(t.headingWeight as number)
      ) {
        problems.push(`typography.headingWeight: expected 400 | 500 | 600 | 700`);
      }
      if (t.tracking !== undefined && !["tight", "normal"].includes(t.tracking as string)) {
        problems.push(`typography.tracking: expected "tight" | "normal"`);
      }
    }
  }

  // shape
  if (input.shape !== undefined) {
    if (!isRecord(input.shape)) {
      problems.push(`shape: expected an object`);
    } else {
      checkNumber(problems, "shape.radius", input.shape.radius, 0, 1.5);
      checkEnum(problems, "shape.controls", input.shape.controls, CONTROL_SHAPES);
      if (
        input.shape.borderWidth !== undefined &&
        ![1, 2].includes(input.shape.borderWidth as number)
      ) {
        problems.push(`shape.borderWidth: expected 1 | 2`);
      }
    }
  }

  // elevation
  if (input.elevation !== undefined) {
    if (!isRecord(input.elevation)) {
      problems.push(`elevation: expected an object`);
    } else {
      checkEnum(problems, "elevation.level", input.elevation.level, ELEVATION_LEVELS);
      checkEnum(
        problems,
        "elevation.strategy",
        input.elevation.strategy,
        ELEVATION_STRATEGIES,
      );
    }
  }

  // spacing
  if (input.spacing !== undefined) {
    if (!isRecord(input.spacing)) {
      problems.push(`spacing: expected an object`);
    } else {
      checkEnum(problems, "spacing.density", input.spacing.density, DENSITIES);
    }
  }

  // motion
  if (input.motion !== undefined) {
    if (!isRecord(input.motion)) {
      problems.push(`motion: expected an object`);
    } else {
      checkEnum(problems, "motion.preset", input.motion.preset, MOTION_PRESETS);
    }
  }

  // overrides
  if (input.overrides !== undefined) {
    if (!isRecord(input.overrides)) {
      problems.push(`overrides: expected an object`);
    } else {
      const o = input.overrides as Record<string, unknown>;
      const isModeShaped =
        ("light" in o || "dark" in o) &&
        Object.keys(o).every((k) => k === "light" || k === "dark");
      if (isModeShaped) {
        checkOverrideMap(problems, "overrides.light", o.light);
        checkOverrideMap(problems, "overrides.dark", o.dark);
      } else {
        checkOverrideMap(problems, "overrides", o);
      }
    }
  }

  if (problems.length > 0) {
    throw new DnaValidationError(problems);
  }

  return input as unknown as DesignDna;
}
