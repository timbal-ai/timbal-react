/**
 * Shared modal enter/exit classes for Dialog, AlertDialog, and Sheet.
 *
 * Centered shells use `inset-0 m-auto` for layout (no translate centering) so
 * `animate-modal-content-*` keyframes can scale + rise without fighting position.
 * Sheets keep the tw-enter slide modifiers with `animate-in-modal` easing.
 *
 * Timing follows package motion standards: ~350ms decelerated enter,
 * ~200ms accelerated exit (see `luxuryEase` in chat/motion.tsx).
 */

/** Backdrop fade for Dialog, AlertDialog, and Sheet. */
export const MODAL_OVERLAY_MOTION_CLASS =
  "data-[state=open]:animate-modal-overlay-in data-[state=closed]:animate-modal-overlay-out motion-reduce:animate-none";

/** Centered modal panel (Dialog, AlertDialog). */
export const MODAL_CENTER_CONTENT_MOTION_CLASS =
  "origin-center data-[state=open]:animate-modal-content-in data-[state=closed]:animate-modal-content-out motion-reduce:animate-none";

/** `fixed inset-0 m-auto` centering — keeps transform free for enter animation. */
export const MODAL_CENTER_CONTENT_LAYOUT_CLASS =
  "fixed inset-0 z-[70] m-auto grid h-fit max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] sm:max-w-lg";

/** Sheet/drawer panel — pair with per-side slide modifiers. */
export const MODAL_SHEET_CONTENT_MOTION_CLASS =
  "data-[state=open]:animate-in-modal data-[state=closed]:animate-out-modal data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none";
