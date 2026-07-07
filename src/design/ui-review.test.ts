import { describe, expect, it } from "bun:test";

import { reviewGeneratedUi, UI_REVIEW_AGENT_INSTRUCTIONS } from "./ui-review";

describe("reviewGeneratedUi", () => {
  it("passes clean UI with no revision prompt", () => {
    const review = reviewGeneratedUi(
      `<span className="text-primary bg-muted">Revenue</span>`,
    );
    expect(review.passed).toBe(true);
    expect(review.revisionPrompt).toBeNull();
    expect(review.report).toBe("");
  });

  it("fails slop and returns an actionable revision prompt naming the lines", () => {
    const review = reviewGeneratedUi(
      `<span className="text-blue-600">$1</span>`,
    );
    expect(review.passed).toBe(false);
    expect(review.revisionPrompt).toContain("anti-slop");
    expect(review.revisionPrompt).toContain("raw-color");
  });

  it("treats strict as a no-op in v2 (taste moved to the critique rubric)", () => {
    const tasteOnly = `<span className="text-3xl font-bold">$1</span>`;
    expect(reviewGeneratedUi(tasteOnly).passed).toBe(true);
    expect(reviewGeneratedUi(tasteOnly, { strict: true }).passed).toBe(true);
  });

  it("ships a self-review system prompt", () => {
    expect(UI_REVIEW_AGENT_INSTRUCTIONS).toContain("anti-slop");
    expect(UI_REVIEW_AGENT_INSTRUCTIONS.length).toBeGreaterThan(100);
  });
});
