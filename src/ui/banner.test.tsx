import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Banner } from "./banner";

describe("Banner", () => {
  it("renders its title and children", () => {
    render(
      <Banner title="System Update">
        The system will undergo maintenance in 10 minutes.
      </Banner>
    );

    expect(screen.getByText("System Update")).toBeTruthy();
    expect(
      screen.getByText("The system will undergo maintenance in 10 minutes.")
    ).toBeTruthy();
  });

  it("renders leading icon when provided", () => {
    render(
      <Banner icon={<span data-testid="banner-icon">🔔</span>}>
        Attention required
      </Banner>
    );

    expect(screen.getByTestId("banner-icon")).toBeTruthy();
  });

  it("fires onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = mock(() => {});
    render(
      <Banner onDismiss={onDismiss}>
        Dismissible banner
      </Banner>
    );

    const button = screen.getByRole("button", { name: "Dismiss" });
    expect(button).toBeTruthy();

    await userEvent.click(button);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("applies variant and tone data attributes", () => {
    const { container } = render(
      <Banner tone="success" variant="outline">
        Success outline
      </Banner>
    );

    const bannerElement = container.firstChild as HTMLElement;
    expect(bannerElement.getAttribute("data-variant")).toBe("outline");
  });
});
