import { useMemo } from "react";
import {
  Breadcrumbs,
  EmptyState,
  Page,
  Section,
  Stack,
} from "@timbal-ai/timbal-react/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timbal-ai/timbal-react/ui";

import { articles, highlights, type Highlight } from "../data";

function HighlightEntry({ highlight }: { highlight: Highlight }) {
  return (
    <figure>
      <blockquote className="border-l-2 border-primary/40 pl-5 [font-family:var(--font-display)] text-lg leading-relaxed text-foreground">
        {highlight.text}
      </blockquote>
      {highlight.note && (
        <p className="mt-3 pl-5 text-sm italic leading-relaxed text-muted-foreground">
          {highlight.note}
        </p>
      )}
      <figcaption className="mt-2 pl-5 text-xs text-muted-foreground">
        {highlight.location} · {highlight.date}
      </figcaption>
    </figure>
  );
}

export function HighlightsPage({
  articleId,
  onArticleChange,
  onBackToLibrary,
}: {
  articleId: string;
  onArticleChange: (id: string) => void;
  onBackToLibrary: () => void;
}) {
  const article = useMemo(
    () => articles.find((a) => a.id === articleId) ?? articles[0],
    [articleId],
  );
  const entries = useMemo(
    () => highlights.filter((h) => h.articleId === article.id),
    [article.id],
  );

  return (
    <Page
      width="prose"
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Library", onClick: onBackToLibrary }, { label: article.source }]}
        />
      }
      title={
        <span className="[font-family:var(--font-display)] font-medium tracking-tight">
          {article.title}
        </span>
      }
      description={`${article.author} · ${article.source} · ${article.readingTime} min read`}
      actions={
        <Select value={article.id} onValueChange={onArticleChange}>
          <SelectTrigger className="w-56" aria-label="Choose article">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {articles.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <Section
        title={
          <span className="[font-family:var(--font-display)] font-medium">Highlights</span>
        }
        description={
          entries.length > 0
            ? `${entries.length} ${entries.length === 1 ? "passage" : "passages"} saved`
            : undefined
        }
      >
        {entries.length > 0 ? (
          <Stack gap="xl">
            {entries.map((h) => (
              <HighlightEntry key={h.id} highlight={h} />
            ))}
          </Stack>
        ) : (
          <EmptyState
            title="No highlights yet"
            description="Passages you mark while reading will collect here, along with your margin notes."
          />
        )}
      </Section>
    </Page>
  );
}
