import { useMemo, useState } from "react";
import {
  FilterField,
  MetricRow,
  Page,
  Stack,
  SurfaceCard,
} from "@timbal-ai/timbal-react/app";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timbal-ai/timbal-react/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MonthHeat } from "../components/MonthHeat";
import { HABITS, completionsOn, didComplete, isSameDay } from "../data";

interface MonthSummary {
  perfectDays: number;
  activeDays: number;
  completionRate: number;
  bestRun: number;
}

function summarize(
  month: Date,
  habitId: string,
  today: Date,
  todayDone: ReadonlySet<string>,
): MonthSummary {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const total = habitId === "all" ? HABITS.length : 1;

  let perfectDays = 0;
  let activeDays = 0;
  let checkIns = 0;
  let elapsed = 0;
  let run = 0;
  let bestRun = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    if (date > today && !isSameDay(date, today)) break;
    elapsed += 1;
    const count = isSameDay(date, today)
      ? habitId === "all"
        ? todayDone.size
        : todayDone.has(habitId)
          ? 1
          : 0
      : habitId === "all"
        ? completionsOn(date)
        : didComplete(habitId, date)
          ? 1
          : 0;
    checkIns += count;
    if (count > 0) activeDays += 1;
    if (count === total) {
      perfectDays += 1;
      run += 1;
      bestRun = Math.max(bestRun, run);
    } else {
      run = 0;
    }
  }

  const completionRate = elapsed === 0 ? 0 : Math.round((checkIns / (elapsed * total)) * 100);
  return { perfectDays, activeDays, completionRate, bestRun };
}

interface CalendarViewProps {
  doneIds: ReadonlySet<string>;
}

export function CalendarView({ doneIds }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [habitId, setHabitId] = useState("all");

  const month = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );
  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const summary = useMemo(
    () => summarize(month, habitId, today, doneIds),
    [month, habitId, today, doneIds],
  );

  return (
    <Page title="Calendar" description="A fuller day leaves a deeper tint.">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FilterField label="Ritual">
          <Select value={habitId} onValueChange={setHabitId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rituals</SelectItem>
              {HABITS.map((habit) => (
                <SelectItem key={habit.id} value={habit.id}>
                  {habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <Stack direction="horizontal" gap="sm" align="center">
          <Button
            color="tertiary"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonthOffset((offset) => offset - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold text-foreground">
            {monthLabel}
          </span>
          <Button
            color="tertiary"
            size="icon"
            aria-label="Next month"
            disabled={monthOffset >= 0}
            onClick={() => setMonthOffset((offset) => offset + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </Stack>
      </div>

      <SurfaceCard className="p-6">
        <MonthHeat month={month} habitId={habitId} today={today} todayDone={doneIds} />
      </SurfaceCard>

      <MetricRow
        metrics={[
          { id: "perfect", label: "Perfect days", value: String(summary.perfectDays) },
          { id: "active", label: "Days with at least one", value: String(summary.activeDays) },
          { id: "rate", label: "Completion", value: String(summary.completionRate), unit: "%" },
          { id: "run", label: "Best run", value: String(summary.bestRun), unit: summary.bestRun === 1 ? "day" : "days" },
        ]}
      />
    </Page>
  );
}
