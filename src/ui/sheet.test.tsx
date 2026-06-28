import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

describe("SheetDescription DOM nesting", () => {
  it("renders as a <div> so block children are valid HTML (no <div> in <p>)", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit record</SheetTitle>
            <SheetDescription>
              <div data-testid="badge">Active</div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    const desc = document.querySelector('[data-slot="sheet-description"]');
    expect(desc).toBeTruthy();
    expect(desc?.tagName).toBe("DIV");
    // The block child lives directly inside the description div — no <p> wrapper.
    expect(desc?.querySelector('[data-testid="badge"]')).toBeTruthy();
  });
});

describe("DialogDescription DOM nesting", () => {
  it("renders as a <div> so block children are valid HTML", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>
              <div data-testid="badge">Details</div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const desc = document.querySelector('[data-slot="dialog-description"]');
    expect(desc).toBeTruthy();
    expect(desc?.tagName).toBe("DIV");
  });
});
