import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Field } from "../forms/Field";
import { SearchInput } from "../forms/SearchInput";
import { FilterBar } from "./FilterBar";
import { FilterField } from "./FilterField";

describe("FilterBar", () => {
  it("bottom-aligns controls when mixing search and labeled fields", () => {
    const { container } = render(
      <FilterBar>
        <SearchInput placeholder="Search alerts…" />
        <Field label="Severity">
          <select aria-label="Severity">
            <option>All severities</option>
          </select>
        </Field>
      </FilterBar>,
    );

    const bar = container.querySelector(".aui-app-filter-bar");
    expect(bar?.className).toContain("items-end");
    expect(bar?.className).not.toContain("items-center");
  });
});

describe("FilterField", () => {
  it("renders an optional label", () => {
    render(
      <FilterField label="Status">
        <button type="button">All statuses</button>
      </FilterField>,
    );
    expect(screen.getByText("Status")).toBeTruthy();
  });
});
