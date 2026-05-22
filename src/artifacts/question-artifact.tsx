"use client";

import { useState, type FC } from "react";
import { useThreadRuntime } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";
import type { QuestionArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";
import { Button } from "../ui/button";
import { cn } from "../utils";

/**
 * Inline choice widget. Single-select submits immediately on click;
 * multi-select shows a confirm button. The answer is sent as a regular user
 * message via the assistant-ui runtime, so the agent treats it like any
 * other reply.
 */
export const QuestionArtifactView: FC<{ artifact: QuestionArtifact }> = ({
  artifact,
}) => {
  const runtime = useThreadRuntime();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const isMulti = artifact.multi === true;

  const send = (labels: string[]) => {
    if (labels.length === 0) return;
    const text = labels.join(", ");
    setSubmitted(text);
    runtime.append({ role: "user", content: [{ type: "text", text }] });
  };

  const onPick = (option: { id: string; label: string }) => {
    if (submitted) return;
    if (!isMulti) {
      send([option.label]);
      return;
    }
    setSelected((prev) =>
      prev.includes(option.id)
        ? prev.filter((id) => id !== option.id)
        : [...prev, option.id],
    );
  };

  const onConfirm = () => {
    const labels = artifact.options
      .filter((o) => selected.includes(o.id))
      .map((o) => o.label);
    send(labels);
  };

  return (
    <ArtifactCard kind="question">
      <div className="aui-artifact-question p-3">
        {artifact.prompt && (
          <p className="aui-artifact-question-prompt mb-2 text-sm text-foreground/85">
            {artifact.prompt}
          </p>
        )}
        <div className="aui-artifact-question-options flex flex-col gap-1.5">
          {artifact.options.map((option) => {
            const isSelected = isMulti && selected.includes(option.id);
            const isDisabled = Boolean(submitted);
            return (
              <button
                key={option.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onPick(option)}
                className={cn(
                  "aui-artifact-question-option flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  "border-border/60 hover:border-primary/40 hover:bg-muted/40",
                  isSelected && "border-primary/60 bg-primary/5",
                  isDisabled && "cursor-not-allowed opacity-60 hover:border-border/60 hover:bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                  aria-hidden
                >
                  {isSelected && <CheckIcon className="size-3" />}
                </span>
                <div className="aui-artifact-question-option-text flex-1">
                  <div className="font-medium text-foreground/90">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {isMulti && !submitted && (
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={selected.length === 0}
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </div>
        )}
        {submitted && (
          <p className="aui-artifact-question-submitted mt-2 text-xs text-muted-foreground">
            Sent: {submitted}
          </p>
        )}
      </div>
    </ArtifactCard>
  );
};
