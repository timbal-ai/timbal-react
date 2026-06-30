// =============================================================================
// Copilot subsystem — the self-contained floating assistant.
//
//   <AppCopilot workforceId="ops" />   ← drop-in, owns its own overlay + state
//
// Everything the assistant needs (panel chrome, trigger, runtime, history,
// context) lives here. `AppShell` is layout-only and does not wire chat.
// =============================================================================

export { AppCopilot, CopilotProvider } from "./app-copilot";
export type { AppCopilotProps, CopilotProviderProps } from "./app-copilot";

export { CopilotPanel } from "./copilot-panel";
export type { CopilotPanelProps } from "./copilot-panel";

export { CopilotOverlay } from "./copilot-overlay";
export type { CopilotOverlayProps } from "./copilot-overlay";

export {
  useCopilot,
  AppCopilotProvider,
  useAppCopilotContext,
} from "./context";
export type {
  CopilotControls,
  AppCopilotContextValue,
  AppCopilotProviderProps,
} from "./context";

export { SiriWave } from "./siri-wave";
export type { SiriWaveProps, SiriWaveVariant } from "./siri-wave";

// ── Deprecated aliases (removed next major) ──────────────────────────────────

/** @deprecated Renamed to {@link AppCopilot} (now self-mounting). */
export { AppCopilot as AppChatPanel } from "./app-copilot";
/** @deprecated Renamed to {@link AppCopilotProps}. */
export type { AppCopilotProps as AppChatPanelProps } from "./app-copilot";
/** @deprecated Use {@link useCopilot}. */
export { useAppShellChat } from "./context";
/** @deprecated Renamed to {@link CopilotControls}. */
export type { AppShellChatControls } from "./context";
