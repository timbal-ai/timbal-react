/**
 * Copy-paste into a workforce agent system prompt (or codegen tool context) so
 * the model knows which expressive `/site` motion primitives exist and how to
 * dose them — without turning every page into a motion demo.
 *
 * @example
 * ```ts
 * import { SITE_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react/site";
 *
 * const systemPrompt = `${basePrompt}\n\n${SITE_AGENT_INSTRUCTIONS}`;
 * ```
 */
export const SITE_AGENT_INSTRUCTIONS = `
## Site kit (@timbal-ai/timbal-react/site)

Expressive **motion & interaction primitives** for marketing, brand, landing, and editorial pages — the counterpart to \`/app\` (which is for dashboards and operations UIs). Import from \`@timbal-ai/timbal-react/site\` (or the package root).

These are **mechanics, not art direction**: they animate whatever you put inside them. Compose them under a chosen aesthetic; they do not impose colors, type, or layout.

### When to use \`/site\` (and when not to)

- **Do** use \`/site\` for landing pages, hero sections, feature walkthroughs, logo walls, pricing pages, and editorial/brand storytelling.
- **Do not** use \`/site\` inside dashboards, settings, tables, or in-thread chat artifacts — those stay on \`/app\` and \`/artifacts\`. Animated dashboard chrome reads as slop.
- Every primitive is **reduced-motion-aware** (collapses to static, no-transform output under \`prefers-reduced-motion\`) and **SSR-safe** (no layout shift — elements occupy their space from first paint). You never need to guard them yourself.
- Built on the \`motion\` engine the package already bundles — **no extra dependencies**.

### Dosing (anti-overuse — read this)

The failure mode is animating *everything*. Restraint is the brand signal.

- Pick **one** signature motion per section (e.g. a \`TextReveal\` headline **or** a \`Parallax\` hero image, not both stacked).
- Stagger entrances down the page; do not fire ten reveals at once on first paint.
- Reserve \`Magnetic\` for **primary** CTAs / nav, not every button.
- Keep \`Parallax\` \`speed\` subtle (\`0.15\`–\`0.35\`); large values look gimmicky.
- Default durations are intentionally slow and weighted (\`DURATION.base\` = 0.7s) — that confident pacing is the point. Don't speed everything up to app-kit's 150ms.

### Component menu

| Component | Use for | Key props |
|-----------|---------|-----------|
| \`Reveal\` | Fade/slide a block in as it scrolls into view (headings, cards, images, list items). | \`variant\` (\`fade\` \\| \`fade-up\` \\| \`fade-down\` \\| \`fade-left\` \\| \`fade-right\` \\| \`blur\` \\| \`scale\` \\| \`mask-up\`, default \`fade-up\`), \`delay\`, \`duration\`, \`distance\` (px, default 28), \`amount\` (visibility fraction 0–1 / \`"some"\` / \`"all"\`, default 0.3), \`repeat\` (replay on re-enter), \`as\` (render element, e.g. \`"section"\`/\`"li"\`). |
| \`TextReveal\` | Signature editorial headline entrance — text rides up token-by-token from a clip on a stagger. | \`children\` (**plain string only**), \`splitBy\` (\`words\` default \\| \`lines\`), \`stagger\` (default 0.06), \`delay\`, \`duration\`, \`amount\` (default 0.4), \`repeat\`, \`as\` (\`span\` default \\| \`h1\`–\`h4\` \\| \`p\`). |
| \`Parallax\` | Depth — translate a layer relative to scroll (hero images, background art). | \`speed\` (-0.6…0.6, positive = lags behind scroll, default 0.2), \`axis\` (\`y\` default \\| \`x\`), \`smooth\` (spring-damped, default true). |
| \`Marquee\` | Seamless infinite scrolling row (logo walls, testimonials, ticker). Duplicates children internally — no visible seam. | \`speed\` (px/s, default 60), \`direction\` (\`left\` default \\| \`right\`), \`pauseOnHover\` (default true), \`gap\` (CSS length, default \`"3rem"\`). |
| \`Magnetic\` | Pointer-following "magnetic" affordance for a **single** interactive child (primary CTA, nav link). | \`strength\` (fraction of cursor offset, default 0.35), \`max\` (px clamp, default 24), \`spring\` (\`"snappy"\` default \\| \`"smooth"\`). Wrap one button/link. |

### Motion tokens

\`EASE\` (cubic-bezier tuples: \`out\` / \`inOut\` / \`soft\`), \`DURATION\` (\`fast\` 0.4s / \`base\` 0.7s / \`slow\` 1.1s), and \`SPRING\` (\`snappy\` / \`smooth\`) are exported for custom \`motion\` work that should match the kit's feel. Prefer the component defaults; reach for tokens only when hand-rolling a bespoke animation.

### Example imports

\`\`\`tsx
import { Reveal, TextReveal, Parallax, Marquee, Magnetic } from "@timbal-ai/timbal-react/site";
\`\`\`

\`\`\`tsx
<Reveal variant="fade-up" delay={0.1}>
  <TextReveal as="h1" className="text-6xl font-semibold">
    Built for the long run
  </TextReveal>
</Reveal>

<Parallax speed={0.3}>
  <img src={hero} alt="" className="h-full w-full object-cover" />
</Parallax>

<Magnetic strength={0.4}>
  <Button>Get started</Button>
</Magnetic>
\`\`\`

### Rules

- \`/site\` is for the **marketing/brand surface**, not the product app shell (\`/app\`) or in-chat widgets (\`/artifacts\`).
- \`TextReveal\` takes a **string** child only — it splits internally; do not pass JSX.
- \`Magnetic\` wraps a **single** interactive child; don't wrap whole layouts.
- Trust the reduced-motion / SSR handling — never add your own \`prefers-reduced-motion\` guards around these.
`.trim();
