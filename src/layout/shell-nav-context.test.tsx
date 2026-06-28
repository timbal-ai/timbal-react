import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { ShellNavProvider, useOptionalShellNav } from "./shell-nav-context";

function NavReader() {
  const nav = useOptionalShellNav();
  return <span data-testid="nav">{nav ? (nav.open ? "open" : "closed") : "none"}</span>;
}

describe("shell nav channel", () => {
  it("returns null when rendered without a provider", () => {
    render(<NavReader />);
    expect(screen.getByTestId("nav").textContent).toBe("none");
  });

  it("exposes the controls supplied by ShellNavProvider", () => {
    render(
      <ShellNavProvider value={{ open: true, setOpen: () => {}, toggle: () => {} }}>
        <NavReader />
      </ShellNavProvider>,
    );
    expect(screen.getByTestId("nav").textContent).toBe("open");
  });
});
