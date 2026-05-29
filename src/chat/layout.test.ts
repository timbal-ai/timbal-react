import { describe, expect, it } from "bun:test";

import {
  THREAD_DEFAULT_MAX_WIDTH,
  assistantMessageContentClass,
  assistantMessageRootClass,
  threadMessageColumnClass,
  userMessageRootClass,
} from "./layout";

describe("chat/layout", () => {
  it("uses thread-max-width CSS variable for column alignment", () => {
    expect(threadMessageColumnClass).toContain("max-w-(--thread-max-width)");
    expect(assistantMessageRootClass).toContain(threadMessageColumnClass);
    expect(userMessageRootClass).toContain(threadMessageColumnClass);
  });

  it("defaults max width to 44rem", () => {
    expect(THREAD_DEFAULT_MAX_WIDTH).toBe("44rem");
  });

  it("exposes assistant content padding", () => {
    expect(assistantMessageContentClass).toContain("px-2");
  });
});
