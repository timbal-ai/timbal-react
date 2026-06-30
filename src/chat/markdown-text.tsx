"use client";

import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { type ComponentPropsWithoutRef, type FC, memo, useState } from "react";
import { motion } from "motion/react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { TooltipIconButton } from "./tooltip-icon-button";
import { cn } from "../utils";
import ShikiSyntaxHighlighter from "./syntax-highlighter";
import { isArtifactFenceLanguage } from "../artifacts/parse";

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className="aui-md"
      components={{
        ...defaultComponents,
        SyntaxHighlighter: ShikiSyntaxHighlighter,
      }}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  // Artifact fenced blocks render their own chrome — skip the code header.
  if (isArtifactFenceLanguage(language)) return null;

  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="aui-code-header flex items-center justify-between rounded-t-lg border border-b-0 border-border/50 bg-code-header-bg px-4 py-2">
      <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
        <span className="inline-block h-2 w-2 rounded-full bg-primary/40" />
        {language}
      </span>
      <TooltipIconButton
        tooltip={isCopied ? "Copied!" : "Copy"}
        onClick={onCopy}
        className="transition-colors hover:text-foreground"
      >
        {!isCopied && <CopyIcon className="h-3.5 w-3.5" />}
        {isCopied && <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />}
      </TooltipIconButton>
    </div>
  );
};


const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

/**
 * Glass blockquote. Reads as a frosted glass card (translucent fill, bright top
 * rim, soft inner glow + backdrop blur) and "sculpts" itself into view on first
 * paint — scaling up out of a heavy blur, as if forming out of glass.
 *
 * The reveal animates `filter: blur()`, which would otherwise leave the element
 * a backdrop root forever (disabling its own `backdrop-filter`). So once the
 * animation settles we drop the inline filter entirely, handing the glass back
 * to `backdrop-filter`.
 */
const GlassBlockquote: FC<ComponentPropsWithoutRef<"blockquote">> = ({
  className,
  children,
  ...props
}) => {
  const [sculpted, setSculpted] = useState(false);

  return (
    <motion.blockquote
      className={cn(
        "aui-md-blockquote relative my-4 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-foreground/85 backdrop-blur-xl backdrop-saturate-150",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.25)]",
        "[&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0",
        className,
      )}
      initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(16px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => setSculpted(true)}
      // After the morph, clear the filter so the live `backdrop-filter` (glass)
      // is no longer suppressed by the element being a backdrop root.
      style={sculpted ? { filter: "none" } : undefined}
      {...(props as ComponentPropsWithoutRef<typeof motion.blockquote>)}
    >
      {children}
    </motion.blockquote>
  );
};

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "aui-md-h1 mb-3 mt-6 scroll-m-20 text-xl font-bold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "aui-md-h2 mb-2.5 mt-5 scroll-m-20 border-b border-border/30 pb-1.5 text-lg font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "aui-md-h3 mb-2 mt-4 scroll-m-20 text-base font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "aui-md-h4 mb-1.5 mt-3 scroll-m-20 text-sm font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "aui-md-h5 mb-1 mt-2.5 text-sm font-medium first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "aui-md-h6 mb-1 mt-2 text-sm font-medium text-muted-foreground first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "aui-md-p my-3 leading-[1.7] first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "aui-md-a font-medium text-primary underline decoration-primary/30 underline-offset-[3px] transition-colors hover:decoration-primary/80",
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: GlassBlockquote,
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "aui-md-ul my-3 ml-1 list-none space-y-1.5 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-primary/30 [&>li]:before:content-['']",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "aui-md-ol my-3 ml-1 list-none space-y-1.5 [counter-reset:list-counter] [&>li]:relative [&>li]:pl-7 [&>li]:[counter-increment:list-counter] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-0 [&>li]:before:flex [&>li]:before:h-[1.7em] [&>li]:before:w-5 [&>li]:before:items-center [&>li]:before:justify-center [&>li]:before:rounded-md [&>li]:before:bg-primary/[0.07] [&>li]:before:text-xs [&>li]:before:font-semibold [&>li]:before:text-primary/60 [&>li]:before:content-[counter(list-counter)]",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn(
        "aui-md-hr my-6 border-none h-px bg-gradient-to-r from-transparent via-border to-transparent",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 w-full overflow-x-auto rounded-lg border border-border/50">
      <table
        className={cn("aui-md-table w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "aui-md-th border-b border-border/50 bg-muted/60 px-3 py-2 text-left text-xs font-semibold text-muted-foreground [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "aui-md-td border-b border-border/30 px-3 py-2 [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn(
        "aui-md-tr transition-colors hover:bg-muted/30 [&:last-child>td]:border-b-0",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("aui-md-li leading-[1.7]", className)} {...props} />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn(
        "aui-md-sup [&>a]:text-[0.7em] [&>a]:font-semibold [&>a]:text-primary/70 [&>a]:no-underline [&>a]:transition-colors [&>a]:hover:text-primary",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "aui-md-pre overflow-x-auto rounded-t-none rounded-b-lg border border-t-0 border-border/50 bg-code-block-bg p-4 text-[13px] leading-relaxed",
        className,
      )}
      {...props}
    />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock &&
            "aui-md-inline-code rounded-[5px] border border-border/60 bg-muted/60 px-[0.4em] py-[0.15em] font-mono text-[0.85em] font-medium text-foreground/90",
          className,
        )}
        {...props}
      />
    );
  },
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn(
        "aui-md-img my-3 h-auto max-w-full rounded-lg border border-border/50",
        className,
      )}
      alt={alt ?? ""}
      loading="lazy"
      {...props}
    />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-foreground", className)} {...props} />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
  CodeHeader,
});
