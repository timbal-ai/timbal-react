"use client";

import { useCallback, useState, type FC } from "react";
import { useThreadRuntime } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";

import type { QuestionArtifact, QuestionOption } from "./types";
import { Button } from "../ui/button";
import {
  studioArtifactShellClass,
  studioQuestionOptionClass,
  studioQuestionOptionSelectedClass,
} from "../design/classes";
import { cn } from "../utils";

/**
 * Stable per-row key. Agents sometimes omit or duplicate `id`; falling back
 * to the option's index keeps the keyed list deterministic.
 */
function optionKey(option: QuestionOption, index: number): string {
  const id = option.id?.trim();
  return id ? id : `__option-${index}`;
}

const OptionRadio: FC<{ selected: boolean }> = ({ selected }) => (
  <span
    className={cn(
      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
      selected
        ? "border-foreground bg-foreground text-background"
        : "border-border bg-background",
    )}
    aria-hidden
  >
    {selected ? <CheckIcon className="size-2.5 stroke-[3]" /> : null}
  </span>
);

/**
 * In-thread choice widget. Single-select submits immediately on click;
 * multi-select shows a confirm button. The answer is sent as a regular
 * user message via the assistant-ui runtime so the agent treats it like
 * any other reply.
 */
export const QuestionArtifactView: FC<{ artifact: QuestionArtifact }> = ({
  artifact,
}) => {
  const runtime = useThreadRuntime();
  const [selected, setSelected] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[] | null>(null);

  const isMulti = artifact.multi === true;
  const isDisabled = submittedIds !== null;

  const send = useCallback(
    (keys: string[]) => {
      if (keys.length === 0) return;
      const labels = artifact.options
        .map((option, index) => ({ option, key: optionKey(option, index) }))
        .filter(({ key }) => keys.includes(key))
        .map(({ option }) => option.label);
      setSubmittedIds(keys);
      runtime.append({
        role: "user",
        content: [{ type: "text", text: labels.join(", ") }],
      });
    },
    [artifact.options, runtime],
  );

  const onPick = useCallback(
    (key: string) => {
      if (isDisabled) return;
      if (!isMulti) {
        send([key]);
        return;
      }
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
      );
    },
    [isDisabled, isMulti, send],
  );

  const onConfirm = useCallback(() => {
    send(selected);
  }, [selected, send]);

  return (
    <div className={studioArtifactShellClass} data-artifact-kind="question">
      <div className="px-2.5 py-2">
        {artifact.prompt ? (
          <p className="mb-2 text-sm font-normal leading-snug text-foreground">
            {artifact.prompt}
          </p>
        ) : null}

        <div className="flex flex-col gap-0.5" role="list">
          {artifact.options.map((option, index) => {
            const key = optionKey(option, index);
            const isSelected = submittedIds
              ? submittedIds.includes(key)
              : isMulti && selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                role="listitem"
                disabled={isDisabled}
                onClick={() => onPick(key)}
                className={cn(
                  isSelected
                    ? studioQuestionOptionSelectedClass
                    : studioQuestionOptionClass,
                  isDisabled &&
                    (isSelected ? "cursor-default" : "cursor-not-allowed opacity-50"),
                )}
              >
                <OptionRadio selected={isSelected} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-normal text-foreground">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {isMulti && !submittedIds ? (
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              color="primary"
              size="sm"
              shape="pill"
              disabled={selected.length === 0}
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
