import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Timeline, type TimelineItem } from "./timeline";

const mockItems: TimelineItem[] = [
  {
    id: "1",
    title: "Customer opened a resolution case",
    description: "The customer is unhappy with their purchase and is requesting a refund.",
    meta: "Mar 6, 10:34 AM",
    tone: "warn",
  },
  {
    id: "2",
    title: "Payment completed",
    meta: "Mar 6, 10:21 AM",
    tone: "success",
  },
  {
    id: "3",
    title: "Payment attempted",
    meta: "Mar 6, 10:21 AM",
    tone: "default",
  },
];

describe("Timeline", () => {
  it("renders all items with titles and metadata", () => {
    render(<Timeline items={mockItems} />);

    expect(screen.getByText("Customer opened a resolution case")).toBeTruthy();
    expect(screen.getByText("Payment completed")).toBeTruthy();
    expect(screen.getByText("Payment attempted")).toBeTruthy();

    expect(screen.getByText("Mar 6, 10:34 AM")).toBeTruthy();
    expect(screen.getAllByText("Mar 6, 10:21 AM")).toHaveLength(2);
  });

  it("renders description when provided", () => {
    render(<Timeline items={mockItems} />);

    expect(
      screen.getByText("The customer is unhappy with their purchase and is requesting a refund.")
    ).toBeTruthy();
  });

  it("renders custom icons when provided", () => {
    const itemsWithIcon: TimelineItem[] = [
      {
        id: "1",
        title: "Starred repository",
        icon: <span data-testid="star-icon">★</span>,
      },
    ];

    render(<Timeline items={itemsWithIcon} />);

    expect(screen.getByTestId("star-icon")).toBeTruthy();
    expect(screen.getByText("★")).toBeTruthy();
  });
});
