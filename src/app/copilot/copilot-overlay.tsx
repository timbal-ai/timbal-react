"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import LiquidGlass from "liquid-glass-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";

import { cn } from "../../utils";
import { SiriWave } from "./siri-wave";
import { useCopilot, type CopilotControls } from "./context";

// ── Liquid-glass, the non-nested way ──────────────────────────────────────
// `backdrop-filter` samples the backdrop up to the nearest *backdrop root*, and
// any element that itself has `backdrop-filter` becomes one. Chromium then
// refuses to render a `backdrop-filter` nested under another (crbug 1131495), so
// putting the blur on the panel ELEMENT disables every inner glass surface
// (composer, history menu, …).
//
// The fix used by liquid-glass libraries: never let a backdrop-filter sit in the
// ancestor chain of another. We render the panel's blur as an absolutely
// positioned *sibling* layer (`SIRI_GLASS_SURFACE_STYLE`) instead of on the
// panel itself. The panel element then has no backdrop-filter → it is not a
// backdrop root → inner surfaces' own `backdrop-filter` works normally.

/**
 * The blurred frosted layer — lives as a sibling behind the panel content.
 * Reads like the composer pill: a bright top sheen, a dark dense top that fades
 * down to an almost-transparent glassy bottom.
 */
const SIRI_GLASS_SURFACE_STYLE: CSSProperties = {
  backgroundImage: [
    // Pill-style top sheen.
    "linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 16%)",
    // Dark at the top, holds the darkness much lower so the composer +
    // suggestions near the bottom stay readable, then a thin glassy fade.
    "linear-gradient(to bottom, rgba(14,14,18,0.88) 0%, rgba(18,18,24,0.74) 45%, rgba(20,20,26,0.62) 80%, rgba(22,22,30,0.52) 100%)",
  ].join(", "),
  backdropFilter: "blur(72px) saturate(190%)",
  WebkitBackdropFilter: "blur(72px) saturate(190%)",
};

/** The panel element — NO backdrop-filter (so it is not a backdrop root). */
const SIRI_GLASS_STYLE: CSSProperties = {
  boxShadow:
    "0 30px 120px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.10)",
  // Neutralize the light theme tokens inside the panel so child surfaces
  // (thread footer `bg-card`, composer `bg-composer-bg`) read as glass, not white.
  ["--card" as string]: "transparent",
  ["--background" as string]: "transparent",
  ["--composer-bg" as string]: "transparent",
  transformOrigin: "100% 100%",
};

/** Panel open/close — enter scales up (opacity stays 1 to avoid glass flicker). */
const CHAT_PANEL_MS = 380;
const CHAT_TRIGGER_ENTER_DELAY_S = 0.1;
const CHAT_TRIGGER_FADE_S = 0.28;
const CHAT_TRIGGER_EXIT_S = 0.15;
const CHAT_PANEL_EASE = [0.32, 0.72, 0, 1] as const;

const CHAT_PANEL_ENTER = { scale: 0.94, opacity: 1 } as const;
const CHAT_PANEL_REST = { scale: 1, opacity: 1 } as const;
/** Exit shrinks very gently toward the trigger anchor and fades out in sync. */
const CHAT_PANEL_EXIT = {
  scale: 0.95,
  opacity: 0,
} as const;
const CHAT_PANEL_MOTION_TRANSITION = {
  duration: CHAT_PANEL_MS / 1000,
  ease: CHAT_PANEL_EASE,
} as const;

const SIRI_PANEL_BASE = cn(
  // z-[70] keeps the assistant above the floating sidebar (z-[60]) so an
  // expanded panel is never covered by it.
  "aui-app-shell-chat-float dark fixed z-[70] flex flex-col overflow-hidden",
  "bottom-6 right-6 max-sm:bottom-3 max-sm:right-3",
  // width/height/radius transition between collapsed and expanded — CSS handles
  // rem↔calc interpolation on computed lengths (no Framer `auto` breakage).
  "transition-[width,height,border-radius] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
);

export interface CopilotOverlayProps {
  /** Open/expand controls — pass from `AppCopilot` so the portaled subtree never misses context. */
  controls?: CopilotControls | null;
  /** Label on the floating open trigger + the panel's `aria-label`. */
  triggerLabel?: string;
  /** Hide the built-in floating trigger (drive open state yourself). */
  hideTrigger?: boolean;
  /** Panel body — the `CopilotPanel`. */
  children: ReactNode;
}

/**
 * The fixed, viewport-anchored copilot chrome: a glass panel (open) and a
 * SiriWave pill trigger (closed). Reads open/expand from {@link useCopilot} so
 * it works whether `AppCopilot` owns the state or an app-level `CopilotProvider`
 * does. Rendered through a portal by `AppCopilot`, so it floats over any layout.
 */
