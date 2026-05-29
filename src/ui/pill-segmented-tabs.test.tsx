import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PillSegmentedTabs } from "./pill-segmented-tabs";

describe("PillSegmentedTabs", () => {
  it("renders tabs and calls onChange", async () => {
    const user = userEvent.setup();
    let value = "a";
    const onChange = (key: string) => {
      value = key;
    };

    const { rerender } = render(
      <PillSegmentedTabs
        value={value}
        onChange={onChange}
        tabs={[
          { key: "a", label: "Build" },
          { key: "b", label: "Manage" },
        ]}
        aria-label="Mode"
      />,
    );

    expect(screen.getByRole("group", { name: "Mode" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Build" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Manage" }));
    expect(value).toBe("b");

    rerender(
      <PillSegmentedTabs
        value={value}
        onChange={onChange}
        tabs={[
          { key: "a", label: "Build" },
          { key: "b", label: "Manage" },
        ]}
        aria-label="Mode"
      />,
    );
    expect(screen.getByRole("button", { name: "Manage" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});
