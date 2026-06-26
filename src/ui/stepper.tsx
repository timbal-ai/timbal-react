import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "../utils";

export interface StepperStep {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export interface StepperProps extends Omit<React.ComponentProps<"ol">, "children"> {
  steps: StepperStep[];
  /** Index of the active step (0-based). Steps before it render as complete. */
  current: number;
  orientation?: "horizontal" | "vertical";
}

/**
 * Linear progress through an ordered set of steps (wizards, onboarding). Past
 * steps show a check, the current step is emphasized, and future steps are
 * muted. Connector lines fill up to the current step.
 */
function Stepper({
  steps,
  current,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <ol
      data-slot="stepper"
      className={cn(
        "flex",
        isVertical ? "flex-col gap-0" : "items-start gap-2",
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        const last = index === steps.length - 1;
        const connectorFilled = index < current;

        return (
          <li
            key={step.id}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-w-0",
              isVertical ? "gap-3" : "flex-1 flex-col gap-1.5",
              last && !isVertical && "flex-none",
            )}
          >
            <div className={cn("flex items-center gap-2", isVertical && "flex-col")}>
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  complete && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !complete && !active && "border-border text-muted-foreground",
                )}
              >
                {complete ? <CheckIcon className="size-3.5" aria-hidden /> : index + 1}
              </span>
              {!last ? (
                <span
                  aria-hidden
                  className={cn(
                    isVertical ? "w-px flex-1" : "h-px flex-1",
                    connectorFilled ? "bg-primary" : "bg-border",
                    isVertical && "min-h-6",
                  )}
                />
              ) : null}
            </div>
            <div className={cn("min-w-0", isVertical && "pb-4")}>
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
