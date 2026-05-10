import { describe, it, expect } from "vitest";
import { sections } from "@/lib/checklist/data";
import {
  buildEmptyNoSubmission,
  buildWithFiveNoSubmission,
  buildSubmission,
} from "../submissions";

const allQuestionIds = sections.flatMap((s) => s.questions.map((q) => q.id));

describe("smoke fixtures", () => {
  it("empty fixture has an entry for every question and zero 'no'", () => {
    const sub = buildEmptyNoSubmission();
    const ids = Object.keys(sub.answers);
    expect(ids.sort()).toEqual([...allQuestionIds].sort());
    const noCount = Object.values(sub.answers).filter(
      (a) => a.value === "no",
    ).length;
    expect(noCount).toBe(0);
  });

  it("empty fixture only uses 'na' on questions that allow it", () => {
    const sub = buildEmptyNoSubmission();
    for (const section of sections) {
      for (const q of section.questions) {
        const entry = sub.answers[q.id];
        expect(entry).toBeDefined();
        if (entry?.value === "na") {
          expect(q.allowsNA).toBe(true);
        }
      }
    }
  });

  it("with-no fixture has exactly 5 'no' answers", () => {
    const sub = buildWithFiveNoSubmission();
    const noCount = Object.values(sub.answers).filter(
      (a) => a.value === "no",
    ).length;
    expect(noCount).toBe(5);
  });

  it("with-no fixture spans at least 3 distinct sections", () => {
    const sub = buildWithFiveNoSubmission();
    const noIds = new Set(
      Object.entries(sub.answers)
        .filter(([, a]) => a.value === "no")
        .map(([id]) => id),
    );
    const sectionsHit = new Set<string>();
    for (const section of sections) {
      for (const q of section.questions) {
        if (noIds.has(q.id)) sectionsHit.add(section.title);
      }
    }
    expect(sectionsHit.size).toBeGreaterThanOrEqual(3);
  });

  it("buildSubmission dispatches by name", () => {
    expect(buildSubmission("empty")).toEqual(buildEmptyNoSubmission());
    expect(buildSubmission("with-no")).toEqual(buildWithFiveNoSubmission());
  });
});
