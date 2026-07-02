import { useState } from "react";
import { AppShell } from "@timbal-ai/timbal-react/app";
import { StudioSidebar } from "@timbal-ai/timbal-react/studio";
import { CalendarDays, Sparkles, Sun } from "lucide-react";

import { INITIALLY_DONE } from "./data";
import { CalendarView } from "./views/CalendarView";
import { StatsView } from "./views/StatsView";
import { TodayView } from "./views/TodayView";

type ViewId = "today" | "calendar" | "stats";

export default function App() {
  const [view, setView] = useState<ViewId>("today");
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(
    () => new Set(INITIALLY_DONE),
  );

  const toggleHabit = (id: string) => {
    setDoneIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AppShell
      sidebar={
        <StudioSidebar
          brand={<span className="text-lg font-bold text-foreground">Ritual</span>}
          items={[
            { id: "today", name: "Today", icon: <Sun /> },
            { id: "calendar", name: "Calendar", icon: <CalendarDays /> },
            { id: "stats", name: "Stats", icon: <Sparkles /> },
          ]}
          selectedId={view}
          onSelect={(id) => setView(id as ViewId)}
        />
      }
    >
      {view === "today" && <TodayView doneIds={doneIds} onToggle={toggleHabit} />}
      {view === "calendar" && <CalendarView doneIds={doneIds} />}
      {view === "stats" && <StatsView />}
    </AppShell>
  );
}
