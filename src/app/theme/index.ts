// App-kit theming surface — generator, presets, apply helpers, and preview UI.

export {
  createTimbalTheme,
  themeToCss,
  applyTimbalTheme,
  clearTimbalTheme,
  ensureThemeFontLink,
} from "../../design/theme";
export type {
  TimbalThemeIntent,
  TimbalThemeTokens,
  TimbalThemeTypography,
  TimbalThemeOverrides,
  ThemeMode,
  ThemeShadow,
  ThemeSurfaces,
  ThemeTokenMap,
  ThemeToCssOptions,
} from "../../design/theme";

export {
  TIMBAL_THEME_PRESETS,
  getThemePreset,
  applyThemePreset,
  getStoredThemePreset,
} from "../../design/theme-presets";
export type {
  TimbalThemePreset,
  TimbalThemePresetId,
} from "../../design/theme-presets";

export { THEME_AGENT_INSTRUCTIONS } from "../../design/theme-instructions";

export { TimbalThemeStyle } from "./TimbalThemeStyle";
export type { TimbalThemeStyleProps } from "./TimbalThemeStyle";

// Internal-only — the visual theme picker is a dev/internal tool and is
// intentionally NOT re-exported from the package entrypoints (`index.ts`,
// `app/index.ts`). Themes are configured programmatically (createTimbalTheme /
// applyThemePreset), not surfaced as an end-user selector in generated apps.
export { ThemePresetGallery } from "./ThemePresetGallery";
export type { ThemePresetGalleryProps } from "./ThemePresetGallery";
