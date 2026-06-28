import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", cell: (r) => r.name },
];

const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }));

describe("DataTable pagination", () => {
  it("limits visible rows to pageSize and pages with the pager", () => {
    render(
      <DataTable
        columns={columns}
        rows={makeRows(25)}
        getRowKey={(r) => r.id}
        pageSize={10}
      />,
    );

    // First page shows 10 rows.
    expect(screen.getByText("Row 0")).toBeTruthy();
    expect(screen.getByText("Row 9")).toBeTruthy();
    expect(screen.queryByText("Row 10")).toBeNull();
    expect(screen.getByText(/1–10 of 25/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Next page"));

    expect(screen.queryByText("Row 9")).toBeNull();
    expect(screen.getByText("Row 10")).toBeTruthy();
    expect(screen.getByText(/11–20 of 25/)).toBeTruthy();
  });
});

describe("DataTable selection", () => {
  it("reports selected keys and supports select-all", () => {
    const selections: string[][] = [];
    render(
      <DataTable
        columns={columns}
        rows={makeRows(3)}
        getRowKey={(r) => r.id}
        selectable
        onSelectionChange={(keys) => selections.push(keys)}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header select-all.
    fireEvent.click(checkboxes[0]);
    expect(selections.at(-1)).toEqual(["r0", "r1", "r2"]);

    fireEvent.click(checkboxes[0]);
    expect(selections.at(-1)).toEqual([]);
  });

  it("does not fire onRowClick when toggling a row checkbox", () => {
    let rowClicks = 0;
    render(
      <DataTable
        columns={columns}
        rows={makeRows(2)}
        getRowKey={(r) => r.id}
        selectable
        onRowClick={() => {
          rowClicks += 1;
        }}
      />,
    );

    const rowCheckbox = screen.getAllByRole("checkbox")[1];
    fireEvent.click(rowCheckbox);
    expect(rowClicks).toBe(0);
  });
});

describe("DataTable loading", () => {
  it("renders skeleton rows and keeps the header instead of the empty state", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        loading
        loadingRows={4}
      />,
    );

    // Header still rendered.
    expect(screen.getByText("Name")).toBeTruthy();
    // No empty-state text while loading.
    expect(screen.queryByText("No data")).toBeNull();
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});
