import { Stack, SurfaceCard } from "@timbal-ai/timbal-react/app";
import type { Article } from "../data";
import { ReadingProgress } from "./reading-progress";

interface ArticleRowProps {
  article: Article;
  highlightCount: number;
  onOpen: (id: string) => void;
}

/**
 * Reading-list row: serif title, quiet one-line metadata, hairline progress.
 * Bespoke (invention lane) — rides `SurfaceCard` for the interactive surface
 * and neutral hover; rows are separated by whitespace, not dividers.
 */
export function ArticleRow({ article, highlightCount, onOpen }: ArticleRowProps) {
  return (
    <SurfaceCard
      variant="flat"
      onClick={() => onOpen(article.id)}
      ariaLabel={`Open ${article.title}`}
    >
      <Stack gap="sm">
        <h3 className="text-xl font-normal leading-snug text-foreground">{article.title}</h3>
        <p className="text-sm text-muted-foreground">
          {article.source} · {article.author} · {article.readingMinutes} min read
          {highlightCount > 0
            ? ` · ${highlightCount} highlight${highlightCount === 1 ? "" : "s"}`
            : ""}
        </p>
        <ReadingProgress
          value={article.progress}
          status={article.status}
          ariaLabel={`Reading progress for ${article.title}`}
        />
      </Stack>
    </SurfaceCard>
  );
}
