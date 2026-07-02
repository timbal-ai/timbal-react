import { Stack, StatusDot } from "@timbal-ai/timbal-react/app";

import type { SourceHealth } from "../data";

/**
 * Bespoke: compact ingest-pipeline health list (source + liveness dot +
 * events/min). No catalog block has this per-row anatomy; composed from kit
 * primitives on semantic tokens only.
 */
export function SourceHealthList({ sources }: { sources: SourceHealth[] }) {
  const reporting = sources.filter((s) => s.status !== "offline").length;
  return (
    <Stack gap="sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">Ingest pipeline</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {reporting}/{sources.length} reporting
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {sources.map((source) => (
          <li key={source.id} className="flex items-center justify-between gap-3">
            <StatusDot
              tone={source.status}
              pulse={source.status === "online"}
              label={<span className="text-sm text-foreground">{source.name}</span>}
            />
            <span className="text-xs tabular-nums text-muted-foreground">
              {source.epm} ev/min
            </span>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
