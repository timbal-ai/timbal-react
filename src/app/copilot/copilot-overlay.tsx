"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import LiquidGlass from "liquid-glass-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type PointerEvent as ReactPointerEvent,
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

// ── Draggable trigger geometry ─────────────────────────────────────────────
// LiquidGlass centers itself on its top/left anchor (translate -50%,-50%), so
// every position below is the PILL'S CENTER in viewport pixels. The persisted
// form is viewport *fractions* (see `CopilotTriggerPosition`) so a dragged
// pill keeps its relative placement when the window is resized.

/** Half the pill footprint — matches the default-corner calc() offsets. */
const TRIGGER_HALF_WIDTH_PX = 78;
const TRIGGER_HALF_HEIGHT_PX = 26;
/** Default distance from the viewport edges (1.5rem, mirrors `bottom-6 right-6`). */
const TRIGGER_EDGE_INSET_PX = 24;
/** The pill never gets closer than this to any viewport edge. */
const TRIGGER_MIN_EDGE_MARGIN_PX = 8;
/** Pointer travel below this stays a click; above it becomes a drag. */
const TRIGGER_DRAG_THRESHOLD_PX = 6;
/** Dropping the pill within this radius of home snaps it back (= reset). */
const TRIGGER_SNAP_HOME_RADIUS_PX = 72;

interface TriggerCenter {
  x: number;
  y: number;
}

/** The default bottom-right resting spot for the pill's center. */
function defaultTriggerCenter(vw: number, vh: number): TriggerCenter {
  return {
    x: vw - TRIGGER_EDGE_INSET_PX - TRIGGER_HALF_WIDTH_PX,
    y: vh - TRIGGER_EDGE_INSET_PX - TRIGGER_HALF_HEIGHT_PX,
  };
}

