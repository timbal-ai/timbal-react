"use client";

import { LiquidMetal } from "@paper-design/shaders-react";

import { cn } from "../../utils";

const DEFAULT_SIZE = 64;
const TRANSPARENT_BACK = "#00000000";

/**
 * Inline Timbal symbol as a base64 data URI. Embedded so the library is
 * self-contained — consumers don't need to host the asset to use
 * `<TimbalMark />`.
 */
const TIMBAL_SYMBOL_DATA_URI =
  "data:image/png;base64,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";

export interface TimbalMarkProps {
  className?: string;
  /** Square size in CSS pixels (matches `--studio-chrome-pill-height` at 40). */
  size?: number;
  /**
   * Override the symbol shown inside the shader. Defaults to the embedded
   * Timbal mark — pass any image URL or data URI to brand the chat with
   * your own logo while keeping the liquid-metal motion.
   */
  src?: string;
}

/**
 * Timbal mark rendered with the Paper Design LiquidMetal shader.
 *
 * The Timbal symbol is embedded as a data URI so the library works without
 * the consumer having to host the asset. Pass `src` to use a custom logo.
 */
export function TimbalMark({
  className,
  size = DEFAULT_SIZE,
  src = TIMBAL_SYMBOL_DATA_URI,
}: TimbalMarkProps) {
  return (
    <div
      className={cn("relative shrink-0 bg-transparent", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Timbal"
    >
      <LiquidMetal
        width={size}
        height={size}
        image={src}
        colorBack={TRANSPARENT_BACK}
        colorTint="#ffffff"
        shape="none"
        repetition={2}
        softness={0.1}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.07}
        contour={0.4}
        angle={70}
        speed={1}
        scale={0.6}
        fit="contain"
        className="size-full bg-transparent"
        style={{ background: "transparent" }}
        webGlContextAttributes={{
          alpha: true,
          premultipliedAlpha: false,
        }}
      />
    </div>
  );
}
