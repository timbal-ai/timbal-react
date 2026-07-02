import { HABITS, completionsOn, didComplete, isSameDay } from "../data";

/**
 * Bespoke (invention lane): a month-grid heat view. No catalog block ships a
 * calendar heatmap, so this composes plain grid markup on semantic tokens.
 * Heat levels are token-referential `color-mix` washes over `--primary`, so
 * the whole gradient re-derives from the theme.
 */

const HEAT_LEVELS = [
  "bg-[color-mix(in_oklab,var(--foreground)_5%,var(--background))] text-muted-foreground",
  "bg-[color-mix(in_oklab,var(--primary)_18%,var(--card))] text-foreground",
  "bg-[color-mix(in_oklab,var(--primary)_36%,var(--card))] text-foreground",
  "bg-[color-mix(in_oklab,var(--primary)_56%,var(--card))] text-primary-foreground",
  "bg-[color-mix(in_oklab,var(--primary)_78%,var(--card))] text-primary-foreground",
];

const FUTURE_CELL =
  "bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))] text-muted-foreground opacity-45";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthHeatProps {
  /** Any date inside the month to render. */
  month: Date;
  /** `"all"` or a habit id. */
  habitId: string;
  today: Date;
  /** Live check-offs for today, so the heat agrees with the Today view. */
  todayDone: ReadonlySet<string>;
}

interface DayCell {
  date: Date;
  count: number;
  total: number;
  level: number;
  future: boolean;
}

function buildCells(
  month: Date,
  habitId: string,
  today: Date,
  todayDone: ReadonlySet<string>,
): Array<DayCell | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // Monday-first offset for the leading blanks.
  const lead = (first.getDay() + 6) % 7;
  const total = habitId === "all" ? HABITS.length : 1;

  const cells: Array<DayCell | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const future = date > today && !isSameDay(date, today);
    let count = 0;
    if (isSameDay(date, today)) {
      count = habitId === "all" ? todayDone.size : todayDone.has(habitId) ? 1 : 0;
    } else if (!future) {
      count =
        habitId === "all"
          ? completionsOn(date)
          : didComplete(habitId, date)
            ? 1
            : 0;
    }
    const level =
      count === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((count / total) * 4)));
    cells.push({ date, count, total, level, future });
  }
  return cells;
}

export function MonthHeat({ month, habitId, today, todayDone }: MonthHeatProps) {
  const cells = buildCells(month, habitId, today, todayDone);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-1 text-center text-xs font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {cells.map((cell, index) =>
          cell === null ? (
            <div key={`blank-${index}`} aria-hidden />
          ) : (
            <div
              key={cell.date.toISOString()}
              className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold ${
                cell.future ? FUTURE_CELL : HEAT_LEVELS[cell.level]
              } ${isSameDay(cell.date, today) ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
              title={
                cell.future
                  ? undefined
                  : `${cell.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })} — ${cell.count} of ${cell.total} complete`
              }
              aria-label={
                cell.future
                  ? `${cell.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, upcoming`
                  : `${cell.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${cell.count} of ${cell.total} complete`
              }
            >
              {cell.date.getDate()}
            </div>
          ),
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {HEAT_LEVELS.map((level) => (
          <span key={level} className={`size-4 rounded-md ${level.split(" ")[0]}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
