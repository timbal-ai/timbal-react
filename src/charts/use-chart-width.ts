"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Track a container's pixel width with `ResizeObserver` (no extra deps). The
 * chart renders into a fixed-coordinate SVG and uses this only for the hover
 * pixel→data mapping and label spacing — never for layout reflow loops.
 */
export function useChartWidth(initial = 640): {
  ref: React.RefObject<HTMLDivElement | null>;
  width: number;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
