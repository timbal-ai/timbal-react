"use client";

import type { FC, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { cn } from "../../utils";

export interface AppConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  className?: string;
}

const bodyClass = "flex flex-col gap-4 p-6";
const titleClass = "pr-8";
const actionsClass = "flex flex-wrap justify-end gap-2";

/**
 * Confirm/cancel dialog for app flows (delete row, discard changes, etc.).
 */
export const AppConfirmDialog: FC<AppConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  className,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("gap-0 p-0 sm:max-w-md", className)}
      >
        <div className={bodyClass}>
          <DialogTitle className={titleClass}>{title}</DialogTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          <div className={actionsClass}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              shape="pill"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              color={destructive ? "primary-destructive" : "primary"}
              size="sm"
              shape="pill"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
