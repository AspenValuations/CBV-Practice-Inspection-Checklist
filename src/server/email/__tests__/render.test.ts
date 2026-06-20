import { describe, it, expect } from "vitest";
import { renderChecklistEmail } from "../render";
import { buildEmailSubject } from "../subject";
import { sections } from "@/lib/checklist/data";
import { DEFAULT_GATES } from "@/lib/checklist/gates";
import type { PrepareInfo } from "@/lib/checklist/types";

const basePreparer: PrepareInfo = {
  name: "Alice",
  reviewerName: "Bob",
  engagementName: "Acme Corp",
  recipientEmails: ["rcpt@example.com"],
  completionDate: new Date("2026-05-10"),
  valuationDate: new Date("2026-04-30"),
};

function buildAllAnswers(noOnId?: string): Record<string, { value: string; note?: string }> {
  const answers: Record<string, { value: string; note?: string }> = {};
  for (const s of sections) {
    for (const q of s.questions) {
      answers[q.id] = { value: q.allowsNA ? "na" : "yes" };
    }
  }
  if (noOnId) answers[noOnId] = { value: "no" };
  return answers;
}

const submittedAt = new Date("2026-05-24T15:00:00Z");

describe("buildEmailSubject", () => {
  it("embeds client name, date, and no-flags suffix", () => {
    expect(buildEmailSubject({ clientName: "Acme Corp", submittedAt, flaggedCount: 0 })).toBe(
      "Acme Corp — CBV Practice Checklist — May 24, 2026 — No items flagged",
    );
  });

  it("uses singular 'item' when flaggedCount is 1", () => {
    const subj = buildEmailSubject({ clientName: "X", submittedAt, flaggedCount: 1 });
    expect(subj).toContain("1 item flagged");
    expect(subj).not.toContain("items flagged");
  });

  it("uses plural 'items' for 3 flags", () => {
    const subj = buildEmailSubject({ clientName: "X", submittedAt, flaggedCount: 3 });
    expect(subj).toContain("3 items flagged");
  });
});

describe("renderChecklistEmail", () => {
  it("returns html, text, and subject", async () => {
    const out = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(typeof out.html).toBe("string");
    expect(typeof out.text).toBe("string");
    expect(typeof out.subject).toBe("string");
    expect(out.html.length).toBeGreaterThan(0);
    expect(out.text.length).toBeGreaterThan(0);
  });

  it("HTML includes Dark Green brand colour (#1A322F) at least twice", async () => {
    const { html } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    const count = (html.match(/#1A322F/gi) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("HTML includes teal colour (#05B4C9)", async () => {
    const { html } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(html).toContain("#05B4C9");
  });

  it("HTML is under 100KB for all-yes submission", async () => {
    const { html } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(Buffer.byteLength(html, "utf8")).toBeLessThan(100 * 1024);
  });

  it("zero-flag case: subject says No items flagged", async () => {
    const { subject } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(subject).toContain("No items flagged");
  });

  it("one No answer: subject says 1 item flagged and HTML contains question text", async () => {
    const { html, subject } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers("q1"),
      submittedAt,
    });
    expect(subject).toContain("1 item flagged");
    expect(html).toContain("Q1");
  });

  it("HTML contains engagement name", async () => {
    const { html, text } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(html).toContain("Acme Corp");
    expect(text).toContain("Acme Corp");
  });

  it("HTML contains preparer and reviewer name", async () => {
    const { text } = await renderChecklistEmail({
      preparer: basePreparer,
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
  });

  it("escapes special HTML characters (no XSS)", async () => {
    const { html } = await renderChecklistEmail({
      preparer: { ...basePreparer, engagementName: "<script>alert(1)</script>" },
      gates: { ...DEFAULT_GATES },
      answers: buildAllAnswers(),
      submittedAt,
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
