import { describe, it, expect } from "vitest";
import { submissionSchema, getMissingQuestionIds } from "../schema";
import { DEFAULT_GATES } from "../gates";
import { sections } from "../data";
import type { Gates } from "../types";

const allNull: Gates = { ...DEFAULT_GATES };

function buildAllAnswers(
  override?: Record<string, { value?: string; note?: string }>,
): Record<string, { value: string; note?: string }> {
  const answers: Record<string, { value: string; note?: string }> = {};
  for (const s of sections) {
    for (const q of s.questions) {
      answers[q.id] = { value: q.allowsNA ? "na" : "yes" };
    }
  }
  return { ...answers, ...(override as Record<string, { value: string; note?: string }>) };
}

const basePreparer = {
  name: "Alice",
  reviewerName: "Bob",
  engagementName: "Acme Corp",
  recipientEmails: ["test@example.com"],
  completionDate: new Date("2026-05-10"),
  valuationDate: new Date("2026-04-30"),
};

describe("submissionSchema", () => {
  it("accepts valid input without gates (defaults to all-null)", () => {
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      answers: buildAllAnswers(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // gates defaulted to all null
      expect(result.data.gates.g1Oral).toBeNull();
    }
  });

  it("accepts valid input with explicit gates", () => {
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      gates: allNull,
      answers: buildAllAnswers(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects input with a missing active question", () => {
    const answers = buildAllAnswers({ q1: { value: "" } });
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      answers,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("q1"))).toBe(true);
    }
  });

  it("accepts missing answer on greyed question (G1 oral=no greys q5–q8)", () => {
    // Remove q5–q8 answers entirely — they should be skipped by superRefine
    const answers = buildAllAnswers({
      q5: { value: "" },
      q6: { value: "" },
      q7: { value: "" },
      q8: { value: "" },
    });
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      gates: { ...allNull, g1Oral: "no" },
      answers,
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing answer on greyed question (G4 scope=no greys q42–q43)", () => {
    const answers = buildAllAnswers({
      q42: { value: "" },
      q43: { value: "" },
    });
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      gates: { ...allNull, g4ScopeLimitations: "no" },
      answers,
    });
    expect(result.success).toBe(true);
  });

  it("rejects na value on question that does not allowsNA (q1)", () => {
    const answers = buildAllAnswers({ q1: { value: "na" } });
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      answers,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("q1"))).toBe(true);
    }
  });

  it("rejects malformed email", () => {
    const result = submissionSchema.safeParse({
      preparer: { ...basePreparer, recipientEmails: ["bad"] },
      answers: buildAllAnswers(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 5000 chars", () => {
    const result = submissionSchema.safeParse({
      preparer: basePreparer,
      answers: buildAllAnswers({ q1: { value: "yes", note: "x".repeat(5001) } }),
    });
    expect(result.success).toBe(false);
  });
});

describe("getMissingQuestionIds", () => {
  it("returns all Q ids when answers is empty", () => {
    const missing = getMissingQuestionIds({});
    expect(missing.length).toBe(83);
  });

  it("returns empty array when all questions answered", () => {
    const answers = buildAllAnswers();
    const missing = getMissingQuestionIds(answers);
    expect(missing).toHaveLength(0);
  });

  it("excludes greyed question ids from missing (G1 oral=no)", () => {
    const gates: Gates = { ...allNull, g1Oral: "no" };
    // answers with q5–q8 missing
    const answers = buildAllAnswers({ q5: {}, q6: {}, q7: {}, q8: {} });
    const missing = getMissingQuestionIds(
      answers as Partial<Record<string, { value?: string }>>,
      gates,
    );
    expect(missing).not.toContain("q5");
    expect(missing).not.toContain("q6");
    expect(missing).not.toContain("q7");
    expect(missing).not.toContain("q8");
  });

  it("includes active missing questions", () => {
    const answers = buildAllAnswers({ q1: { value: "" } });
    const missing = getMissingQuestionIds(
      answers as Partial<Record<string, { value?: string }>>,
    );
    expect(missing).toContain("q1");
  });
});
