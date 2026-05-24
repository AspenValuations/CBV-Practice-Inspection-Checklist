import { z } from "zod";
import { sections } from "./data";
import { computeInactiveSet, DEFAULT_GATES } from "./gates";
import type { Gates } from "./types";

const preparerSchema = z.object({
  name: z.string().min(1, "Required").max(200),
  completionDate: z.coerce.date(),
  valuationDate: z.coerce.date(),
  reviewerName: z.string().min(1, "Required").max(200),
  engagementName: z.string().min(1, "Required").max(200),
  recipientEmail: z.string().email("Invalid email").max(254),
});

export const gatesSchema = z.object({
  g1Oral: z.enum(["yes", "no"]).nullable(),
  g2Standards: z.enum(["cbv", "ivs"]).nullable(),
  g3ConclusionType: z
    .enum(["comprehensive", "estimate", "calculation", "ivs_standard"])
    .nullable(),
  g4ScopeLimitations: z.enum(["yes", "no"]).nullable(),
  g5EngagementLetter: z.enum(["yes", "no"]).nullable(),
  g6RepLetter: z.enum(["yes", "no_internal_docs"]).nullable(),
});

// Accept any string for value at the record-level; superRefine below enforces
// valid enum values and presence for active (non-greyed) questions. Empty
// string is the form's "not yet answered" sentinel.
const answerEntrySchema = z.object({
  value: z.string().optional(),
  note: z.string().max(5000).optional(),
});

const allQuestions = sections.flatMap((s) => s.questions);

export const submissionSchema = z
  .object({
    preparer: preparerSchema,
    // Gates default to all-null so existing form submissions (pre-Phase 03)
    // continue to validate with all questions treated as active.
    gates: gatesSchema.default(DEFAULT_GATES),
    answers: z.record(answerEntrySchema),
  })
  .superRefine((data, ctx) => {
    const inactiveSet = computeInactiveSet(data.gates as Gates);
    for (const q of allQuestions) {
      if (inactiveSet.has(q.id)) continue; // greyed out — not required
      const answer = data.answers[q.id];
      if (!answer?.value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["answers", q.id, "value"],
        });
      }
      if (!q.allowsNA && answer?.value === "na") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "N/A is not allowed for this question",
          path: ["answers", q.id, "value"],
        });
      }
    }
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;

export function getMissingQuestionIds(
  answers: Partial<Record<string, { value?: string }>>,
  gates?: Gates | null,
): string[] {
  const inactiveSet = computeInactiveSet(gates ?? null);
  return allQuestions
    .filter((q) => {
      if (inactiveSet.has(q.id)) return false;
      const a = answers[q.id];
      return !a?.value;
    })
    .map((q) => q.id);
}
