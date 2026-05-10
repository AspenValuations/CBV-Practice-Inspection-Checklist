"use server";

import { submissionSchema } from "@/lib/checklist/schema";
import { sections } from "@/lib/checklist/data";
import { slugifyEngagement, formatDate } from "@/lib/engagement";
import { renderChecklistPdf } from "./pdf/render";
import { renderChecklistEmail, buildNoAnswersList, buildEmailSubject } from "./email/render";
import { sendChecklistEmail } from "./mailer";
import { isDuplicate, hashPayload } from "./dedupe";
import type { Submission } from "@/lib/checklist/types";

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitChecklist(input: unknown): Promise<SubmitResult> {
  // 1. Validate
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed. Please check all fields." };
  }

  const data = parsed.data;

  // Cast to Submission (dates are coerced by Zod; Zod's dynamically-built
  // answers schema widens `value` to string — the cast is safe because Zod
  // already validated the union shape before we reach this point)
  const submission: Submission = {
    preparer: {
      ...data.preparer,
      completionDate: data.preparer.completionDate,
      valuationDate: data.preparer.valuationDate,
    },
    answers: data.answers as unknown as Submission["answers"],
  };

  // 2. Dedupe check
  const payloadHash = hashPayload(data);
  if (isDuplicate(payloadHash)) {
    return { ok: true }; // silently succeed
  }

  // 3. Build derived values
  const engagementName = data.preparer.engagementName;
  const engagementSlug = slugifyEngagement(engagementName);
  const dateStr = formatDate(data.preparer.completionDate);
  const valuationDateStr = formatDate(data.preparer.valuationDate);
  const pdfFilename = `cbv-checklist-${engagementSlug}-${dateStr}.pdf`;
  const subject = buildEmailSubject(engagementName);

  // 4. Build no-answers list
  const noAnswers = buildNoAnswersList(sections, data.answers as Record<string, { value: string; note?: string }>);

  // 5. Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderChecklistPdf(submission);
  } catch (err) {
    console.error("[submitChecklist] PDF generation error:", err);
    return { ok: false, error: "Failed to generate PDF. Please try again." };
  }

  // 6. Render email
  let emailContent: { html: string; text: string };
  try {
    emailContent = await renderChecklistEmail({
      engagementName,
      preparerName: data.preparer.name,
      reviewerName: data.preparer.reviewerName,
      completionDate: dateStr,
      valuationDate: valuationDateStr,
      noAnswers,
    });
  } catch (err) {
    console.error("[submitChecklist] Email render error:", err);
    return { ok: false, error: "Failed to compose email. Please try again." };
  }

  // 7. Send email
  try {
    await sendChecklistEmail({
      to: data.preparer.recipientEmail,
      subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [{ filename: pdfFilename, content: pdfBuffer }],
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      code?: string;
      command?: string;
      responseCode?: number;
      response?: string;
    };
    console.error("[submitChecklist] SMTP send failed:", {
      code: e.code,
      command: e.command,
      responseCode: e.responseCode,
      response: e.response,
      message: e.message,
    });
    return { ok: false, error: "Email delivery failed. Please retry." };
  }

  return { ok: true };
}
