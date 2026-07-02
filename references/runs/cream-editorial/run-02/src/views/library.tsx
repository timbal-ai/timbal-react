import { useMemo, useState } from "react";
import {
  EmptyState,
  FilterBar,
  Page,
  SearchInput,
  Stack,
  SubNav,
} from "@timbal-ai/timbal-react/app";
import { articles, highlights } from "../data";
import { ArticleRow } from "../components/article-row";

type StatusFilter = "all" | "reading" | "finished";

interface LibraryViewProps {
  onOpenArticle: (id: string) => void;
}

export function LibraryView({ onOpenArticle }: LibraryViewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const highlightCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of highlights) {
      counts.set(h.articleId, (counts.get(h.articleId) ?? 0) + 1);
    }
    return counts;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (status !== "all" && article.status !== status) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.source.toLowerCase().includes(q) ||
        article.author.toLowerCase().includes(q)
      );
    });
  }, [query, status]);

  return (
    <Page
      title="Library"
      description="Everything you have saved to read, in one quiet place."
      width="centered"
    >
      <FilterBar>
        <SearchInput
          placeholder="Search titles, sources, authors"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        <SubNav
          aria-label="Filter by reading status"
          items={[
            { id: "all", label: "All" },
            { id: "reading", label: "In progress" },
            { id: "finished", label: "Finished" },
          ]}
          activeId={status}
          onChange={(id) => setStatus(id as StatusFilter)}
        />
      </FilterBar>
      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try a different search, or clear the status filter."
        />
      ) : (
        <Stack gap="lg">
          {visible.map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              highlightCount={highlightCounts.get(article.id) ?? 0}
              onOpen={onOpenArticle}
            />
          ))}
        </Stack>
      )}
    </Page>
  );
}
