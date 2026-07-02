import { Button, EmptyState, Page, Section, Stack } from "@timbal-ai/timbal-react/app";
import { articles, highlights } from "../data";
import { HighlightQuote } from "../components/highlight-quote";

interface HighlightsViewProps {
  onOpenArticle: (id: string) => void;
}

export function HighlightsView({ onOpenArticle }: HighlightsViewProps) {
  const groups = articles
    .map((article) => ({
      article,
      items: highlights.filter((h) => h.articleId === article.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Page
      title="Highlights"
      description="Every passage you have marked, gathered by article."
      width="prose"
    >
      {groups.length === 0 ? (
        <EmptyState
          title="No highlights yet"
          description="Highlights you save while reading will gather here."
        />
      ) : (
        groups.map(({ article, items }) => (
          <Section
            key={article.id}
            title={article.title}
            description={`${article.source} · ${items.length} highlight${
              items.length === 1 ? "" : "s"
            }`}
            actions={
              <Button color="link" onClick={() => onOpenArticle(article.id)}>
                Open article
              </Button>
            }
          >
            <Stack gap="lg">
              {items.map((h) => (
                <HighlightQuote key={h.id} note={h.note} meta={`Saved ${h.savedAt}`}>
                  {h.text}
                </HighlightQuote>
              ))}
            </Stack>
          </Section>
        ))
      )}
    </Page>
  );
}
