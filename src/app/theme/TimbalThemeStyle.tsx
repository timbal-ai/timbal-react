"use client";

import type { FC } from "react";

import {
  themeToCss,
  type TimbalThemeTokens,
} from "../../design/theme";
import {
  getThemePreset,
  type TimbalThemePresetId,
} from "../../design/theme-presets";

export interface TimbalThemeStyleProps {
  /** Generated token set (from `createTimbalTheme`). Takes precedence over `preset`. */
  theme?: TimbalThemeTokens;
  /** Apply a catalog preset by id instead of a custom theme. */
  preset?: TimbalThemePresetId;
  /**
   * Scope the theme to `[data-timbal-theme="<scope>"]` subtrees instead of the
   * whole document — used by `ThemePresetGallery` to preview without changing
   * the live app.
   */
  scope?: string;
  /** Optional `nonce` for strict CSP environments. */
  nonce?: string;
}

/**
 * Inject a generated theme as a `<style>` tag. Render once near the app root
 * (or per-scope for previews). Emits paired light + dark blocks so the `.dark`
 * toggle never desyncs. Pure render — SSR-safe.
 */
export const TimbalThemeStyle: FC<TimbalThemeStyleProps> = ({
  theme,
  preset,
  scope,
  nonce,
}) => {
  const tokens = theme ?? (preset ? getThemePreset(preset)?.tokens : undefined);
  if (!tokens) return null;

  const css = themeToCss(tokens, scope ? { scope } : undefined);
  if (!css) return null;

  return (
    <>
      {tokens.fontImportUrl ? (
        <link rel="stylesheet" href={tokens.fontImportUrl} />
      ) : null}
      <style
        data-timbal-theme-style={scope ?? "root"}
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: css }}
      />
    </>
  );
};
