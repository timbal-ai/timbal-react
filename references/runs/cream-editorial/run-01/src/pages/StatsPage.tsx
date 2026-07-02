import {
  ChartPanel,
  LineAreaChart,
  MetricRow,
  Page,
  Section,
  Timeline,
} from "@timbal-ai/timbal-react/app";

import { highlightsByWeek, minutesByDay, readingActivity } from "../data";

export function StatsPage() {
  return (
    <Page
      title={
        <span className="[font-family:var(--font-display)] font-medium tracking-tight">
          Stats
        </span>
      }
      description="Your reading, quietly counted."
    >
      <MetricRow
        metrics={[
          { id: "streak", label: "Reading streak", value: "18", unit: "days" },
          { id: "minutes", label: "Minutes this week", value: "211", unit: "min" },
          { id: "highlights", label: "Highlights this week", value: "23" },
          { id: "finished", label: "Finished this month", value: "4" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Minutes read" description="Last 14 days">
          <LineAreaChart
            data={minutesByDay}
            xKey="day"
            series={[{ dataKey: "minutes", label: "Minutes" }]}
            variant="area"
            layout="flush"
            height={260}
            ariaLabel="Minutes read per day over the last two weeks"
          />
        </ChartPanel>
        <ChartPanel title="Highlights per week" description="Last 8 weeks">
          <LineAreaChart
            data={highlightsByWeek}
            xKey="week"
            series={[{ dataKey: "count", label: "Highlights" }]}
            variant="bar"
            layout="flush"
            height={260}
            ariaLabel="Highlights saved per week over the last eight weeks"
          />
        </ChartPanel>
      </div>
      <Section
        title={
          <span className="[font-family:var(--font-display)] font-medium">Recent activity</span>
        }
      >
        <Timeline items={readingActivity} />
      </Section>
    </Page>
  );
}
