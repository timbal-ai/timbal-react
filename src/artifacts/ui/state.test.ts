import { describe, it, expect } from "bun:test";
import { getPath, resolveBindable, setPath, uiStateReducer } from "./state";

describe("getPath", () => {
  it("reads top-level keys", () => {
    expect(getPath({ a: 1 }, "a")).toBe(1);
  });

  it("reads nested keys", () => {
    expect(getPath({ a: { b: { c: 3 } } }, "a.b.c")).toBe(3);
  });

  it("returns undefined for missing paths", () => {
    expect(getPath({ a: 1 }, "b")).toBeUndefined();
    expect(getPath({ a: { b: 2 } }, "a.c")).toBeUndefined();
  });

  it("returns undefined when traversing through non-objects", () => {
    expect(getPath({ a: 1 }, "a.b")).toBeUndefined();
  });
});

describe("setPath", () => {
  it("sets a top-level key without mutating the source", () => {
    const source = { a: 1 };
    const next = setPath(source, "a", 2);
    expect(next).toEqual({ a: 2 });
    expect(source).toEqual({ a: 1 });
  });

  it("sets nested keys and clones intermediates", () => {
    const source = { a: { b: 1 } };
    const next = setPath(source, "a.b", 2);
    expect(next).toEqual({ a: { b: 2 } });
    expect((next as { a: unknown }).a).not.toBe(source.a);
    expect(source.a).toEqual({ b: 1 });
  });

  it("creates missing intermediate objects", () => {
    expect(setPath({}, "x.y.z", 7)).toEqual({ x: { y: { z: 7 } } });
  });

  it("replaces non-object intermediates with fresh objects", () => {
    expect(setPath({ a: 1 } as Record<string, unknown>, "a.b", 9)).toEqual({
      a: { b: 9 },
    });
  });
});

describe("uiStateReducer", () => {
  it("handles set", () => {
    expect(uiStateReducer({ a: 1 }, { type: "set", path: "a", value: 2 })).toEqual({ a: 2 });
  });

  it("toggles an existing boolean", () => {
    expect(uiStateReducer({ on: false }, { type: "toggle", path: "on" })).toEqual({ on: true });
    expect(uiStateReducer({ on: true }, { type: "toggle", path: "on" })).toEqual({ on: false });
  });

  it("flips undefined to true on toggle", () => {
    expect(uiStateReducer({}, { type: "toggle", path: "x" })).toEqual({ x: true });
  });

  it("handles replace", () => {
    expect(uiStateReducer({ a: 1 }, { type: "replace", state: { b: 2 } })).toEqual({ b: 2 });
  });
});

describe("resolveBindable", () => {
  it("returns literal values unchanged", () => {
    expect(resolveBindable("hi", {})).toBe("hi");
    expect(resolveBindable(42, {})).toBe(42);
  });

  it("resolves a $bind path", () => {
    expect(resolveBindable({ $bind: "user.name" }, { user: { name: "Ada" } })).toBe("Ada");
  });

  it("resolves to undefined for missing bindings", () => {
    expect(resolveBindable({ $bind: "missing" }, {})).toBeUndefined();
  });
});
