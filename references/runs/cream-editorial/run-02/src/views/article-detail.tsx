import {
  Breadcrumbs,
  Button,
  EmptyState,
  Page,
  Section,
  Stack,
} from "@timbal-ai/timbal-react/app";
import type { Article } from "../data";
import { highlights } from "../data";
import { HighlightQuote } from "../components/highlight-quote";
import { ReadingProgress } from "../components/reading-progress";

interface ArticleDetailViewProps {
  article: Article;
  onBack: () => void;
}

export function ArticleDetailView({ article, onBack }: ArticleDetailViewProps) {
  const articleHighlights = highlights.filter((h) => h.articleId === article.id);

  return (
    <Page
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Library", onClick: onBack }, { label: article.title }]}
        />
      }
      title={article.title}
      description={`${article.source} · ${article.author} · ${article.readingMinutes} min read · added ${article.addedAt}`}
      actions={
        <Button color="primary">
          {article.status === "finished" ? "Read again" : "Continue reading"}
        </Button>
      }
      width="prose"
    >
      <ReadingProgress
        value={article.progress}
        status={article.status}
        ariaLabel={`Reading progress for ${article.title}`}
      />
      <Section
        title="Highlights"
        description={
          articleHighlights.length > 0
            ? `${articleHighlights.length} passage${
                articleHighlights.length === 1 ? "" : "s"
              } marked while reading.`
            : undefined
        }
      >
        {articleHighlights.length === 0 ? (
          <EmptyState
            title="No highlights yet"
            description="Passages you mark while reading will collect here."
          />
        ) : (
          <Stack gap="lg">
            {articleHighlights.map((h) => (
              <HighlightQuote key={h.id} note={h.note} meta={`Saved ${h.savedAt}`}>
                {h.text}
              </HighlightQuote>
            ))}
          </Stack>
        )}
      </Section>
    </Page>
  );
}
