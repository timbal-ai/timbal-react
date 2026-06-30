"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK · SettingsLayout
// Stacked `SettingsSection`s + an optional danger zone + a floating save bar
// driven by a `dirty` flag. The canonical settings-page grammar, prop-driven.
//
// Forkable. Source: src/app/blocks/settings-layout.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { FC, ReactNode } from "react";

import { cn } from "../../utils";
import { SettingsSection } from "../settings/SettingsSection";
import { FloatingUnsavedChangesBar } from "../settings/FloatingUnsavedChangesBar";

export interface SettingsLayoutSection {
  /** Stable key. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Node under the description in the left rail (e.g. a CTA). */
  descriptionFooter?: ReactNode;
  children: ReactNode;
}

export interface SettingsLayoutProps {
  sections: SettingsLayoutSection[];
  /** Rendered after the sections, in its own bordered band (e.g. a `<DangerZone>`). */
  dangerZone?: ReactNode;
  /** Show the floating discard/save bar (raise on first edit). */
  dirty?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  saveLabel?: ReactNode;
  discardLabel?: ReactNode;
  unsavedMessage?: ReactNode;
  className?: string;
}

export const SettingsLayout: FC<SettingsLayoutProps> = ({
  sections,
  dangerZone,
  dirty = false,
  isSaving = false,
  onSave,
  onDiscard,
  saveLabel,
  discardLabel,
  unsavedMessage,
  className,
}) => (
  <div className={cn("flex flex-col", className)}>
    {sections.map((section, index) => (
      <SettingsSection
        key={section.id}
        title={section.title}
        description={section.description}
        descriptionFooter={section.descriptionFooter}
        noBorderTop={index === 0}
      >
        {section.children}
      </SettingsSection>
    ))}
    {dangerZone ? (
      <div className="border-t border-border py-6">{dangerZone}</div>
    ) : null}
    <FloatingUnsavedChangesBar
      visible={dirty}
      isSaving={isSaving}
      onSave={onSave}
      onDiscard={onDiscard}
      {...(saveLabel !== undefined ? { saveLabel } : {})}
      {...(discardLabel !== undefined ? { discardLabel } : {})}
      {...(unsavedMessage !== undefined ? { message: unsavedMessage } : {})}
    />
  </div>
);
