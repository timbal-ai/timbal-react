import { useState } from "react";
import { AppShell } from "@timbal-ai/timbal-react/app";
import { StudioSidebar } from "@timbal-ai/timbal-react/studio";
import { articles } from "./data";
import { LibraryView } from "./views/library";
import { ArticleDetailView } from "./views/article-detail";
import { HighlightsView } from "./views/highlights";
import { StatsView } from "./views/stats";

type ViewId = "library" | "highlights" | "stats";

const NAV_ITEMS = [
  { id: "library", name: "Library" },
  { id: "highlights", name: "Highlights" },
  { id: "stats", name: "Stats" },
];

export default function App() {
  const [view, setView] = useState<ViewId>("library");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ?? null;

  const openArticle = (id: string) => {
    setView("library");
    setSelectedArticleId(id);
  };

  return (
    <AppShell
      sidebar={
        <StudioSidebar
          brand={
            <span className="text-base [font-family:var(--font-display)]">
              Marginalia
            </span>
          }
          items={NAV_ITEMS}
          selectedId={view}
          onSelect={(id) => {
            setView(id as ViewId);
            setSelectedArticleId(null);
          }}
        />
      }
    >
      {view === "library" &&
        (selectedArticle ? (
          <ArticleDetailView
            article={selectedArticle}
            onBack={() => setSelectedArticleId(null)}
          />
        ) : (
          <LibraryView onOpenArticle={setSelectedArticleId} />
        ))}
      {view === "highlights" && <HighlightsView onOpenArticle={openArticle} />}
      {view === "stats" && <StatsView />}
    </AppShell>
  );
}
