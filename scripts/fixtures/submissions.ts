import { sections } from "@/lib/checklist/data";
import type { AnswerEntry, Submission } from "@/lib/checklist/types";
import { DEFAULT_GATES } from "@/lib/checklist/gates";

const PREPARER = {
  name: "Smoke Test Preparer",
  reviewerName: "Smoke Test Reviewer",
  engagementName: "Smoke Test Engagement",
  recipientEmails: ["smoke@example.com"],
  completionDate: new Date("2026-05-10T00:00:00Z"),
  valuationDate: new Date("2026-04-30T00:00:00Z"),
};

function defaultValueFor(allowsNA: boolean): AnswerEntry {
  return { value: allowsNA ? "na" : "yes" };
}

function buildAllAnswers(): Record<string, AnswerEntry> {
  const answers: Record<string, AnswerEntry> = {};
  for (const section of sections) {
    for (const q of section.questions) {
      answers[q.id] = defaultValueFor(q.allowsNA);
    }
  }
  return answers;
}

export function buildEmptyNoSubmission(): Submission {
  return {
    preparer: { ...PREPARER },
    gates: { ...DEFAULT_GATES },
    answers: buildAllAnswers(),
  };
}

export function buildWithFiveNoSubmission(): Submission {
  const answers = buildAllAnswers();
  // Pick exactly 5 questions across at least 3 distinct sections.
  // Take the first question of the first 3 sections, plus 2 more from later
  // sections to total 5 spanning ≥3 sections.
  const targets: string[] = [];
  for (const section of sections) {
    if (section.questions.length === 0) continue;
    const firstId = section.questions[0]?.id;
    if (!firstId) continue;
    targets.push(firstId);
    if (targets.length === 3) break;
  }
  // Add 2 more from distinct later sections if available; otherwise fall back
  // to the second/third question of section 0/1.
  const seen = new Set(targets);
  outer: for (const section of sections.slice(3)) {
    for (const q of section.questions) {
      if (!seen.has(q.id)) {
        targets.push(q.id);
        seen.add(q.id);
        if (targets.length === 5) break outer;
      }
    }
  }
  if (targets.length < 5) {
    for (const section of sections) {
      for (const q of section.questions) {
        if (!seen.has(q.id)) {
          targets.push(q.id);
          seen.add(q.id);
          if (targets.length === 5) break;
        }
      }
      if (targets.length === 5) break;
    }
  }

  for (const id of targets) {
    answers[id] = { value: "no", note: "Smoke fixture flagged this as No." };
  }

  return {
    preparer: { ...PREPARER },
    gates: { ...DEFAULT_GATES },
    answers,
  };
}

export type FixtureName = "empty" | "with-no";

export function buildSubmission(name: FixtureName): Submission {
  return name === "empty" ? buildEmptyNoSubmission() : buildWithFiveNoSubmission();
}
