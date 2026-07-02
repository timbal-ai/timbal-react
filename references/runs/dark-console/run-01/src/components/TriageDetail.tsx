import {
  Button,
  DescriptionList,
  EmptyState,
  Stack,
  StatusBadge,
  Timeline,
  type StatusBadgeTone,
} from "@timbal-ai/timbal-react/app";

import { formatTime, type EventStatus, type SecurityEvent } from "../data";
import { SeverityBadge } from "./SeverityBadge";

const STATUS_LABEL: Record<EventStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const STATUS_TONE: Record<EventStatus, StatusBadgeTone> = {
  open: "primary",
  acknowledged: "default",
  resolved: "muted",
};

interface TriageDetailProps {
  event: SecurityEvent | null;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

/**
 * Bespoke: triage detail pane for the selected event — badges, actions,
 * metadata, raw payload, and an activity timeline. Composed from kit
 * primitives (DescriptionList, Timeline, Button, StatusBadge) on semantic
 * tokens; no catalog block covers this anatomy.
 */
export function TriageDetail({ event, onAcknowledge, onResolve }: TriageDetailProps) {
  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          variant="compact"
          title="No event selected"
          description="Select a row in the stream to open triage."
        />
      </div>
    );
  }

  const activity = [
    {
      id: `${event.id}-matched`,
      title: "Rule matched",
      description: `${event.rule} (${event.ruleId}) fired on ${event.source}.`,
      meta: <span className="tabular-nums">{formatTime(event.time)}</span>,
    },
    {
      id: `${event.id}-created`,
      title: "Alert created",
      description: "Event queued for analyst triage.",
      meta: <span className="tabular-nums">{formatTime(event.time)}</span>,
    },
    ...(event.status !== "open"
      ? [
          {
            id: `${event.id}-status`,
            title: STATUS_LABEL[event.status],
            description:
              event.status === "resolved"
                ? "Closed by analyst — no further action."
                : "Analyst is investigating.",
            meta: <span className="tabular-nums">{formatTime(Date.now())}</span>,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-4 lg:px-5">
      <Stack gap="sm">
        <Stack direction="horizontal" gap="sm" align="center">
          <SeverityBadge severity={event.severity} />
          <StatusBadge tone={STATUS_TONE[event.status]}>
            {STATUS_LABEL[event.status]}
          </StatusBadge>
        </Stack>
        <h2 className="text-sm font-medium text-foreground">{event.rule}</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{event.message}</p>
      </Stack>

      <Stack direction="horizontal" gap="sm">
        <Button
          size="sm"
          color="primary"
          disabled={event.status !== "open"}
          onClick={() => onAcknowledge(event.id)}
        >
          Acknowledge
        </Button>
        <Button
          size="sm"
          color="secondary"
          disabled={event.status === "resolved"}
          onClick={() => onResolve(event.id)}
        >
          Resolve
        </Button>
      </Stack>

      <DescriptionList
        items={[
          { label: "Event ID", value: <span className="tabular-nums">{event.id}</span> },
          {
            label: "Detected",
            value: <span className="tabular-nums">{formatTime(event.time)}</span>,
          },
          { label: "Source", value: event.source },
          { label: "Rule ID", value: <span className="tabular-nums">{event.ruleId}</span> },
          { label: "Host", value: event.host },
          { label: "User", value: event.user },
        ]}
      />

      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Raw event</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {event.raw}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Activity</h3>
        <Timeline size="sm" items={activity} />
      </div>
    </div>
  );
}
