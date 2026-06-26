import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { APP_DENSITY_CHART_HEIGHT, appDensityClass } from "../../design/app-density";
import { ChartPanel } from "../data/ChartPanel";
import { MetricRow } from "../data/MetricRow";
import { Page } from "./Page";
import { Section } from "./Section";
import { StatTile } from "../surfaces/StatTile";

describe("appDensityClass", () => {
  it("returns tighter page column classes for compact density", () => {
    expect(appDensityClass("pageColumn", "compact")).toContain("max-w-none");
    // Default keeps a (wide) max-width cap; compact runs full-bleed.
    expect(appDensityClass("pageColumn", "default")).not.toContain("max-w-none");
    expect(appDensityClass("pageColumn", "default")).toContain("max-w-");
  });

  it("lowers default chart height for compact density", () => {
    expect(APP_DENSITY_CHART_HEIGHT.compact).toBeLessThan(APP_DENSITY_CHART_HEIGHT.default);
  });
});

describe("Page density", () => {
  it("sets data-density on the page root", () => {
    const { container } = render(
      <Page title="Security" density="compact">
        <p>Body</p>
      </Page>,
    );
    expect(container.querySelector(".aui-app-page")?.getAttribute("data-density")).toBe(
      "compact",
    );
  });

  it("cascades compact spacing to descendant blocks", () => {
    render(
      <Page title="Security" density="compact">
        <Section title="Overview">
          <StatTile label="Threats" value="12" />
          <MetricRow
            metrics={[
              { id: "a", label: "Blocked", value: "99" },
              { id: "b", label: "Alerts", value: "3" },
            ]}
          />
        </Section>
      </Page>,
    );
    expect(screen.getByText("Threats")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
  });
});

describe("ChartPanel density", () => {
  it("uses compact plot height when nested under a compact page", () => {
    render(
      <Page title="Analytics" density="compact">
        <ChartPanel title="Trends" />
      </Page>,
    );
    expect(screen.getByText("Trends")).toBeTruthy();
  });
});
