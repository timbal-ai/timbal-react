import { StatusBadge, type StatusBadgeTone } from "@timbal-ai/timbal-react/app";

import { SEVERITY_LABEL, type Severity } from "../data";

const SEVERITY_TONE: Record<Severity, StatusBadgeTone> = {
  critical: "danger",
  high: "warn",
  medium: "default",
  low: "muted",
};

/**
 * Shared severity pill — muted semantic tones (danger / warn / neutral /
 * muted), used by the events table, the triage pane, and the rules table.
 */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</StatusBadge>;
}
