import {
  ChartPanel,
  LineAreaChart,
  MetricRow,
  Page,
  PieChart,
  StatusDot,
  SurfaceCard,
} from "@timbal-ai/timbal-react/app";

import {
  currentEpm,
  epmSparkline,
  eventsPerMinute,
  severitySplit,
  severityTotal,
  sourceHealth,
  topRules,
} from "../data";
import { SourceHealthList } from "../components/SourceHealthList";

/** Aligned to severitySplit order: Critical, High, Medium, Low. */
const SEVERITY_SLICE_COLORS = [
  "var(--destructive)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-4)",
];

export function OverviewView() {
  const reporting = sourceHealth.filter((s) => s.status !== "offline").length;

  return (
    <Page
      title="Overview"
      description="Security events across all connected sources"
      density="compact"
      actions={<StatusDot tone="online" label="Ingest live" pulse />}
    >
      <MetricRow
        metrics={[
          {
            id: "epm",
            label: "Events / min",
            value: <span className="tabular-nums">{currentEpm}</span>,
            sparklineData: epmSparkline,
          },
          {
            id: "open",
            label: "Open alerts",
            value: <span className="tabular-nums">37</span>,
          },
          {
            id: "critical",
            label: "Critical (24h)",
            value: <span className="tabular-nums">9</span>,
            trend: "+3 vs prior day",
            trendTone: "neutral",
            trendVariant: "inline",
          },
          {
            id: "sources",
            label: "Sources reporting",
            value: (
              <span className="tabular-nums">
                {reporting}/{sourceHealth.length}
              </span>
            ),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel
          title="Events per minute"
          description="Last 60 minutes"
          className="lg:col-span-2"
        >
          <LineAreaChart
            data={eventsPerMinute}
            xKey="t"
            series={[{ dataKey: "events", label: "Events" }]}
            variant="area"
            layout="flush"
            height={220}
            ariaLabel="Events per minute over the last hour"
          />
        </ChartPanel>

        <ChartPanel title="Severity split" description="Last 24 hours">
          <PieChart
            data={severitySplit}
            nameKey="severity"
            dataKey="count"
            innerRadius={0.62}
            centerValue={
              <span className="tabular-nums">{severityTotal.toLocaleString()}</span>
            }
            centerLabel="events"
            colors={SEVERITY_SLICE_COLORS}
            height={220}
            ariaLabel="Event count by severity over the last 24 hours"
          />
        </ChartPanel>

        <ChartPanel
          title="Top rules"
          description="Events per rule, last 24 hours"
          className="lg:col-span-2"
        >
          <LineAreaChart
            data={topRules}
            xKey="rule"
            series={[{ dataKey: "count", label: "Events" }]}
            variant="bar"
            orientation="horizontal"
            height={220}
            showLegend={false}
            ariaLabel="Top detection rules by event count"
          />
        </ChartPanel>

        <SurfaceCard>
          <SourceHealthList sources={sourceHealth} />
        </SurfaceCard>
      </div>
    </Page>
  );
}
