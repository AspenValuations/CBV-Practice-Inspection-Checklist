import { describe, it, expect } from "vitest";
import {
  buildEmailSubject,
  buildNoAnswersList,
  renderChecklistEmail,
} from "../render";
import type { ChecklistSection } from "@/lib/checklist/types";
import { sections as realSections } from "@/lib/checklist/data";

describe("buildEmailSubject", () => {
  it("matches the spec verbatim with hyphen-space", () => {
    expect(buildEmailSubject("Acme Corp")).toBe(
      "Completed CBV Practice Inspection Checklist - Acme Corp",
    );
  });

  it("does not slugify or alter the engagement name", () => {
    expect(buildEmailSubject("Big Co. Inc. (2026 Q1)")).toBe(
      "Completed CBV Practice Inspection Checklist - Big Co. Inc. (2026 Q1)",
    );
  });

  it("preserves whitespace and unicode", () => {
    expect(buildEmailSubject("  Pháp lý — 2026  ")).toBe(
      "Completed CBV Practice Inspection Checklist -   Pháp lý — 2026  ",
    );
  });
});

describe("buildNoAnswersList", () => {
  const fakeSections: ChecklistSection[] = [
    {
      title: "Section A",
      questions: [
        { id: "a1", number: 1, allowsNA: false, text: "first A" },
        { id: "a2", number: 2, allowsNA: true, text: "second A" },
      ],
    },
    {
      title: "Section B",
      questions: [
        { id: "b1", number: 3, allowsNA: false, text: "first B" },
        { id: "b2", number: 4, allowsNA: false, text: "second B" },
      ],
    },
  ];

  it("returns an empty array when no answer is 'no'", () => {
    const answers = {
      a1: { value: "yes" },
      a2: { value: "na" },
      b1: { value: "yes" },
      b2: { value: "yes" },
    };
    expect(buildNoAnswersList(fakeSections, answers)).toEqual([]);
  });

  it("returns only 'no' answers, preserving section + question order", () => {
    const answers = {
      a1: { value: "no" },
      a2: { value: "yes" },
      b1: { value: "no" },
      b2: { value: "no" },
    };
    expect(buildNoAnswersList(fakeSections, answers)).toEqual([
      { sectionTitle: "Section A", number: 1, text: "first A" },
      { sectionTitle: "Section B", number: 3, text: "first B" },
      { sectionTitle: "Section B", number: 4, text: "second B" },
    ]);
  });

  it("ignores answers for unknown question ids", () => {
    const answers = {
      a1: { value: "no" },
      ghost: { value: "no" },
    };
    const result = buildNoAnswersList(fakeSections, answers);
    expect(result).toHaveLength(1);
    expect(result[0]?.number).toBe(1);
  });

  it("treats missing question entry as not-no (no throw)", () => {
    const answers = {
      a1: { value: "no" },
      // a2, b1, b2 omitted
    };
    expect(buildNoAnswersList(fakeSections, answers)).toEqual([
      { sectionTitle: "Section A", number: 1, text: "first A" },
    ]);
  });

  it("works with the real 12-section data", () => {
    const answers: Record<string, { value: string }> = {};
    for (const s of realSections) {
      for (const q of s.questions) {
        answers[q.id] = { value: "yes" };
      }
    }
    expect(buildNoAnswersList(realSections, answers)).toEqual([]);

    // Flag q1 as no
    answers["q1"] = { value: "no" };
    const result = buildNoAnswersList(realSections, answers);
    expect(result).toHaveLength(1);
    expect(result[0]?.number).toBe(1);
  });
});

describe("renderChecklistEmail", () => {
  const baseArgs = {
    engagementName: "Acme",
    preparerName: "Alice",
    reviewerName: "Bob",
    completionDate: "2026-05-10",
    valuationDate: "2026-04-30",
  };

  it("returns both html and text", async () => {
    const out = await renderChecklistEmail({ ...baseArgs, noAnswers: [] });
    expect(typeof out.html).toBe("string");
    expect(typeof out.text).toBe("string");
    expect(out.html.length).toBeGreaterThan(0);
    expect(out.text.length).toBeGreaterThan(0);
  });

  it("zero-No branch contains the exact spec sentence", async () => {
    const { html, text } = await renderChecklistEmail({
      ...baseArgs,
      noAnswers: [],
    });
    expect(html).toContain("No &quot;NO&quot; answer was selected.");
    expect(text).toContain('No "NO" answer was selected.');
  });

  it("with-No branch contains the spec sentence + question lines", async () => {
    const { html, text } = await renderChecklistEmail({
      ...baseArgs,
      noAnswers: [
        { sectionTitle: "Section A", number: 1, text: "first A" },
        { sectionTitle: "Section A", number: 2, text: "second A" },
        { sectionTitle: "Section B", number: 3, text: "first B" },
      ],
    });
    expect(html).toContain("Below are the questions");
    expect(html).toContain("first A");
    expect(html).toContain("second A");
    expect(html).toContain("first B");
    // Plain text has Q-prefixed lines
    expect(text).toMatch(/Q1\.\s+first A/);
    expect(text).toMatch(/Q3\.\s+first B/);
  });

  it("escapes special HTML characters in engagement name (no injection)", async () => {
    const { html } = await renderChecklistEmail({
      ...baseArgs,
      engagementName: "<script>alert(1)</script>",
      noAnswers: [],
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes preparer/reviewer/dates in the body", async () => {
    const { text } = await renderChecklistEmail({
      ...baseArgs,
      noAnswers: [],
    });
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("2026-05-10");
    expect(text).toContain("2026-04-30");
  });
});
