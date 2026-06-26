"use client";

import type { FC, ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { TIMBAL_V2_ELEVATED_GRADIENT } from "../../design/button-tokens";
import { cn } from "../../utils";
import { CopyButton } from "../../ui/copy-button";

export interface CatalogCardProps {
  /** The primary title of the catalog item. */
  title: ReactNode;
  /** Sub-title, author, or publisher (e.g., "google"). */
  subtitle?: ReactNode;
  /** Logo or icon node, rendered in the top-left next to the title. */
  logo?: ReactNode;
  /** External URL for the title link. If provided, renders an external link icon next to the title. */
  href?: string;
  /** Header category tag or status badge (e.g., `<StatusBadge>Text Generation</StatusBadge>`). */
  badge?: ReactNode;
  /** Main description or body content. */
  description?: ReactNode;
  /** Horizontal list of metadata tags, badges, or text strings right above the footer. */
  tags?: ReactNode[];
  /** Optional custom links rendered on the bottom-left of the footer. */
  footerLinks?: Array<{ label: ReactNode; href: string }>;
  /** Value to copy when clicking the copy button in the bottom-right footer. */
  copyValue?: string;
  /** Label for the copy button. Default `"Copy ID"`. */
  copyLabel?: ReactNode;
  /** Custom footer actions, rendered at the bottom-right of the footer (replaces copy button if provided). */
  actions?: ReactNode;
  /** Whole-card click handler. When provided, the card renders as a focusable button with neutral hover highlight. */
  onClick?: () => void;
  /** Accessible name for the card button. */
  ariaLabel?: string;
  className?: string;
}

const catalogCardShellClass = cn(
  "flex flex-col rounded-2xl border border-border shadow-card overflow-hidden text-left font-normal",
  TIMBAL_V2_ELEVATED_GRADIENT,
);

const catalogCardInteractiveClass = cn(
  "flex flex-col rounded-2xl border border-border shadow-card overflow-hidden text-left font-normal cursor-pointer",
  TIMBAL_V2_ELEVATED_GRADIENT,
  "transition-[background-color,box-shadow,border-color] duration-150 ease-in-out",
  "hover:border-foreground/20",
  "hover:from-secondary-fill-hover-from hover:to-secondary-fill-hover-to",
  "active:from-secondary-fill-active-from active:to-secondary-fill-active-to",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/**
 * Standardized high-fidelity Catalog / Model Card component.
 *
 * Designed to represent sophisticated marketplace and routing catalog cards (models, datasets, tools).
 * Features structured headers with logos, links, sub-headers, multiline descriptions, metadata row,
 * and a separated footer with link lists and automatic copy actions.
 * Interactive cards have safe, neutral-colored hover animations.
 */
export const CatalogCard: FC<CatalogCardProps> = ({
  title,
  subtitle,
  logo,
  href,
  badge,
  description,
  tags,
  footerLinks,
  copyValue,
  copyLabel = "Copy ID",
  actions,
  onClick,
  ariaLabel,
  className,
}) => {
  const showHeaderTags = Boolean(subtitle || badge);
  const showFooter = Boolean((footerLinks && footerLinks.length > 0) || copyValue || actions);

  const mainContent = (
    <div className="flex-1 p-5 flex flex-col h-full min-h-0">
      {/* Top Header Row (Logo + Title) */}
      <div className="flex items-start gap-3">
        {logo ? (
          <div className="size-8 shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-muted/40">
            {logo}
          </div>
        ) : null}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-sm font-medium leading-snug text-foreground focus-visible:outline-none focus-visible:underline"
                onClick={(e) => e.stopPropagation()} // Prevent clicking link from triggering card onClick
              >
                <span className="truncate">{title}</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/60" />
              </a>
            ) : (
              <h4 className="text-sm font-medium leading-snug text-foreground truncate">{title}</h4>
            )}
          </div>
          {/* Subtitle / Badge Row */}
          {showHeaderTags ? (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {subtitle ? (
                <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>
              ) : null}
              {badge ? (
                <div className="shrink-0 flex items-center">{badge}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Description Body */}
      {description ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {description}
        </p>
      ) : null}

      {/* Metadata Tags Row */}
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {tags.map((tag, idx) => (
            <div key={idx} className="flex items-center text-xs text-muted-foreground/80">
              {idx > 0 && <span className="mr-2 text-muted-foreground/30">•</span>}
              {tag}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const footerMarkup = showFooter ? (
    <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between gap-4 bg-muted/[0.02]">
      {/* Bottom Left Links */}
      <div className="flex flex-wrap items-center gap-4">
        {footerLinks && footerLinks.length > 0
          ? footerLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:underline"
                onClick={(e) => e.stopPropagation()} // Prevent triggering card onClick
              >
                <span>{link.label}</span>
                <ExternalLink className="size-2.5 shrink-0 text-muted-foreground/50" />
              </a>
            ))
          : null}
      </div>

      {/* Bottom Right Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {actions ? actions : null}
        {!actions && copyValue ? (
          <CopyButton
            value={copyValue}
            className="h-7 text-xs px-2 hover:bg-muted/40 text-muted-foreground/80 hover:text-foreground"
          >
            {copyLabel}
          </CopyButton>
        ) : null}
      </div>
    </div>
  ) : null;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(catalogCardInteractiveClass, className)}
      >
        {mainContent}
        {footerMarkup}
      </button>
    );
  }

  return (
    <article className={cn(catalogCardShellClass, className)}>
      {mainContent}
      {footerMarkup}
    </article>
  );
};
