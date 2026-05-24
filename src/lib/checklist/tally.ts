import type { ChecklistSection } from "./types";

export interface SectionTally {
  yes: number;
  no: number;
  na: number;
  unanswered: number;
  totalActive: number;
}

export function tallySection(
  section: ChecklistSection,
  answers: Record<string, { value?: string } | undefined>,
  inactive: Set<string>,
): SectionTally {
  let yes = 0,
    no = 0,
    na = 0,
    unanswered = 0,
    totalActive = 0;

  for (const q of section.questions) {
    if (inactive.has(q.id)) continue;
    totalActive++;
    const v = answers[q.id]?.value;
    if (v === "yes") yes++;
    else if (v === "no") no++;
    else if (v === "na") na++;
    else unanswered++;
  }
  return { yes, no, na, unanswered, totalActive };
}

export function tallyAll(
  sections: ChecklistSection[],
  answers: Record<string, { value?: string } | undefined>,
  inactive: Set<string>,
): SectionTally {
  const totals: SectionTally = { yes: 0, no: 0, na: 0, unanswered: 0, totalActive: 0 };
  for (const section of sections) {
    const t = tallySection(section, answers, inactive);
    totals.yes += t.yes;
    totals.no += t.no;
    totals.na += t.na;
    totals.unanswered += t.unanswered;
    totals.totalActive += t.totalActive;
  }
  return totals;
}
