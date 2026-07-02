import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  FilterBar,
  FilterField,
  Page,
  SearchInput,
  type DataTableColumn,
} from "@timbal-ai/timbal-react/app";
import {
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timbal-ai/timbal-react/ui";

import { articles, type Article, type ArticleStatus } from "../data";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  reading: "Reading",
  finished: "Finished",
  unread: "Unread",
};

const columns: DataTableColumn<Article>[] = [
  {
    id: "title",
    header: "Title",
    sortable: true,
    sortValue: (a) => a.title,
    cell: (a) => (
      <div className="py-2">
        <div className="[font-family:var(--font-display)] text-[15px] font-medium leading-snug text-foreground">
          {a.title}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {a.author} · saved {a.savedAt}
        </div>
      </div>
    ),
  },
  {
    id: "source",
    header: "Source",
    sortable: true,
    sortValue: (a) => a.source,
    cell: (a) => <span className="text-sm text-muted-foreground">{a.source}</span>,
  },
  {
    id: "readingTime",
    header: "Reading time",
    sortable: true,
    sortValue: (a) => a.readingTime,
    align: "right",
    cell: (a) => (
      <span className="text-sm tabular-nums text-muted-foreground">{a.readingTime} min</span>
    ),
  },
  {
    id: "progress",
    header: "Progress",
    sortable: true,
    sortValue: (a) => a.progress,
    cell: (a) => (
      <div className="flex items-center gap-3">
        <Progress value={a.progress} className="h-1 w-24" />
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
          {a.progress}%
        </span>
      </div>
    ),
  },
];

export function LibraryPage({ onOpenArticle }: { onOpenArticle: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ArticleStatus>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return [a.title, a.author, a.source].some((field) =>
        field.toLowerCase().includes(q),
      );
    });
  }, [query, status]);

  return (
    <Page
      title={
        <span className="[font-family:var(--font-display)] font-medium tracking-tight">
          Library
        </span>
      }
      description="Everything you've saved, waiting patiently."
      actions={<Button color="primary">Save article</Button>}
    >
      <FilterBar>
        <FilterField>
          <SearchInput
            placeholder="Search titles, authors, sources…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </FilterField>
        <FilterField label="Status">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "all" | ArticleStatus)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(Object.keys(STATUS_LABEL) as ArticleStatus[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {STATUS_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(a) => a.id}
        defaultSort={{ columnId: "title", direction: "asc" }}
        onRowClick={(a) => onOpenArticle(a.id)}
        showRowCount
        rowCountLabel={(count) => `${count} saved ${count === 1 ? "article" : "articles"}`}
        emptyTitle="Nothing matches"
        emptyDescription="Try a different search, or clear the status filter."
      />
    </Page>
  );
}
