import type { ChecklistSection, Gates, QPart } from "./types";

export interface Flag {
  kind: "engagement-letter" | "no-answer";
  sectionTitle?: string;
  qId?: string;
  qNumber?: number;
  parts?: QPart[];
  note?: string;
  actionLine: string;
}

const DEFAULT_ACTION_LINE = "→ REVIEW BEFORE ISSUANCE";
const EL_ACTION_LINE = "→ OBTAIN SIGNED ENGAGEMENT LETTER BEFORE ISSUANCE";

export function buildFlaggedItems(
  sections: ChecklistSection[],
  answers: Record<string, { value?: string; note?: string } | undefined>,
  gates: Gates | null,
  inactive: Set<string>,
): Flag[] {
  const flags: Flag[] = [];

  // Synthetic flag: no signed engagement letter
  if (gates?.g5EngagementLetter === "no") {
    flags.push({ kind: "engagement-letter", actionLine: EL_ACTION_LINE });
  }

  // Per-question "No" flags
  for (const section of sections) {
    for (const q of section.questions) {
      if (inactive.has(q.id)) continue;
      const entry = answers[q.id];
      if (entry?.value === "no") {
        flags.push({
          kind: "no-answer",
          sectionTitle: section.title,
          qId: q.id,
          qNumber: q.number,
          parts: q.parts,
          note: entry.note || undefined,
          actionLine: q.actionLine ?? DEFAULT_ACTION_LINE,
        });
      }
    }
  }

  return flags;
}
