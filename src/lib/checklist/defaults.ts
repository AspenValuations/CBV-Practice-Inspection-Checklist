import type { AnswerValue } from "./types";

export const DEFAULT_NO_NOTE = "See internal documentation on this procedure.";

// Source: AV_CBV_Checklist_Default_Responses.pdf (Aspen R&D annotation, May 2026).
const DEFAULT_YES_NUMS = [
  1, 2, 3, 4, 13, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32,
  33, 36, 37, 39, 44, 45, 46, 48, 49, 50, 51, 54, 55, 56, 57, 58, 60, 61, 62,
  63, 64, 66, 70, 71, 72, 73, 74, 76, 78, 79, 80, 81, 82,
];
const DEFAULT_NO_NUMS = [69, 85, 86];

export interface DefaultAnswer {
  value: AnswerValue;
  note?: string;
}

export const DEFAULT_ANSWERS: Record<string, DefaultAnswer> = {
  ...Object.fromEntries(DEFAULT_YES_NUMS.map((n) => [`q${n}`, { value: "yes" as const }])),
  ...Object.fromEntries(
    DEFAULT_NO_NUMS.map((n) => [`q${n}`, { value: "no" as const, note: DEFAULT_NO_NOTE }]),
  ),
};