export const CopilotOverlay: FC<CopilotOverlayProps> = ({
  controls: controlsProp,
  triggerLabel = "Assistant",
  hideTrigger = false,
  children,
}) => {
  const contextControls = useCopilot();
  const controls = controlsProp ?? contextControls;
  const reducedMotion = useReducedMotion();
  const open = controls?.open ?? false;
  const expanded = controls?.expanded ?? false;
  const collapsible = controls?.collapsible ?? true;

  // Stagger the trigger fade-in while the panel is still exiting so the handoff
  // reads as one motion instead of the panel vanishing then the pill popping in.
  const [isClosing, setIsClosing] = useState(false);
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current && !open) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setIsClosing(false), CHAT_PANEL_MS);
      prevOpen.current = open;
      return () => window.clearTimeout(timer);
    }
    prevOpen.current = open;
    return undefined;
  }, [open]);

  return (
    <>
      <AnimatePresence onExitComplete={() => setIsClosing(false)}>
        {open ? (
          <motion.div
            className={cn(
              SIRI_PANEL_BASE,
              expanded
                ? "w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] rounded-[32px] max-sm:!inset-0 max-sm:!w-auto max-sm:!h-auto max-sm:!rounded-none"
                : "w-[30rem] h-[40rem] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] max-sm:w-[calc(100vw-1.5rem)] max-sm:h-[calc(100vh-1.5rem)] rounded-[28px]",
            )}
            style={SIRI_GLASS_STYLE}
            // Enter: scale only (opacity stays 1 — animating opacity on open turns
            // the panel into a backdrop root and makes inner glass buttons flicker).
            // Exit: subtle shrink + fade so the panel dissolves instead of popping
            // off as a tiny opaque card.
            initial={reducedMotion ? false : CHAT_PANEL_ENTER}
            animate={CHAT_PANEL_REST}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.15 } }
                : CHAT_PANEL_EXIT
            }
            transition={CHAT_PANEL_MOTION_TRANSITION}
            role="dialog"
            aria-label={triggerLabel}
          >
            {/* Blur lives on a sibling layer (not the panel) so inner glass
                surfaces can use their own backdrop-filter — see notes above. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={SIRI_GLASS_SURFACE_STYLE}
            />
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {collapsible && !hideTrigger ? (
        <AnimatePresence>
          {!open ? (
            <motion.div
              key="chat-trigger"
              aria-hidden={false}
              // Viewport-covering, click-through layer that OWNS a high stacking
              // context (z-[71], above the panel's z-[70] and the shell's `main`).
              // `aui-app-shell-chat-trigger-fixed` has no CSS positioning, so the
              // pill used to inherit `position: static` and its z-index was ignored
              // — `main` then painted on top and swallowed the click. `fixed
              // inset-0` fixes the stacking; `pointer-events-none` keeps the empty
              // area click-through so only the pill itself is interactive.
              className="aui-app-shell-chat-trigger-fixed pointer-events-none fixed inset-0 z-[71]"
              // Opacity-only wrapper — never transform here or LiquidGlass fixed
              // positioning breaks and the pill jumps off-screen.
              initial={reducedMotion || !isClosing ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion
                  ? 0.12
                  : isClosing
                    ? CHAT_TRIGGER_FADE_S
                    : CHAT_TRIGGER_EXIT_S,
                delay: reducedMotion || !isClosing ? 0 : CHAT_TRIGGER_ENTER_DELAY_S,
                ease: CHAT_PANEL_EASE,
              }}
            >
              <LiquidGlass
                onClick={() => controls?.setOpen(true)}
                cornerRadius={999}
                padding="6px 20px 6px 6px"
                blurAmount={0.14}
                displacementScale={96}
                saturation={140}
                aberrationIntensity={3}
                elasticity={0.35}
                className="pointer-events-auto cursor-pointer"
                style={{
                  position: "fixed",
                  // The library centers on its top/left anchor (translate -50%,-50%),
                  // so anchor at the pill's center near the bottom-right corner.
                  top: "calc(100dvh - 1.5rem - 26px)",
                  left: "calc(100dvw - 1.5rem - 78px)",
                }}
              >
                <div className="flex items-center gap-2 bg-transparent">
                  <SiriWave
                    variant="wave"
                    size={40}
                    renderScale={1.5}
                    className="pointer-events-none shrink-0 rounded-full bg-transparent"
                    style={{ width: 40, height: 40, background: "transparent" }}
                  />
                  <span
                    className="whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-white"
                    style={{ textShadow: "none" }}
                  >
                    {triggerLabel}
                  </span>
                </div>
              </LiquidGlass>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </>
  );
};
