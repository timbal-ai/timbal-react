import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  FilterBar,
  FilterField,
  Page,
  SearchInput,
  StatusDot,
  useInterval,
  type DataTableColumn,
} from "@timbal-ai/timbal-react/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timbal-ai/timbal-react/ui";

import {
  createLiveEvent,
  formatTime,
  seedEvents,
  SEVERITY_LABEL,
  SEVERITY_RANK,
  type EventStatus,
  type SecurityEvent,
  type Severity,
} from "../data";
import { SeverityBadge } from "../components/SeverityBadge";
import { TriageDetail } from "../components/TriageDetail";

const MAX_ROWS = 80;

export function EventsView() {
  const [events, setEvents] = useState<SecurityEvent[]>(seedEvents);
  const [selectedId, setSelectedId] = useState<string | null>(seedEvents[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [paused, setPaused] = useState(false);

  useInterval(() => {
    setEvents((prev) => [createLiveEvent(), ...prev].slice(0, MAX_ROWS));
  }, paused ? null : 5_000);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (severity !== "all" && e.severity !== severity) return false;
      if (!q) return true;
      return [e.id, e.source, e.rule, e.host, e.user]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [events, query, severity]);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  const setStatus = (id: string, status: EventStatus) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));

  const columns: DataTableColumn<SecurityEvent>[] = [
    {
      id: "time",
      header: "Time",
      cell: (r) => (
        <span className="tabular-nums text-muted-foreground">{formatTime(r.time)}</span>
      ),
      sortable: true,
      sortValue: (r) => r.time,
      className: "whitespace-nowrap",
    },
    {
      id: "severity",
      header: "Severity",
      cell: (r) => <SeverityBadge severity={r.severity} />,
      sortable: true,
      sortValue: (r) => SEVERITY_RANK[r.severity],
    },
    {
      id: "source",
      header: "Source",
      cell: (r) => r.source,
      sortable: true,
      sortValue: (r) => r.source,
      truncate: true,
    },
    {
      id: "rule",
      header: "Rule",
      cell: (r) => r.rule,
      sortable: true,
      sortValue: (r) => r.rule,
      truncate: true,
    },
  ];

  return (
    <Page fill density="compact">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3 lg:px-6">
          <FilterBar>
            <SearchInput
              placeholder="Search events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <FilterField label="Severity">
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  {(Object.keys(SEVERITY_RANK) as Severity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <div className="ml-auto flex items-center gap-3">
              <StatusDot
                tone={paused ? "neutral" : "online"}
                label={paused ? "Paused" : "Live"}
                pulse={!paused}
              />
              <Button size="sm" color="secondary" onClick={() => setPaused((p) => !p)}>
                {paused ? "Resume" : "Pause"}
              </Button>
            </div>
          </FilterBar>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <DataTable
              columns={columns}
              rows={filtered}
              getRowKey={(r) => r.id}
              onRowClick={(r) => setSelectedId(r.id)}
              defaultSort={{ columnId: "time", direction: "desc" }}
              dense
              stickyHeader
              showRowCount
              rowCountLabel={(count) => `${count} events`}
              emptyTitle="No events match"
              emptyDescription="Try clearing the search or severity filter."
            />
          </div>
        </div>

        <aside className="hidden min-h-0 w-[380px] shrink-0 overflow-y-auto border-l border-border lg:block xl:w-[420px]">
          <TriageDetail
            event={selected}
            onAcknowledge={(id) => setStatus(id, "acknowledged")}
            onResolve={(id) => setStatus(id, "resolved")}
          />
        </aside>
      </div>
    </Page>
  );
}
