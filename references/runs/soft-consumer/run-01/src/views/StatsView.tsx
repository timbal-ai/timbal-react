import { useMemo } from "react";
import {
  ChartPanel,
  LineAreaChart,
  MetricRow,
  Page,
  RadialChart,
} from "@timbal-ai/timbal-react/app";

import { HABITS, completionsOn, didComplete } from "../data";

function daysAgo(from: Date, days: number): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

export function StatsView() {
  const today = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    // Last 12 full-ish weeks of completion %, oldest first.
    const weeklyTrend: Array<{ week: string; pct: number }> = [];
    for (let w = 11; w >= 0; w -= 1) {
      let checkIns = 0;
      for (let d = 0; d < 7; d += 1) {
        checkIns += completionsOn(daysAgo(today, w * 7 + d));
      }
      const start = daysAgo(today, w * 7 + 6);
      weeklyTrend.push({
        week: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        pct: Math.round((checkIns / (7 * HABITS.length)) * 100),
      });
    }

    // Share of days each ritual happened, over the last 30 days.
    const byHabit = HABITS.map((habit) => {
      let count = 0;
      for (let d = 0; d < 30; d += 1) {
        if (didComplete(habit.id, daysAgo(today, d))) count += 1;
      }
      return { ritual: habit.name, pct: Math.round((count / 30) * 100) };
    }).sort((a, b) => b.pct - a.pct);

    // Check-ins by weekday over the last 8 weeks, Monday first.
    const weekdayTotals = new Array<number>(7).fill(0);
    for (let d = 0; d < 56; d += 1) {
      const date = daysAgo(today, d);
      weekdayTotals[(date.getDay() + 6) % 7] += completionsOn(date);
    }
    const weekdayRhythm = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, index) => ({ day, checkIns: weekdayTotals[index] }),
    );

    // Headline numbers.
    let weekCheckIns = 0;
    for (let d = 0; d < 7; d += 1) weekCheckIns += completionsOn(daysAgo(today, d));
    const thisWeekPct = Math.round((weekCheckIns / (7 * HABITS.length)) * 100);
    let monthCheckIns = 0;
    for (let d = 0; d < 30; d += 1) monthCheckIns += completionsOn(daysAgo(today, d));
    const bestStreak = Math.max(...HABITS.map((habit) => habit.streak));
    const overallPct = Math.round(
      byHabit.reduce((sum, h) => sum + h.pct, 0) / byHabit.length,
    );

    return { weeklyTrend, byHabit, weekdayRhythm, thisWeekPct, monthCheckIns, bestStreak, overallPct };
  }, [today]);

  return (
    <Page title="Stats" description="Gentle numbers — patterns, not judgement.">
      <MetricRow
        metrics={[
          { id: "streak", label: "Longest current streak", value: String(stats.bestStreak), unit: "days" },
          { id: "week", label: "This week", value: String(stats.thisWeekPct), unit: "%" },
          { id: "month", label: "Check-ins, last 30 days", value: String(stats.monthCheckIns) },
          { id: "rituals", label: "Rituals in rotation", value: String(HABITS.length) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartPanel
          title="Twelve gentle weeks"
          description="Weekly completion, all rituals together"
          className="lg:col-span-2"
        >
          <LineAreaChart
            data={stats.weeklyTrend}
            xKey="week"
            series={[{ dataKey: "pct", label: "Completion" }]}
            variant="area"
            unit="%"
            yMax={100}
            height={280}
            ariaLabel="Weekly completion percentage over the last twelve weeks"
          />
        </ChartPanel>

        <ChartPanel title="Each ritual's month" description="Share of the last 30 days">
          <RadialChart
            data={stats.byHabit}
            nameKey="ritual"
            dataKey="pct"
            maxValue={100}
            centerValue={`${stats.overallPct}%`}
            centerLabel="together"
            height={280}
            ariaLabel="Completion share per ritual over the last 30 days"
          />
        </ChartPanel>
      </div>

      <ChartPanel title="Weekly rhythm" description="Check-ins by weekday, last 8 weeks">
        <LineAreaChart
          data={stats.weekdayRhythm}
          xKey="day"
          series={[{ dataKey: "checkIns", label: "Check-ins" }]}
          variant="bar"
          height={240}
          ariaLabel="Total check-ins by weekday over the last eight weeks"
        />
      </ChartPanel>
    </Page>
  );
}
