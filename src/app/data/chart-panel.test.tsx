import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import type { ChartArtifact } from "../../artifacts/types";
import { ChartPanel } from "./ChartPanel";

const artifact: ChartArtifact = {
  type: "chart",
  chartType: "bar",
  data: [
    { name: "a", count: 3 },
    { name: "b", count: 2 },
  ],
  xKey: "name",
  dataKey: "count",
};

// Regression: a `{cond && <X/>}` guard yields `false` (not `undefined`) when the
// condition is falsy. The body selector must treat that `false` as "no children"
// and fall through to the artifact, rather than rendering an empty card. See the
// `chartpanel-children-clobbers-artifact` memory.
describe("ChartPanel children/artifact resolution", () => {
  it("renders the artifact when a falsy `&&` guard yields `false` children", () => {
    const empty = false; // i.e. `bySubreddit.length === 0` when data is present
    const { container, queryByText } = render(
      <ChartPanel title="Posts by subreddit" artifact={artifact}>
        {empty && <span>No posts yet</span>}
      </ChartPanel>,
    );

    expect(container.querySelector(".aui-artifact-chart")).toBeTruthy();
    expect(queryByText("No chart")).toBeNull();
  });

  it.each([null, undefined, true, false] as const)(
    "falls through non-renderable child (%p) to the artifact",
    (child) => {
      const { container } = render(
        <ChartPanel artifact={artifact}>{child}</ChartPanel>,
      );
      expect(container.querySelector(".aui-artifact-chart")).toBeTruthy();
    },
  );

  it("renders real children instead of the artifact", () => {
    const { container, getByText } = render(
      <ChartPanel artifact={artifact}>
        <div>Custom chart</div>
      </ChartPanel>,
    );
    expect(getByText("Custom chart")).toBeTruthy();
    expect(container.querySelector(".aui-artifact-chart")).toBeNull();
  });

  it("shows the empty state when the guard is true and there is no artifact", () => {
    const empty = true;
    const { getByText, container } = render(
      <ChartPanel title="Posts by subreddit">
        {empty && <span>No posts yet</span>}
      </ChartPanel>,
    );
    expect(getByText("No posts yet")).toBeTruthy();
    expect(container.querySelector(".aui-artifact-chart")).toBeNull();
  });

  it("renders the `No chart` fallback only when neither children nor artifact exist", () => {
    const { getByText } = render(<ChartPanel title="Empty" />);
    expect(getByText("No chart")).toBeTruthy();
  });

  it("shows a skeleton while loading, before consulting children/artifact", () => {
    const { container } = render(
      <ChartPanel title="Loading" artifact={artifact} loading>
        {false}
      </ChartPanel>,
    );
    expect(container.querySelector(".aui-artifact-chart")).toBeNull();
    expect(queryByTextContent(container, "No chart")).toBeNull();
  });
});

function queryByTextContent(container: HTMLElement, text: string): Element | null {
  return (
    Array.from(container.querySelectorAll("*")).find(
      (el) => el.textContent === text,
    ) ?? null
  );
}
