// =============================================================================
// @timbal-ai/timbal-react/site — expressive motion & interaction primitives
//
// The expressive counterpart to `/app`. Where `/app` gives dashboards a high
// floor of structure, `/site` gives marketing / brand / editorial pages a high
// floor of *motion*: scroll reveals, masked text, parallax, marquees, and
// magnetic affordances — all reduced-motion-aware and SSR-safe, built on the
// `motion` engine the package already bundles (no extra dependencies).
//
// These are mechanics, not art direction. Compose them under a chosen
// aesthetic; dose them deliberately (see `SITE_AGENT_INSTRUCTIONS`).
// =============================================================================

export { SITE_AGENT_INSTRUCTIONS } from "./agent-instructions";

export { Reveal } from "./Reveal";
export type { RevealProps, RevealVariant } from "./Reveal";

export { TextReveal } from "./TextReveal";
export type { TextRevealProps } from "./TextReveal";

export { Parallax } from "./Parallax";
export type { ParallaxProps } from "./Parallax";

export { Marquee } from "./Marquee";
export type { MarqueeProps } from "./Marquee";

export { Magnetic } from "./Magnetic";
export type { MagneticProps } from "./Magnetic";

export { EASE, DURATION, SPRING } from "./easing";
