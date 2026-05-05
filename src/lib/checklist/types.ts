export type AnswerValue = "yes" | "no" | "na";

export interface ChecklistQuestion {
  id: string;       // "q1", "q12", "q86" — gappy, IVS (q9/q10/q11) deliberately absent
  number: number;   // 1, 12, 86
  text: string;     // verbatim from PDF
  allowsNA: boolean;
  bullets?: string[]; // optional sub-bullets (q37, q38, q57, q66, q78)
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
  engagementName: string;
  recipientEmail: string;
}

export interface Submission {
  preparer: PrepareInfo;
  answers: Record<string, AnswerEntry>;
}
