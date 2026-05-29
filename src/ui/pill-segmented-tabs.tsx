"use client";

import {
  type FC,
  type ReactNode,
  memo,
  useCallback,
  useId,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  pillSegmentedActiveIndicatorClass,
  pillSegmentedFlushSegmentClass,
  pillSegmentedSegmentClass,
  pillSegmentedTrackClass,
  pillSegmentedTrackFlushClass,
} from "../design/pill-segmented-classes";
import { cn } from "../utils";

export interface PillSegmentedTab {
  key: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface PillSegmentedTabsProps {
  value: string;
  onChange: (key: string) => void;
  tabs: PillSegmentedTab[];
  className?: string;
  /** `flush` — Studio topbar / dashboard tabs (Build/Manage). */
  trackVariant?: "default" | "flush";
  /** Unique per instance when multiple controls share a page (motion layout). */
  layoutId?: string;
  "aria-label"?: string;
}

const PillTab: FC<{
  tabKey: string;
  label: ReactNode;
  isActive: boolean;
  disabled?: boolean;
  onSelect: (key: string) => void;
  layoutId: string;
  segmentClassName: string;
  animateIndicator: boolean;
}> = ({
  tabKey,
  label,
  isActive,
  disabled,
  onSelect,
  layoutId,
  segmentClassName,
  animateIndicator,
}) => {
  const handlePress = useCallback(() => {
    if (!disabled) onSelect(tabKey);
  }, [disabled, onSelect, tabKey]);

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled}
      aria-pressed={isActive}
      className={cn(
        segmentClassName,
        disabled && "cursor-not-allowed opacity-50",
        !disabled &&
          (isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"),
      )}
    >
      {isActive && animateIndicator ? (
        <motion.div
          layoutId={layoutId}
          className={pillSegmentedActiveIndicatorClass}
          transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
        />
      ) : isActive ? (
        <div className={pillSegmentedActiveIndicatorClass} aria-hidden />
      ) : null}
      <span className="relative z-10 whitespace-nowrap">{label}</span>
    </button>
  );
};

/**
 * Pill-in-pill segmented control — same visual language as timbal-platform
 * `WorkshopPillSegmentedTabs` (Build/Manage, Home Builder tabs).
 */
export const PillSegmentedTabs: FC<PillSegmentedTabsProps> = ({
  value,
  onChange,
  tabs,
  className,
  trackVariant = "default",
  layoutId: layoutIdProp,
  "aria-label": ariaLabel,
}) => {
  const reactId = useId();
  const layoutId =
    layoutIdProp ?? `pill-segmented-${reactId.replace(/:/g, "")}`;
  const reducedMotion = useReducedMotion();
  const isFlush = trackVariant === "flush";
  const trackClass = isFlush ? pillSegmentedTrackFlushClass : pillSegmentedTrackClass;
  const segmentClassName = isFlush
    ? pillSegmentedFlushSegmentClass
    : pillSegmentedSegmentClass;

  return (
    <div role="group" aria-label={ariaLabel} className={cn(trackClass, className)}>
      {tabs.map((tab) => (
        <PillTab
          key={tab.key}
          tabKey={tab.key}
          label={tab.label}
          disabled={tab.disabled}
          isActive={value === tab.key}
          onSelect={onChange}
          layoutId={layoutId}
          segmentClassName={segmentClassName}
          animateIndicator={!reducedMotion}
        />
      ))}
    </div>
  );
};

export const MemoPillSegmentedTabs = memo(PillSegmentedTabs);
