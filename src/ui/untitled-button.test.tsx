import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UntitledButton } from "./untitled-button";

describe("UntitledButton", () => {
  it("renders its label and the Untitled UI rounded-rect, medium styling", () => {
    render(<UntitledButton size="md">Publish now</UntitledButton>);
    const button = screen.getByRole("button", { name: "Publish now" });
    expect(button.className).toContain("rounded-lg");
    expect(button.className).toContain("font-medium");
  });

  it("renders leading and trailing icons around the label", () => {
    render(
      <UntitledButton
        iconLeading={<span data-testid="lead">L</span>}
        iconTrailing={<span data-testid="trail">T</span>}
      >
        Publish now
      </UntitledButton>,
    );
    const button = screen.getByRole("button");
    expect(screen.getByTestId("lead")).toBeTruthy();
    expect(screen.getByTestId("trail")).toBeTruthy();
    expect(button.textContent).toBe("LPublish nowT");
  });

  it("becomes non-interactive while loading", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(
      <UntitledButton isLoading onClick={() => (clicks += 1)}>
        Saving
      </UntitledButton>,
    );
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    await user.click(button);
    expect(clicks).toBe(0);
  });

  it("fires onClick when enabled", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(
      <UntitledButton color="primary-destructive" onClick={() => (clicks += 1)}>
        Delete project
      </UntitledButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(clicks).toBe(1);
  });

  it("renders as a link via asChild", () => {
    render(
      <UntitledButton color="link" asChild>
        <a href="/docs">Docs</a>
      </UntitledButton>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.className).toContain("font-medium");
  });
});
