"use client";

import { type FC, memo, useCallback, useMemo } from "react";

import { PillSegmentedTabs } from "../ui/pill-segmented-tabs";

/** Studio navigation mode — mirrors timbal-platform `STUDIO_NAV_MODE`. */
export const STUDIO_NAV_MODE = {
  BUILD: "build",
  OPERATE: "operate",
} as const;

export type StudioNavMode =
  (typeof STUDIO_NAV_MODE)[keyof typeof STUDIO_NAV_MODE];

export interface StudioModeSwitchProps {
  value: StudioNavMode;
  onChange: (mode: StudioNavMode) => void;
  className?: string;
  buildLabel?: string;
  manageLabel?: string;
  "aria-label"?: string;
}

/**
 * Build / Manage pill switch — same control as timbal-platform `StudioModeSwitch`.
 */
export const StudioModeSwitch: FC<StudioModeSwitchProps> = memo(
  function StudioModeSwitch({
    value,
    onChange,
    className,
    buildLabel = "Build",
    manageLabel = "Manage",
    "aria-label": ariaLabel = "Studio mode",
  }) {
    const tabs = useMemo(
      () => [
        { key: STUDIO_NAV_MODE.BUILD, label: buildLabel },
        { key: STUDIO_NAV_MODE.OPERATE, label: manageLabel },
      ],
      [buildLabel, manageLabel],
    );

    const handleChange = useCallback(
      (key: string) => {
        if (key === STUDIO_NAV_MODE.BUILD || key === STUDIO_NAV_MODE.OPERATE) {
          onChange(key);
        }
      },
      [onChange],
    );

    return (
      <div
        data-tour="studio-mode-switch"
        data-studio-chrome-align="mode-switch"
        id="studio-chrome-mode-switch"
        className={className}
      >
        <PillSegmentedTabs
          value={value}
          onChange={handleChange}
          tabs={tabs}
          trackVariant="flush"
          layoutId="studio-nav-mode-segmented"
          aria-label={ariaLabel}
        />
      </div>
    );
  },
);
