import { z } from "zod";
import { sections } from "./data";

const preparerSchema = z.object({
  name: z.string().min(1, "Required").max(200),
  completionDate: z.coerce.date(),
  engagementName: z.string().min(1, "Required").max(200),
  recipientEmail: z.string().email("Invalid email").max(254),
});

// Build per-question answer schema dynamically
const allQuestions = sections.flatMap((s) => s.questions);

const answersShape: Record<string, z.ZodTypeAny> = {};
for (const q of allQuestions) {
  answersShape[q.id] = z.object({
    value: q.allowsNA
      ? z.enum(["yes", "no", "na"], { required_error: "Required" })
      : z.enum(["yes", "no"], { required_error: "Required" }),
    note: z.string().max(5000).optional(),
  });
}

export const submissionSchema = z.object({
  preparer: preparerSchema,
  answers: z.object(
    answersShape as Record<
      string,
      z.ZodObject<{
        value: z.ZodEnum<[string, ...string[]]>;
        note: z.ZodOptional<z.ZodString>;
      }>
    >,
  ),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export function getMissingQuestionIds(
  answers: Partial<Record<string, { value?: string }>>,
): string[] {
  return allQuestions
    .filter((q) => {
      const a = answers[q.id];
      return !a?.value;
    })
    .map((q) => q.id);
}
