import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, render } from "@testing-library/react";

import { ShellNavProvider } from "../../layout/shell-nav-context";
import { StudioSidebar } from "./sidebar";

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

describe("StudioSidebar mobile sync", () => {
  beforeEach(() => setViewport(500)); // phone viewport → drawer mode
  afterEach(() => setViewport(1024));

  // Plain brand avoids the default TimbalMark WebGL shader (no canvas in jsdom).
  const brand = <span>Brand</span>;

  function drawerHidden(root: HTMLElement) {
    const aside = root.querySelector('aside[aria-label="Studio navigation"]');
    expect(aside).toBeTruthy();
    return aside?.getAttribute("aria-hidden");
  }

  it("syncs its drawer to the enclosing shell nav controls (no mobileOpen wiring)", () => {
    function Harness({ open }: { open: boolean }) {
      return (
        <ShellNavProvider value={{ open, setOpen: () => {}, toggle: () => {} }}>
          <StudioSidebar workforces={[]} selectedId="" onSelect={() => {}} brand={brand} />
        </ShellNavProvider>
      );
    }

    const { rerender, container } = render(<Harness open={false} />);
    expect(drawerHidden(container)).toBe("true");

    rerender(<Harness open />);
    expect(drawerHidden(container)).toBe("false");
  });

  it("falls back to its own drawer state when not inside a shell", () => {
    const { container } = render(
      <StudioSidebar workforces={[]} selectedId="" onSelect={() => {}} brand={brand} />,
    );
    // Closed by default; internal state, no shell to sync with.
    expect(drawerHidden(container)).toBe("true");
  });
});
