import type { ReactNode } from "react";

interface HighlightQuoteProps {
  /** The highlighted passage. */
  children: ReactNode;
  /** Optional margin note attached to the highlight. */
  note?: ReactNode;
  /** Quiet metadata (date saved, source). */
  meta?: ReactNode;
}

/**
 * Editorial pull-quote for a saved highlight: hairline accent rule on the
 * left, serif passage, small muted caption for the margin note and date.
 * Bespoke (invention lane) — no catalog block has this anatomy.
 */
export function HighlightQuote({ children, note, meta }: HighlightQuoteProps) {
  return (
    <figure className="border-l-2 border-primary/40 pl-4">
      <blockquote className="text-lg leading-relaxed text-foreground [font-family:var(--font-display)]">
        {children}
      </blockquote>
      {note || meta ? (
        <figcaption className="mt-2 text-sm text-muted-foreground">
          {note ? <span className="italic">{note}</span> : null}
          {note && meta ? <span aria-hidden="true"> — </span> : null}
          {meta}
        </figcaption>
      ) : null}
    </figure>
  );
}
