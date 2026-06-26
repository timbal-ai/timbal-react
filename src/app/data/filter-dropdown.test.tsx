import { describe, expect, it, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";

import { FilterDropdown, type FilterFieldDef } from "./FilterDropdown";

// HappyDOM/JSDOM under Bun can lack these globals that Radix Select touches.
if (typeof global.NodeFilter === "undefined") {
  (global as any).NodeFilter = {
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
    FILTER_SKIP: 3,
    SHOW_ALL: 4294967295,
    SHOW_ELEMENT: 1,
  };
}
if (typeof (global as any).HTMLInputElement === "undefined") {
  (global as any).HTMLInputElement = class {};
}

const FIELDS: FilterFieldDef[] = [
  {
    id: "status",
    label: "Status",
    type: "multiselect",
    options: [
      { value: "active", label: "Active" },
      { value: "paused", label: "Paused" },
    ],
  },
  { id: "name", label: "Name", type: "text", placeholder: "Search name…" },
  { id: "amount", label: "Amount", type: "numeric" },
];

describe("FilterDropdown", () => {
  it("renders the trigger button with a custom label", () => {
    render(<FilterDropdown fields={FIELDS} label="Filter" />);
    expect(screen.getByText("Filter")).toBeTruthy();
  });

  it("renders a menu row for each configured field (adapts to content)", () => {
    render(<FilterDropdown fields={FIELDS} />);
    fireEvent.click(screen.getByText("Filter"));

    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Amount")).toBeTruthy();
    // No hardcoded billing facets leak in.
    expect(screen.queryByText("Wallet address")).toBeNull();
    expect(screen.queryByText("Lifetime value")).toBeNull();
  });

  it("shows the first field's control by default and lists its options", () => {
    render(<FilterDropdown fields={FIELDS} />);
    fireEvent.click(screen.getByText("Filter"));

    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Paused")).toBeTruthy();
  });

  it("emits the selected values keyed by field id when a multiselect option is toggled", () => {
    const handleChange = mock((_: Record<string, unknown>) => {});
    render(<FilterDropdown fields={FIELDS} onChange={handleChange} />);
    fireEvent.click(screen.getByText("Filter"));

    fireEvent.click(screen.getByText("Active"));

    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall.status).toEqual(["active"]);
  });

  it("renders a removable active-filter pill after selecting an option", () => {
    render(<FilterDropdown fields={FIELDS} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Active"));

    // A pill labelled "Status: Active" appears with a remove button + Clear all.
    expect(screen.getByText("Status: Active")).toBeTruthy();
    const remove = screen.getByLabelText("Remove Status: Active");
    expect(screen.getByText("Clear all")).toBeTruthy();

    // Removing the pill clears that value (pill disappears).
    fireEvent.click(remove);
    expect(screen.queryByText("Status: Active")).toBeNull();
  });

  it("switches sub-menus and commits text values on Apply", () => {
    const handleChange = mock((_: Record<string, unknown>) => {});
    render(<FilterDropdown fields={FIELDS} onChange={handleChange} />);
    fireEvent.click(screen.getByText("Filter"));

    fireEvent.click(screen.getByText("Name"));
    const input = screen.getByPlaceholderText("Search name…");
    fireEvent.change(input, { target: { value: "Alpha" } });
    fireEvent.click(screen.getByText("Apply"));

    const lastCall = handleChange.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall.name).toBe("Alpha");
  });
});
