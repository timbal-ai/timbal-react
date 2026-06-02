// App-kit theming surface — generator, presets, apply helpers, and preview UI.

export {
  createTimbalTheme,
  themeToCss,
  applyTimbalTheme,
  clearTimbalTheme,
} from "../../design/theme";
export type {
  TimbalThemeIntent,
  TimbalThemeTokens,
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
export { ThemePresetGallery } from "./ThemePresetGallery";
export type { ThemePresetGalleryProps } from "./ThemePresetGallery";
