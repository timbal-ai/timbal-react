import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { MetricChartCard } from "./data/MetricChartCard";
import { MetricRow } from "./data/MetricRow";
import { MetricTile } from "./data/MetricTile";
import { IntegrationCard } from "./integrations/IntegrationCard";
import { ConnectionRowList } from "./integrations/ConnectionRowList";
import { ConnectionRow } from "./integrations/ConnectionRow";
import { SettingsSection } from "./settings/SettingsSection";
import { DangerZone, DangerZoneAction } from "./settings/DangerZone";
import { InfoCard } from "./surfaces/InfoCard";
import { DescriptionList } from "./surfaces/DescriptionList";
import { AlertCard } from "./surfaces/AlertCard";
import { CatalogCard } from "./surfaces/CatalogCard";
import { Sparkline } from "../charts/sparkline";

const series = [
  { date: new Date("2026-01-01"), value: 10 },
  { date: new Date("2026-01-02"), value: 20 },
  { date: new Date("2026-01-03"), value: 15 },
];

describe("MetricChartCard", () => {
  it("renders tiles and swaps the active series on click", () => {
    render(
      <MetricChartCard
        title="Analytics"
        metrics={[
          { id: "requests", label: "Requests", value: "1.2k", data: series },
          { id: "errors", label: "Error rate", value: "0.4", unit: "%", data: series },
        ]}
      />,
    );
    expect(screen.getByText("Requests")).toBeTruthy();
    const errorsTile = screen.getByText("Error rate").closest("button");
    expect(errorsTile).toBeTruthy();
    fireEvent.click(errorsTile!);
    expect(errorsTile?.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the empty label when the active metric has no data", () => {
    render(
      <MetricChartCard
        emptyLabel="No data yet"
        metrics={[{ id: "a", label: "A", value: "0" }]}
      />,
    );
    expect(screen.getByText("No data yet")).toBeTruthy();
  });
});

describe("MetricRow", () => {
  it("renders a row of metric labels", () => {
    render(
      <MetricRow
        title="Overview"
        titleTag="Last 24h"
        metrics={[
          { id: "a", label: "Requests", value: "12k", sparklineData: [1, 2, 3, 2, 4], trend: "+12%", trendVariant: "inline", trendTone: "up" },
          { id: "b", label: "Errors", value: "0.2", unit: "%" },
        ]}
      />,
    );
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("Last 24h")).toBeTruthy();
    expect(screen.getByText("Requests")).toBeTruthy();
    expect(screen.getByText("Errors")).toBeTruthy();
  });
});

describe("MetricTile", () => {
  it("fires onSelect", () => {
    let selected = false;
    render(<MetricTile label="CPU" value="42" unit="%" onSelect={() => (selected = true)} />);
    fireEvent.click(screen.getByText("CPU").closest("button")!);
    expect(selected).toBe(true);
  });
});

describe("IntegrationCard", () => {
  it("renders as a button when onClick is provided without an action", () => {
    let clicked = false;
    render(
      <IntegrationCard name="Slack" description="Alerts" onClick={() => (clicked = true)} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Slack/ }));
    expect(clicked).toBe(true);
  });

  it("renders as an article when a footer action is present", () => {
    render(
      <IntegrationCard
        name="GitHub"
        action={<button type="button">Connect</button>}
      />,
    );
    expect(screen.getByRole("article")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect" })).toBeTruthy();
  });
});

describe("ConnectionRowList", () => {
  it("exposes a list region with listitem rows", () => {
    render(
      <ConnectionRowList aria-label="Connections">
        <ConnectionRow name="Slack" meta="acme" />
      </ConnectionRowList>,
    );
    expect(screen.getByRole("list", { name: "Connections" })).toBeTruthy();
    expect(screen.getByRole("listitem")).toBeTruthy();
  });
});

describe("settings + surfaces", () => {
  it("renders a SettingsSection with title and content", () => {
    render(
      <SettingsSection title="General" description="Basics">
        <p>Body</p>
      </SettingsSection>,
    );
    expect(screen.getByRole("heading", { name: "General" })).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });

  it("renders a DangerZone action", () => {
    render(
      <DangerZone>
        <DangerZoneAction title="Delete" action={<button type="button">Go</button>} />
      </DangerZone>,
    );
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("renders an InfoCard and a DescriptionList", () => {
    render(
      <>
        <InfoCard title="Heads up">Body</InfoCard>
        <DescriptionList items={[{ label: "Owner", value: "Ada" }]} />
      </>,
    );
    expect(screen.getByText("Heads up")).toBeTruthy();
    expect(screen.getByText("Owner")).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
  });

  it("renders an AlertCard with tags, title, description, and action", () => {
    render(
      <AlertCard
        title="DHL Express — Critical Charging Drop-off Alert"
        description="DHL Express Logistics has seen a 51% decline in kWh consumption."
        category="Drop-off Warning"
        categoryTone="danger"
        status="At Risk · 48"
        statusTone="warn"
        action="Call fleet operations manager immediately."
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("DHL Express — Critical Charging Drop-off Alert")).toBeTruthy();
    expect(screen.getByText("DHL Express Logistics has seen a 51% decline in kWh consumption.")).toBeTruthy();
    expect(screen.getByText("Drop-off Warning")).toBeTruthy();
    expect(screen.getByText("At Risk · 48")).toBeTruthy();
    expect(screen.getByText("Call fleet operations manager immediately.")).toBeTruthy();
  });

  it("renders a CatalogCard with logo, title, tags, and copy footer", () => {
    render(
      <CatalogCard
        title="gemma-4-26b-a4b-it"
        subtitle="google"
        badge={<span>Text Generation</span>}
        description="Gemma 4 is Google's most intelligent family of open models."
        tags={["Apr 2, 2026", "256,000 max context", "Function calling"]}
        footerLinks={[{ label: "Terms", href: "https://google.com/terms" }]}
        copyValue="google/gemma-4-26b-a4b-it"
      />,
    );
    expect(screen.getByText("gemma-4-26b-a4b-it")).toBeTruthy();
    expect(screen.getByText("google")).toBeTruthy();
    expect(screen.getByText("Text Generation")).toBeTruthy();
    expect(screen.getByText("Gemma 4 is Google's most intelligent family of open models.")).toBeTruthy();
    expect(screen.getByText("Apr 2, 2026")).toBeTruthy();
    expect(screen.getByText("256,000 max context")).toBeTruthy();
    expect(screen.getByText("Function calling")).toBeTruthy();
    expect(screen.getByText("Terms")).toBeTruthy();
    expect(screen.getByText("Copy ID")).toBeTruthy();
  });
});

describe("Sparkline", () => {
  it("renders an svg for numeric data", () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5]} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
