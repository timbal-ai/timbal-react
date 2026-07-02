import { useState } from "react";
import { AppShell } from "@timbal-ai/timbal-react/app";
import { StudioSidebar } from "@timbal-ai/timbal-react/studio";
import { Activity, ScrollText, ShieldCheck } from "lucide-react";

import { OverviewView } from "./views/OverviewView";
import { EventsView } from "./views/EventsView";
import { RulesView } from "./views/RulesView";

type View = "overview" | "events" | "rules";

const NAV_ITEMS = [
  { id: "overview", name: "Overview", icon: <Activity /> },
  { id: "events", name: "Events", icon: <ScrollText /> },
  { id: "rules", name: "Rules", icon: <ShieldCheck /> },
];

export default function App() {
  const [view, setView] = useState<View>("overview");

  return (
    <AppShell
      contentFill={view === "events"}
      sidebar={
        <StudioSidebar
          brand={<span className="text-sm font-semibold">Log Sentinel</span>}
          items={NAV_ITEMS}
          selectedId={view}
          onSelect={(id) => setView(id as View)}
        />
      }
    >
      {view === "overview" && <OverviewView />}
      {view === "events" && <EventsView />}
      {view === "rules" && <RulesView />}
    </AppShell>
  );
}
