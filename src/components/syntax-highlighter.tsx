"use client";

import { type FC, useEffect, useState } from "react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import langJavascript from "shiki/langs/javascript.mjs";
import langTypescript from "shiki/langs/typescript.mjs";
import langPython from "shiki/langs/python.mjs";
import langHtml from "shiki/langs/html.mjs";
import langCss from "shiki/langs/css.mjs";
import langJson from "shiki/langs/json.mjs";
import langBash from "shiki/langs/bash.mjs";
import langMarkdown from "shiki/langs/markdown.mjs";
import langJsx from "shiki/langs/jsx.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import langSql from "shiki/langs/sql.mjs";
import langYaml from "shiki/langs/yaml.mjs";
import langRust from "shiki/langs/rust.mjs";
import langGo from "shiki/langs/go.mjs";
import langJava from "shiki/langs/java.mjs";
import langC from "shiki/langs/c.mjs";
import langCpp from "shiki/langs/cpp.mjs";

import themeVitesseDark from "shiki/themes/vitesse-dark.mjs";
import themeVitesseLight from "shiki/themes/vitesse-light.mjs";

const SHIKI_THEME_DARK = "vitesse-dark";
const SHIKI_THEME_LIGHT = "vitesse-light";

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [themeVitesseDark, themeVitesseLight],
      langs: [
        langJavascript,
        langTypescript,
        langPython,
        langHtml,
        langCss,
        langJson,
        langBash,
        langMarkdown,
        langJsx,
        langTsx,
        langSql,
        langYaml,
        langRust,
        langGo,
        langJava,
        langC,
        langCpp,
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

getHighlighter();

const ShikiSyntaxHighlighter: FC<SyntaxHighlighterProps> = ({
  components: { Pre, Code },
  language,
  code,
}) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const highlighter = await getHighlighter();
        const loadedLangs = highlighter.getLoadedLanguages();

        if (!loadedLangs.includes(language)) {
          if (!cancelled) setHtml(null);
          return;
        }

        const result = highlighter.codeToHtml(code, {
          lang: language,
          themes: {
            dark: SHIKI_THEME_DARK,
            light: SHIKI_THEME_LIGHT,
          },
        });

        if (!cancelled) setHtml(result);
      } catch {
        if (!cancelled) setHtml(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (html) {
    return (
      <div
        className="shiki-wrapper [&>pre]:!m-0 [&>pre]:!rounded-t-none [&>pre]:!rounded-b-lg [&>pre]:!border [&>pre]:!border-t-0 [&>pre]:!border-border/50 [&>pre]:!p-3 [&>pre]:!text-xs [&>pre]:!leading-relaxed [&>pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <Pre>
      <Code>{code}</Code>
    </Pre>
  );
};

export default ShikiSyntaxHighlighter;
