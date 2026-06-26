import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { APP_KIT_AGENT_INSTRUCTIONS } from "./agent-instructions";
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

describe("APP_KIT_AGENT_INSTRUCTIONS", () => {
  it("documents creative freedom, recipes, and premade components", () => {
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Creative freedom");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("examples/app-kit/recipes");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("MetricRow");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("MetricChartCard");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain('density="compact"');
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("ConnectionRowList");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("IntegrationCard");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Accessibility");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("ariaLabel");
  });

  it("documents layout archetypes and the full-height contract", () => {
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Layout archetypes");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("contentFill");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Split master–detail");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Bento overview");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("headerless");
    // Steers away from the guessed-chrome-height anti-pattern.
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("100dvh");
  });

  it("documents the API gotchas that cause codegen retry loops", () => {
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("API gotchas");
    // Hallucinated props observed in builder sessions (TS2322/TS2741/TS2305).
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("require `label`");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("WorkforceSelector");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Banner");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("Timeline");
    expect(APP_KIT_AGENT_INSTRUCTIONS).toContain("@timbal-ai/timbal-react/ui");
  });
});

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

  it("renders a headerless Page with no heading", () => {
    const { container } = render(
      <Page>
        <p>Just content</p>
      </Page>,
    );
    expect(screen.queryByRole("heading")).toBeNull();
    expect(container.querySelector(".aui-app-page-header")).toBeNull();
    expect(screen.getByText("Just content")).toBeTruthy();
  });

  it("makes a fill Page a bounded flex column", () => {
    const { container } = render(
      <Page fill>
        <div>Chat</div>
      </Page>,
    );
    const page = container.querySelector(".aui-app-page");
    expect(page?.className).toContain("flex-1");
    expect(page?.className).toContain("min-h-0");
  });

  it("clips the content region and drops bottom padding when contentFill is set", () => {
    const { container } = render(
      <AppShell contentFill>
        <div>Full bleed</div>
      </AppShell>,
    );
    const scroll = container.querySelector(".aui-app-shell-scroll");
    const main = container.querySelector(".aui-app-shell-main");
    expect(scroll?.className).toContain("overflow-hidden");
    expect(scroll?.className).not.toContain("overflow-y-auto");
    expect(main?.className).toContain("flex-col");
    expect(main?.className).not.toContain("pb-8");
  });

  it("keeps the default content region scrollable as a flex column", () => {
    const { container } = render(
      <AppShell>
        <div>Scrolling page</div>
      </AppShell>,
    );
    const scroll = container.querySelector(".aui-app-shell-scroll");
    const main = container.querySelector(".aui-app-shell-main");
    expect(scroll?.className).toContain("overflow-y-auto");
    expect(main?.className).toContain("flex-col");
    expect(main?.className).toContain("pb-8");
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

