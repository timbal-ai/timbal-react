import {
  EmptyState,
  Page,
  Section,
  Stack,
  SurfaceCard,
} from "@timbal-ai/timbal-react/app";
import { Button, CircularProgress } from "@timbal-ai/timbal-react/ui";

import { HabitCard } from "../components/HabitCard";
import { HABITS } from "../data";

interface TodayViewProps {
  doneIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

function encouragement(done: number, total: number): { headline: string; sub: string } {
  if (done === 0) {
    return {
      headline: "A fresh page",
      sub: "Nothing checked yet — start with the smallest one.",
    };
  }
  if (done < total / 2) {
    return {
      headline: "Gently under way",
      sub: "One ritual at a time. There's no rush.",
    };
  }
  if (done < total) {
    return {
      headline: "Over halfway there",
      sub: "Lovely pace — the rest of the day is yours.",
    };
  }
  return {
    headline: "Everything, done",
    sub: "Every ritual complete. Enjoy the calm.",
  };
}

export function TodayView({ doneIds, onToggle }: TodayViewProps) {
  const remaining = HABITS.filter((habit) => !doneIds.has(habit.id));
  const done = HABITS.filter((habit) => doneIds.has(habit.id));
  const copy = encouragement(done.length, HABITS.length);
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Page
      title="Today"
      description={dateLabel}
      actions={<Button color="secondary">New ritual</Button>}
    >
      <SurfaceCard className="p-6">
        <Stack direction="horizontal" gap="lg" align="center">
          <CircularProgress
            value={done.length}
            max={HABITS.length}
            size={76}
            thickness={7}
            showLabel
            label={`${done.length}/${HABITS.length}`}
          />
          <div>
            <p className="text-lg font-semibold text-foreground">{copy.headline}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{copy.sub}</p>
          </div>
        </Stack>
      </SurfaceCard>

      {remaining.length > 0 ? (
        <Section title="Still to come">
          <div className="grid gap-5 md:grid-cols-2">
            {remaining.map((habit) => (
              <HabitCard key={habit.id} habit={habit} done={false} onToggle={onToggle} />
            ))}
          </div>
        </Section>
      ) : (
        <EmptyState
          title="All done for today"
          description="Tomorrow is another fresh page. Rest well."
        />
      )}

      {done.length > 0 && (
        <Section title="Completed">
          <div className="grid gap-5 md:grid-cols-2">
            {done.map((habit) => (
              <HabitCard key={habit.id} habit={habit} done onToggle={onToggle} />
            ))}
          </div>
        </Section>
      )}
    </Page>
  );
}
