import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { AppShell } from "./layout/AppShell";
import { useAppCopilotContext, AppCopilotProvider } from "./copilot/app-copilot-context";
import { DataTable } from "./data/DataTable";
import { Page } from "./layout/Page";
import { StatTile } from "./surfaces/StatTile";
import {
  ShellInsetProvider,
  useShellInsetReporter,
} from "../layout/shell-inset-context";

function CopilotReader() {
  const ctx = useAppCopilotContext();
  return <span data-testid="copilot-page">{String(ctx.page)}</span>;
}

const sampleRows = [
  { id: "1", name: "Beta", status: "Paused" },
  { id: "2", name: "Alpha", status: "Active" },
];

describe("app kit", () => {
  it("renders Page title", () => {
    render(
      <Page title="Dashboard" description="Overview">
        <p>Content</p>
      </Page>,
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByText("Overview")).toBeTruthy();
  });

  it("renders StatTile", () => {
    render(<StatTile label="Users" value="1,204" />);
    expect(screen.getByText("Users")).toBeTruthy();
    expect(screen.getByText("1,204")).toBeTruthy();
  });

  it("renders DataTable empty state", () => {
    render(
      <DataTable
        columns={[{ id: "name", header: "Name", cell: () => null }]}
        rows={[]}
        getRowKey={() => "x"}
        emptyTitle="No rows"
      />,
    );
    expect(screen.getByText("No rows")).toBeTruthy();
  });

  it("renders inline empty state inside the table shell", () => {
    render(
      <DataTable
        columns={[{ id: "name", header: "Name", cell: () => null }]}
        rows={[]}
        getRowKey={() => "x"}
        emptyTitle="No matches"
        emptyMode="inline"
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("exposes copilot context to descendants", () => {
    render(
      <AppCopilotProvider value={{ page: "Ops" }}>
        <CopilotReader />
      </AppCopilotProvider>,
    );
    expect(screen.getByTestId("copilot-page").textContent).toBe("Ops");
  });

  it("sorts rows when a sortable header is clicked", () => {
    render(
      <DataTable
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (row) => row.name,
            sortable: true,
            sortValue: (row) => row.name,
          },
        ]}
        rows={sampleRows}
        getRowKey={(row) => row.id}
        defaultSort={{ columnId: "name", direction: "asc" }}
        showRowCount
      />,
    );

    const cells = screen.getAllByRole("cell");
    expect(cells[0]?.textContent).toBe("Alpha");
    expect(screen.getByText("2 rows")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Name/i }));
    const descCells = screen.getAllByRole("cell");
    expect(descCells[0]?.textContent).toBe("Beta");
  });

  it("renders AppShell content alongside a sidebar slot", () => {
    render(
      <AppShell sidebar={<nav data-testid="rail">Rail</nav>}>
        <p>Dashboard body</p>
      </AppShell>,
    );
    expect(screen.getByTestId("rail")).toBeTruthy();
    expect(screen.getByText("Dashboard body")).toBeTruthy();
  });
});

describe("shell inset channel", () => {
  function InsetReader() {
    const reporter = useShellInsetReporter();
    return <span data-testid="reporter">{reporter ? "bound" : "none"}</span>;
  }

  it("returns null when rendered without a provider", () => {
    render(<InsetReader />);
    expect(screen.getByTestId("reporter").textContent).toBe("none");
  });

  it("exposes the reporter supplied by ShellInsetProvider", () => {
    const reporter = (_px: number) => {};
    render(
      <ShellInsetProvider value={reporter}>
        <InsetReader />
      </ShellInsetProvider>,
    );
    expect(screen.getByTestId("reporter").textContent).toBe("bound");
  });
});
