import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Publish now</Button>);
    expect(screen.getByRole("button", { name: "Publish now" })).toBeTruthy();
  });

  it("maps the Untitled UI `color` alias onto the data-variant attribute", () => {
    render(
      <>
        <Button color="primary">Publish now</Button>
        <Button color="secondary">Stage for publish</Button>
        <Button color="primary-destructive">Delete project</Button>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Publish now" }).getAttribute("data-variant"),
    ).toBe("primary");
    expect(
      screen.getByRole("button", { name: "Stage for publish" }).getAttribute("data-variant"),
    ).toBe("secondary");
    expect(
      screen.getByRole("button", { name: "Delete project" }).getAttribute("data-variant"),
    ).toBe("primary-destructive");
  });

  it("renders leading and trailing icons around the label", () => {
    render(
      <Button
        color="primary"
        iconLeading={<span data-testid="lead">L</span>}
        iconTrailing={<span data-testid="trail">T</span>}
      >
        Publish now
      </Button>,
    );

    const lead = screen.getByTestId("lead");
    const trail = screen.getByTestId("trail");
    const button = screen.getByRole("button");

    expect(lead).toBeTruthy();
    expect(trail).toBeTruthy();
    // Leading icon comes before the label, trailing after.
    expect(button.textContent).toBe("LPublish nowT");
  });

  it("applies the requested size height", () => {
    render(
      <Button size="md" color="primary">
        Publish now
      </Button>,
    );
    expect(
      screen.getByRole("button", { name: "Publish now" }).className.includes("h-9"),
    ).toBe(true);
  });

  it("fires onClick", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(
      <Button color="primary-destructive" onClick={() => (clicks += 1)}>
        Delete project
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(clicks).toBe(1);
  });
});
