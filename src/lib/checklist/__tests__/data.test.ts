import { describe, it, expect } from "vitest";
import { sections } from "../data";
import { slugifyEngagement } from "../../engagement";

const allQuestions = sections.flatMap((s) => s.questions);

describe("checklist data", () => {
  it("has exactly 12 sections (IVS excluded)", () => {
    expect(sections).toHaveLength(12);
  });

  it("has exactly 83 questions in total", () => {
    expect(allQuestions).toHaveLength(83);
  });

  it("does not contain IVS question ids q9, q10, or q11", () => {
    const ids = allQuestions.map((q) => q.id);
    expect(ids).not.toContain("q9");
    expect(ids).not.toContain("q10");
    expect(ids).not.toContain("q11");
  });

  it("q4 allows N/A", () => {
    const q4 = allQuestions.find((q) => q.id === "q4");
    expect(q4).toBeDefined();
    expect(q4?.allowsNA).toBe(true);
  });

  it("q1 does not allow N/A", () => {
    const q1 = allQuestions.find((q) => q.id === "q1");
    expect(q1).toBeDefined();
    expect(q1?.allowsNA).toBe(false);
  });
});

describe("slugifyEngagement", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyEngagement("Acme Corp 2024")).toBe("acme-corp-2024");
  });

  it("collapses multiple separators into one hyphen", () => {
    expect(slugifyEngagement("Hello   World---Test")).toBe("hello-world-test");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugifyEngagement("  test  ")).toBe("test");
  });

  it("truncates to 80 characters", () => {
    const long = "a".repeat(100);
    expect(slugifyEngagement(long)).toHaveLength(80);
  });

  it("throws on blank input", () => {
    expect(() => slugifyEngagement("   ")).toThrow("Engagement name cannot be empty");
  });

  it("handles special characters", () => {
    expect(slugifyEngagement("Smith & Jones (2025)")).toBe("smith-jones-2025");
  });
});
