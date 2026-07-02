import { ChartPanel, LineAreaChart, MetricRow, Page } from "@timbal-ai/timbal-react/app";
import { highlightsByWeek, minutesByDay, readingStats } from "../data";

export function StatsView() {
  return (
    <Page
      title="Stats"
      description="A quiet ledger of the reading habit."
      width="centered"
    >
      <MetricRow
        metrics={[
          {
            id: "streak",
            label: "Reading streak",
            value: readingStats.streakDays,
            unit: "days",
          },
          {
            id: "minutes",
            label: "Minutes read this week",
            value: readingStats.minutesThisWeek,
            unit: "min",
          },
          {
            id: "highlights",
            label: "Highlights this week",
            value: readingStats.highlightsThisWeek,
          },
          {
            id: "finished",
            label: "Finished this month",
            value: readingStats.articlesFinishedThisMonth,
          },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Minutes read"
          description="Daily reading time over the last two weeks."
        >
          <LineAreaChart
            data={minutesByDay}
            xKey="day"
            series={[{ dataKey: "minutes", label: "Minutes" }]}
            variant="area"
            layout="flush"
            ariaLabel="Minutes read per day over the last fourteen days"
          />
        </ChartPanel>
        <ChartPanel
          title="Highlights per week"
          description="Passages marked each week over the last two months."
        >
          <LineAreaChart
            data={highlightsByWeek}
            xKey="week"
            series={[{ dataKey: "highlightCount", label: "Highlights" }]}
            variant="bar"
            layout="flush"
            ariaLabel="Highlights saved per week over the last eight weeks"
          />
        </ChartPanel>
      </div>
    </Page>
  );
}
