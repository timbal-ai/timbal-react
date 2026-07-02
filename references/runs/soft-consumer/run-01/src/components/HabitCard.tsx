import { SurfaceCard } from "@timbal-ai/timbal-react/app";
import { Button } from "@timbal-ai/timbal-react/ui";
import { Check } from "lucide-react";

import { CATEGORIES, type Habit } from "../data";

interface HabitCardProps {
  habit: Habit;
  done: boolean;
  onToggle: (id: string) => void;
}

/**
 * Bespoke (invention lane): a habit card with a per-category pastel wash and
 * an oversized round check. The wash is token-referential `color-mix` over
 * `--chart-N` (see CATEGORIES), the surface is a flat SurfaceCard with kit
 * elevation, and the toggle rides the kit Button — nothing hand-styled.
 */
export function HabitCard({ habit, done, onToggle }: HabitCardProps) {
  const category = CATEGORIES[habit.category];
  const streakLine =
    habit.streak > 1 ? `${habit.streak}-day streak` : "A fresh start";

  return (
    <SurfaceCard
      variant="flat"
      className={`${category.wash} shadow-card p-6 transition-opacity ${done ? "opacity-75" : ""}`}
    >
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <span className={`text-xs font-bold uppercase tracking-wide ${category.ink}`}>
            {category.label}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {habit.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {done ? "Done today" : habit.note} · {streakLine}
          </p>
        </div>
        <Button
          color={done ? "primary" : "secondary"}
          size="icon-lg"
          shape="pill"
          className="size-13 shrink-0"
          aria-pressed={done}
          aria-label={
            done
              ? `Mark ${habit.name} as not done`
              : `Mark ${habit.name} as done`
          }
          onClick={() => onToggle(habit.id)}
        >
          <Check className={done ? "size-5" : "size-5 opacity-40"} />
        </Button>
      </div>
    </SurfaceCard>
  );
}
