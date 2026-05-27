"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  STUDIO_SIDEBAR_ENTRIES_OUT_S,
  STUDIO_SIDEBAR_EXPAND_REVEAL_FRAC,
  STUDIO_SIDEBAR_WIDTH_S,
} from "../design/sidebar-motion";

/** Start width while entries finish exiting. */
const WIDTH_OVERLAP_FRAC = 0.7;

/**
 * Three-phase sidebar collapse / expand orchestration:
 *
 * - Collapse: fade entries out → contract width → fade entries in (rail).
 * - Expand:   fade entries out → expand width → fade entries in (expanded).
 *
 * Returns state + callbacks the host wires into the panel + entries
 * components. `widthCollapsed` drives the `motion.div` width animation;
 * `entriesVisible` drives the staggered fade orchestrator.
 */
export function useSidebarCollapsePhase(
  collapsed: boolean,
  reducedMotion: boolean,
) {
  const [widthCollapsed, setWidthCollapsed] = useState(collapsed);
  const [entriesVisible, setEntriesVisible] = useState(true);
  const collapsedTarget = useRef(collapsed);
  const isFirstRender = useRef(true);
  const widthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    collapsedTarget.current = collapsed;
  }, [collapsed]);

  const clearWidthTimer = () => {
    if (widthTimerRef.current !== null) {
      clearTimeout(widthTimerRef.current);
      widthTimerRef.current = null;
    }
  };

  const clearRevealTimer = () => {
    if (revealTimerRef.current !== null) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  const applyWidthTarget = useCallback(() => {
    const willExpand = !collapsedTarget.current;
    setWidthCollapsed(collapsedTarget.current);

    clearRevealTimer();
    if (willExpand && !reducedMotion) {
      revealTimerRef.current = setTimeout(
        () => setEntriesVisible(true),
        STUDIO_SIDEBAR_WIDTH_S * 1000 * STUDIO_SIDEBAR_EXPAND_REVEAL_FRAC,
      );
    }
  }, [reducedMotion]);

  useEffect(() => {
    clearWidthTimer();
    clearRevealTimer();

    if (reducedMotion) {
      setWidthCollapsed(collapsed);
      setEntriesVisible(true);
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      setWidthCollapsed(collapsed);
      setEntriesVisible(true);
      return;
    }

    setEntriesVisible(false);
    widthTimerRef.current = setTimeout(
      applyWidthTarget,
      STUDIO_SIDEBAR_ENTRIES_OUT_S * 1000 * WIDTH_OVERLAP_FRAC,
    );

    return () => {
      clearWidthTimer();
      clearRevealTimer();
    };
  }, [collapsed, reducedMotion, applyWidthTarget]);

  const onEntriesBlurOutComplete = useCallback(() => {
    applyWidthTarget();
  }, [applyWidthTarget]);

  const onPanelWidthComplete = useCallback(() => {
    clearRevealTimer();
    setEntriesVisible(true);
  }, []);

  const isCollapsedRail = widthCollapsed;

  return {
    widthCollapsed,
    isCollapsedRail,
    entriesVisible,
    onEntriesBlurOutComplete,
    onPanelWidthComplete,
  };
}

export type SidebarCollapsePhaseApi = ReturnType<typeof useSidebarCollapsePhase>;
