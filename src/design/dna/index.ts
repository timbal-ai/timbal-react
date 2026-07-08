/**
 * Design DNA — public API.
 *
 * `parseDna` validates a dna.json value; `compileDna` deterministically
 * compiles it to a complete tokens.css. The registries are exported so
 * tooling (and agents, via `timbal-dna registries`) can enumerate the
 * curated menus.
 */

export {
  parseDna,
  DnaValidationError,
  type DesignDna,
  type DnaColor,
  type DnaTypography,
  type DnaShape,
  type DnaElevation,
  type DnaSpacing,
  type DnaMotion,
  type DnaLayout,
  type DnaVoice,
  type DnaMeta,
  type DnaReference,
  type DnaPersonality,
  type DnaOverrides,
  type DnaSurfaceStrategy,
  type DnaFinish,
  type DnaMode,
  type DnaStatusSetId,
  type DnaChartRecipeId,
  type DnaControlShape,
  type DnaElevationLevel,
  type DnaElevationStrategy,
  type DnaDensity,
  type DnaMotionPreset,
} from "./schema";

export {
  compileDna,
  DNA_COMPILER_VERSION,
  type DnaCompileResult,
  type DnaCompileReport,
} from "./compile";

export {
  FONT_PAIRINGS,
  STATUS_SETS,
  MOTION_PRESETS,
  ELEVATION_LADDERS,
  DENSITY_SPECS,
  getFontPairing,
  getStatusSet,
  getMotionPreset,
  getElevationLadder,
  type FontPairing,
  type StatusSet,
  type MotionSpec,
  type ElevationLadder,
  type DensitySpec,
} from "./registries";