/** Keep the whole pill on screen (with a small breathing margin). */
function clampTriggerCenter(x: number, y: number, vw: number, vh: number): TriggerCenter {
  const minX = TRIGGER_HALF_WIDTH_PX + TRIGGER_MIN_EDGE_MARGIN_PX;
  const maxX = vw - TRIGGER_HALF_WIDTH_PX - TRIGGER_MIN_EDGE_MARGIN_PX;
  const minY = TRIGGER_HALF_HEIGHT_PX + TRIGGER_MIN_EDGE_MARGIN_PX;
  const maxY = vh - TRIGGER_HALF_HEIGHT_PX - TRIGGER_MIN_EDGE_MARGIN_PX;
  return {
    x: Math.min(Math.max(x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(y, minY), Math.max(minY, maxY)),
  };
}

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
  /**
   * Let users drag the trigger pill away from UI it covers. Dropping it near
   * its home corner snaps it back (reset). Default: `true`.
   */
  triggerDraggable?: boolean;
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
  triggerDraggable = true,
  children,
}) => {
  const contextControls = useCopilot();
  const controls = controlsProp ?? contextControls;
  const reducedMotion = useReducedMotion();
  const open = controls?.open ?? false;
  const expanded = controls?.expanded ?? false;
  const collapsible = controls?.collapsible ?? true;

  // ── Draggable trigger ──
  // Drag support needs controls that carry position state (see context.tsx).
  const canDrag = triggerDraggable && !!controls?.setTriggerPosition;
  const storedPosition = (canDrag ? controls?.triggerPosition : null) ?? null;
  // Live center while a drag is in flight — committed to controls on release.
  const [dragCenter, setDragCenter] = useState<TriggerCenter | null>(null);
  // A drag ends with a pointerup that still fires `click` on the pill; this
  // flag swallows that one click so releasing a drag never opens the panel.
  const suppressClickRef = useRef(false);

  // Re-render on resize so a custom (fraction-based) position re-clamps to the
  // new viewport and never strands the pill off screen.
  const [, setViewportTick] = useState(0);
  useEffect(() => {
    if (!storedPosition || typeof window === "undefined") return undefined;
    const onResize = () => setViewportTick((tick) => tick + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [storedPosition]);

  const handleTriggerPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!canDrag || !controls) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const origin = storedPosition
      ? clampTriggerCenter(storedPosition.x * vw, storedPosition.y * vh, vw, vh)
      : defaultTriggerCenter(vw, vh);
    const drag = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };

    const centerFor = (e: PointerEvent): TriggerCenter =>
      clampTriggerCenter(
        drag.originX + (e.clientX - drag.startClientX),
        drag.originY + (e.clientY - drag.startClientY),
        window.innerWidth,
        window.innerHeight,
      );

    const previousBodyUserSelect = document.body.style.userSelect;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      if (!drag.moved) {
        const travel = Math.hypot(
          e.clientX - drag.startClientX,
          e.clientY - drag.startClientY,
        );
        if (travel < TRIGGER_DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        // A mouse drag would otherwise sweep-select page text under the pill.
        document.body.style.userSelect = "none";
      }
      e.preventDefault();
      setDragCenter(centerFor(e));
    };

    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      if (drag.moved) document.body.style.userSelect = previousBodyUserSelect;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      detach();
      if (drag.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);

        const vw2 = window.innerWidth;
        const vh2 = window.innerHeight;
        const center = centerFor(e);
        const home = defaultTriggerCenter(vw2, vh2);
        const nearHome =
          Math.hypot(center.x - home.x, center.y - home.y) <=
          TRIGGER_SNAP_HOME_RADIUS_PX;
        if (nearHome) {
          controls.resetTriggerPosition?.();
        } else {
          controls.setTriggerPosition?.({ x: center.x / vw2, y: center.y / vh2 });
        }
      }
      setDragCenter(null);
    };

    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      detach();
      setDragCenter(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  // Where the pill anchors this render: live drag > persisted custom spot >
  // default corner (responsive calc(), untouched behavior).
  const customCenter =
    dragCenter ??
    (storedPosition && typeof window !== "undefined"
      ? clampTriggerCenter(
          storedPosition.x * window.innerWidth,
          storedPosition.y * window.innerHeight,
          window.innerWidth,
          window.innerHeight,
        )
      : null);
  const triggerAnchorStyle: CSSProperties = customCenter
    ? {
        position: "fixed",
        top: `${customCenter.y}px`,
        left: `${customCenter.x}px`,
      }
    : {
        position: "fixed",
        // The library centers on its top/left anchor (translate -50%,-50%),
        // so anchor at the pill's center near the bottom-right corner.
        top: `calc(100dvh - 1.5rem - ${TRIGGER_HALF_HEIGHT_PX}px)`,
        left: `calc(100dvw - 1.5rem - ${TRIGGER_HALF_WIDTH_PX}px)`,
      };

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
              // Drag starts here (bubbled from the pill — the only
              // pointer-events-auto descendant), so the WHOLE pill is a drag
              // handle including its padding ring, which our content div
              // doesn't cover. `touch-action` on an ancestor constrains the
              // touched element, so touch drags don't scroll the page.
              onPointerDown={handleTriggerPointerDown}
              style={canDrag ? { touchAction: "none" } : undefined}
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
              {/* LiquidGlass inlines `transition: all ease-out 0.2s` on its
                  root AND on every decorative sibling layer (sheen borders,
                  hover glows, scrims), so while dragging the crystal chrome
                  trails the pill by 0.2s. Inline styles can only be beaten by
                  `!important`, and consumers may not compile our arbitrary
                  Tailwind variants — so while a drag is live, this scoped
                  style tag freezes transitions for everything in the wrapper.
                  It unmounts on release, restoring the glide (snap-home
                  eases home). */}
              {dragCenter ? (
                <style>{`.aui-app-shell-chat-trigger-fixed, .aui-app-shell-chat-trigger-fixed * { transition: none !important; }`}</style>
              ) : null}
              <LiquidGlass
                onClick={() => {
                  if (suppressClickRef.current) return;
                  controls?.setOpen(true);
                }}
                cornerRadius={999}
                padding="6px 20px 6px 6px"
                blurAmount={0.14}
                // Near-flat displacement — the filter samples transparent black
                // past the pill's edge, so anything higher paints dark smudges
                // on the rounded ends.
                displacementScale={6}
                saturation={140}
                // Keep aberration subtle — against the contrast scrim, higher
                // values smear orange/blue fringes across the pill body.
                aberrationIntensity={0.6}
                elasticity={0.35}
                // The translucent scrim + hairline ring live on the glass
                // container (behind its backdrop-filter layer), so the blur
                // samples them and the pill keeps its frosted look while never
                // dissolving into busy or dark page backgrounds.
                // The library's heavy `.glass` drop shadow paints between the
                // scrim and the blur, so the blur smears it back into the pill
                // as gray side smudges — kill it and shadow the container.
                className="pointer-events-auto cursor-pointer rounded-full bg-white/85 ring-1 ring-black/10 shadow-lg dark:bg-zinc-950/55 dark:ring-white/15 [&_.glass]:!shadow-none"
                style={triggerAnchorStyle}
              >
                <div
                  className={cn(
                    "aui-copilot-trigger-handle flex items-center gap-2 bg-transparent",
                    canDrag && "select-none",
                  )}
                >
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
