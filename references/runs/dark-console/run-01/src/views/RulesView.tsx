import { useState } from "react";
import {
  FilteredDataTable,
  Page,
  Sparkline,
  type DataTableColumn,
} from "@timbal-ai/timbal-react/app";
import { Switch } from "@timbal-ai/timbal-react/ui";

import {
  detectionRules,
  SEVERITY_LABEL,
  SEVERITY_RANK,
  type DetectionRule,
  type Severity,
} from "../data";
import { SeverityBadge } from "../components/SeverityBadge";

export function RulesView() {
  const [rules, setRules] = useState<DetectionRule[]>(detectionRules);

  const toggleRule = (id: string) =>
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );

  const columns: DataTableColumn<DetectionRule>[] = [
    {
      id: "name",
      header: "Rule",
      cell: (r) => r.name,
      sortable: true,
      sortValue: (r) => r.name,
      truncate: true,
    },
    {
      id: "id",
      header: "ID",
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.id}</span>,
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
    },
    {
      id: "hits",
      header: "Hits (24h)",
      cell: (r) => <span className="tabular-nums">{r.hits24h}</span>,
      align: "right",
      sortable: true,
      sortValue: (r) => r.hits24h,
    },
    {
      id: "trend",
      header: "Trend",
      cell: (r) => (
        <Sparkline
          data={r.trend}
          width={88}
          height={22}
          ariaLabel={`Hit trend for ${r.name}`}
        />
      ),
    },
    {
      id: "enabled",
      header: "Enabled",
      cell: (r) => (
        <Switch
          checked={r.enabled}
          onCheckedChange={() => toggleRule(r.id)}
          aria-label={`Toggle ${r.name}`}
        />
      ),
      align: "right",
    },
  ];

  const severityOptions = (Object.keys(SEVERITY_RANK) as Severity[]).map((s) => ({
    value: s,
    label: SEVERITY_LABEL[s],
  }));

  return (
    <Page
      title="Rules"
      description="Detection rules and 24-hour hit volume"
      density="compact"
    >
      <FilteredDataTable
        rows={rules}
        getRowKey={(r) => r.id}
        columns={columns}
        searchPlaceholder="Search rules…"
        searchPredicate={(r, q) =>
          `${r.name} ${r.id} ${r.source}`.toLowerCase().includes(q.toLowerCase())
        }
        filterFields={[
          {
            id: "severity",
            label: "Severity",
            type: "multiselect",
            options: severityOptions,
          },
          {
            id: "status",
            label: "Status",
            type: "multiselect",
            options: [
              { value: "enabled", label: "Enabled" },
              { value: "disabled", label: "Disabled" },
            ],
          },
        ]}
        getFilterValue={(r, fieldId) =>
          fieldId === "severity"
            ? r.severity
            : fieldId === "status"
              ? r.enabled
                ? "enabled"
                : "disabled"
              : undefined
        }
        defaultSort={{ columnId: "hits", direction: "desc" }}
        dense
        showRowCount
        rowCountLabel={(count) => `${count} rules`}
      />
    </Page>
  );
}
