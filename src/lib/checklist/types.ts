export interface QPart {
  text: string;
  bold?: true;
}

export type AnswerValue = "yes" | "no" | "na";

export interface ChecklistQuestion {
  id: string;       // "q1", "q12", "q86" — gappy, IVS (q9/q10/q11) deliberately absent
  number: number;   // 1, 12, 86
  parts: QPart[];   // structured text with optional bold markers
  allowsNA: boolean;
  bullets?: string[]; // optional sub-bullets (q37, q38, q57, q66, q78)
  actionLine?: string; // reviewer action required (shown in modal + email); curated post-v2
}

export interface ChecklistSection {
  title: string;
  questions: ChecklistQuestion[];
}

export interface AnswerEntry {
  value: AnswerValue;
  note?: string;
}

export interface PrepareInfo {
  name: string;
  completionDate: Date;
  valuationDate: Date;
  reviewerName: string;
  engagementName: string;
  recipientEmails: string[];
}

export type ConclusionType =
  | "comprehensive"
  | "estimate"
  | "calculation"
  | "ivs_standard";

// Gate 3 options filtered by Gate 2:
//   g2Standards = "cbv" → g3ConclusionType in ["comprehensive","estimate","calculation"]
//   g2Standards = "ivs" → g3ConclusionType must be "ivs_standard" (auto-selected)
export interface Gates {
  g1Oral: "yes" | "no" | null;
  g2Standards: "cbv" | "ivs" | null;
  g3ConclusionType: ConclusionType | null;
  g4ScopeLimitations: "yes" | "no" | null;
  g5EngagementLetter: "yes" | "no" | null;
  g6RepLetter: "yes" | "no_internal_docs" | null;
}

export interface Submission {
  preparer: PrepareInfo;
  gates: Gates;
  answers: Record<string, AnswerEntry>;
}
