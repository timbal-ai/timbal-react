import { useState } from "react";
import { AppShell } from "@timbal-ai/timbal-react/app";
import { StudioSidebar } from "@timbal-ai/timbal-react/studio";

import { articles } from "./data";
import { LibraryPage } from "./pages/LibraryPage";
import { HighlightsPage } from "./pages/HighlightsPage";
import { StatsPage } from "./pages/StatsPage";

type View = "library" | "highlights" | "stats";

// Text-first nav — no icons, per the quiet editorial rail.
const NAV_ITEMS = [
  { id: "library", name: "Library" },
  { id: "highlights", name: "Highlights" },
  { id: "stats", name: "Stats" },
];

export default function App() {
  const [view, setView] = useState<View>("library");
  const [articleId, setArticleId] = useState(articles[0].id);

  const openArticle = (id: string) => {
    setArticleId(id);
    setView("highlights");
  };

  return (
    <AppShell
      sidebar={
        <StudioSidebar
          brand={
            <span className="[font-family:var(--font-display)] text-base font-medium tracking-tight">
              Marginalia
            </span>
          }
          items={NAV_ITEMS}
          selectedId={view}
          onSelect={(id) => setView(id as View)}
        />
      }
    >
      {view === "library" && <LibraryPage onOpenArticle={openArticle} />}
      {view === "highlights" && (
        <HighlightsPage
          articleId={articleId}
          onArticleChange={setArticleId}
          onBackToLibrary={() => setView("library")}
        />
      )}
      {view === "stats" && <StatsPage />}
    </AppShell>
  );
}
