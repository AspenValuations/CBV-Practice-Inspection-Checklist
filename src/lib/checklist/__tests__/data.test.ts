import { describe, it, expect } from "vitest";
import { sections } from "../data";
import { slugifyEngagement } from "../../engagement";
import { partsToString } from "../bolding";

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

  it("every question has a non-empty parts array", () => {
    for (const q of allQuestions) {
      expect(q.parts.length, `Q${q.number} (${q.id}) has empty parts`).toBeGreaterThan(0);
      const text = partsToString(q.parts);
      expect(text.trim().length, `Q${q.number} (${q.id}) parts produce empty text`).toBeGreaterThan(0);
    }
  });

  it("bold parts have truthy bold flag", () => {
    const boldParts = allQuestions.flatMap((q) =>
      q.parts.filter((p) => p.bold === true),
    );
    // At minimum Q1–Q8 + Q12–Q13 + Q17–Q18 + Q46–Q47 + Q70–Q71 are curated
    expect(boldParts.length).toBeGreaterThanOrEqual(16);
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
