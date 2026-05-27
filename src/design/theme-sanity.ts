/**
 * Dev-only theme sanity check.
 *
 * The library mixes Tailwind utilities that depend on two switches:
 *
 *   1. The `.dark` class on an ancestor (typically `<html>`)
 *   2. The `--background` / `--foreground` / etc. CSS variables defined in
 *      `:root` and `.dark` (see `styles.css`)
 *
 * When (1) is enabled but (2) is not — or vice versa — the UI falls into a
 * "dark page, light card text" failure mode that's hard to diagnose from the
 * screenshot alone. This module schedules a one-shot check once per page
 * load and prints a single clear console warning when the two switches are
 * out of sync. It is a no-op in production builds and in non-DOM contexts
 * (SSR).
 */

let scheduled = false;
let warned = false;

function isDev(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return false;
  }
  return true;
}

function parseLuminance(color: string): number | null {
  const value = color.trim();
  if (!value) return null;

  // oklch(L ...) — L is the first number, in [0, 1].
  const oklch = value.match(/oklch\(\s*([0-9.]+)/i);
  if (oklch) {
    const lightness = Number.parseFloat(oklch[1]!);
    if (Number.isFinite(lightness)) return lightness;
  }

  // rgb(r, g, b) — normalise to [0, 1] via Rec. 709 luma.
  const rgb = value.match(/rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
  if (rgb) {
    const r = Number.parseFloat(rgb[1]!) / 255;
    const g = Number.parseFloat(rgb[2]!) / 255;
    const b = Number.parseFloat(rgb[3]!) / 255;
    if ([r, g, b].every(Number.isFinite)) {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }

  // hsl(h, s%, l%) — use lightness.
  const hsl = value.match(/hsla?\(\s*[0-9.]+[\s,]+[0-9.]+%[\s,]+([0-9.]+)%/i);
  if (hsl) {
    const lightness = Number.parseFloat(hsl[1]!) / 100;
    if (Number.isFinite(lightness)) return lightness;
  }

  return null;
}

function runCheck(): void {
  if (warned) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const root = document.documentElement;
  const styles = window.getComputedStyle(root);
  const background = styles.getPropertyValue("--background").trim();

  if (!background) {
    warned = true;
    console.warn(
      "[@timbal-ai/timbal-react] No `--background` CSS variable found on `<html>`. " +
        "Did you `import \"@timbal-ai/timbal-react/styles.css\"` in your app entry? " +
        "Components rely on semantic tokens (bg-background, text-foreground, …) and will fall back to browser defaults.",
    );
    return;
  }

  const luminance = parseLuminance(background);
  if (luminance === null) return;

  const hasDarkClass = root.classList.contains("dark");
  const looksDark = luminance < 0.5;

  if (hasDarkClass !== looksDark) {
    warned = true;
    console.warn(
      `[@timbal-ai/timbal-react] Theme mismatch detected. ` +
        `\`<html>\` has${hasDarkClass ? "" : " no"} \`.dark\` class but the resolved \`--background\` ` +
        `is ${looksDark ? "dark" : "light"} (${background}). ` +
        `This usually means the consumer's CSS overrides \`--background\` only in one mode. ` +
        `Import \`@timbal-ai/timbal-react/styles.css\` for a complete light + dark token set, ` +
        `or declare matching \`:root\` AND \`.dark\` blocks in your own CSS.`,
    );
  }
}

/**
 * Schedule the dev-only sanity check. Idempotent — only the first call per
 * page load actually arms the timer. Production builds and SSR contexts are
 * no-ops.
 */
export function scheduleThemeSanityCheck(): void {
  if (scheduled) return;
  if (!isDev()) return;
  if (typeof window === "undefined") return;
  scheduled = true;

  // Wait one tick so the consumer's CSS has a chance to attach. Helper classes
  // that ship in this package read computed CSS vars; the host stylesheet
  // import order is non-deterministic from our point of view.
  if (typeof queueMicrotask === "function") {
    queueMicrotask(() => setTimeout(runCheck, 0));
  } else {
    setTimeout(runCheck, 0);
  }
}
