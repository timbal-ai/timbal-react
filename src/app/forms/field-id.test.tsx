import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { FieldSwitch } from "./FieldSwitch";
import { FieldSelect } from "./FieldSelect";
import { FieldInput } from "./Field";
import { FieldTextarea } from "./FieldTextarea";

function switchIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('input[role="switch"]')).map(
    (el) => el.id,
  );
}

describe("Field control ids", () => {
  it("gives each unlabeled FieldSwitch a unique id (no collision)", () => {
    const { container } = render(
      <>
        <FieldSwitch label="A" />
        <FieldSwitch label="B" />
        <FieldSwitch label="C" />
      </>,
    );
    const ids = switchIds(container);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids.some((id) => id === "switch")).toBe(false);
  });

  it("associates each label with its own switch via htmlFor", () => {
    const { container } = render(
      <>
        <FieldSwitch label="A" />
        <FieldSwitch label="B" />
      </>,
    );
    const labels = Array.from(container.querySelectorAll("label"));
    const fors = labels.map((l) => l.getAttribute("for"));
    expect(new Set(fors).size).toBe(2);
    fors.forEach((f) => {
      expect(container.querySelector(`#${f}`)).toBeTruthy();
    });
  });

  it("respects an explicit id / name when provided", () => {
    const { container } = render(
      <>
        <FieldSwitch label="A" id="explicit-a" />
        <FieldSwitch label="B" name="explicit-b" />
      </>,
    );
    const ids = switchIds(container);
    expect(ids).toContain("explicit-a");
    expect(ids).toContain("explicit-b");
  });

  it("gives FieldSelect / FieldInput / FieldTextarea auto ids when unnamed", () => {
    const { container } = render(
      <>
        <FieldSelect label="One">
          <option value="x">x</option>
        </FieldSelect>
        <FieldSelect label="Two">
          <option value="y">y</option>
        </FieldSelect>
        <FieldInput label="Three" />
        <FieldTextarea label="Four" />
      </>,
    );
    const controls = Array.from(
      container.querySelectorAll("select, input, textarea"),
    );
    const ids = controls.map((el) => el.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
