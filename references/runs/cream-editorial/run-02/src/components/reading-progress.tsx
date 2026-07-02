import { Stack } from "@timbal-ai/timbal-react/app";
import { Progress } from "@timbal-ai/timbal-react/ui";
import type { ArticleStatus } from "../data";

interface ReadingProgressProps {
  /** 0–100 percent read. */
  value: number;
  status: ArticleStatus;
  /** Accessible name for the progress bar. */
  ariaLabel: string;
  className?: string;
}

/**
 * Quiet reading-progress line: a hairline kit `Progress` (tinted by the theme
 * accent) with a small muted status/percent caption. Shared by library rows
 * and the article detail header.
 */
export function ReadingProgress({ value, status, ariaLabel, className }: ReadingProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const caption =
    status === "finished" ? "Finished" : status === "unread" ? "Unread" : `${clamped}%`;

  return (
    <Stack direction="horizontal" gap="sm" align="center" className={className}>
      <Progress value={clamped} aria-label={ariaLabel} className="h-0.5 flex-1" />
      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {caption}
      </span>
    </Stack>
  );
}
