import { describe, it, expect } from "vitest";
import { sections } from "../data";
import { DEFAULT_ANSWERS, DEFAULT_NO_NOTE } from "../defaults";

const allQuestionIds = new Set(sections.flatMap((s) => s.questions.map((q) => q.id)));
const entries = Object.entries(DEFAULT_ANSWERS);
const yesEntries = entries.filter(([, d]) => d.value === "yes");
const noEntries = entries.filter(([, d]) => d.value === "no");

describe("DEFAULT_ANSWERS", () => {
  it("has exactly 56 entries total (53 yes + 3 no)", () => {
    expect(entries).toHaveLength(56);
  });

  it("has exactly 53 yes entries", () => {
    expect(yesEntries).toHaveLength(53);
  });

  it("has exactly 3 no entries", () => {
    expect(noEntries).toHaveLength(3);
  });

  it("every id exists in the app dataset (no phantom ids)", () => {
    for (const [id] of entries) {
      expect(allQuestionIds.has(id), `${id} not found in data.ts`).toBe(true);
    }
  });

  it("does not target IVS ids q9, q10, q11", () => {
    const ids = entries.map(([id]) => id);
    expect(ids).not.toContain("q9");
    expect(ids).not.toContain("q10");
    expect(ids).not.toContain("q11");
  });

  it("no id appears in both yes and no lists", () => {
    const yesIds = new Set(yesEntries.map(([id]) => id));
    const noIds = noEntries.map(([id]) => id);
    for (const id of noIds) {
      expect(yesIds.has(id), `${id} appears in both yes and no`).toBe(false);
    }
  });

  it("Q69, Q85, Q86 are the 3 default-no questions with note", () => {
    for (const id of ["q69", "q85", "q86"]) {
      const d = DEFAULT_ANSWERS[id];
      expect(d, `${id} missing`).toBeDefined();
      expect(d?.value).toBe("no");
      expect(d?.note).toBe(DEFAULT_NO_NOTE);
    }
  });

  it("yes entries have no note", () => {
    for (const [id, d] of yesEntries) {
      expect(d.note, `${id} should not have a note`).toBeUndefined();
    }
  });

  it("DEFAULT_NO_NOTE matches the PDF verbatim", () => {
    expect(DEFAULT_NO_NOTE).toBe("See internal documentation on this procedure.");
  });
});
