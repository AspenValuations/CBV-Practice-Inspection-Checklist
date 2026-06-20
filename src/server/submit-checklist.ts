"use server";

import { submissionSchema } from "@/lib/checklist/schema";
import { renderChecklistEmail } from "./email/render";
import { sendChecklistEmail } from "./mailer";
import { isDuplicate, hashPayload } from "./dedupe";
import type { Gates } from "@/lib/checklist/types";

export type SubmitResult = { ok: true; recipientEmails: string[] } | { ok: false; error: string };

export async function submitChecklist(input: unknown): Promise<SubmitResult> {
  // 1. Validate
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed. Please check all fields." };
  }

  const data = parsed.data;

  // 2. Dedupe check
  const payloadHash = hashPayload(data);
  if (isDuplicate(payloadHash)) {
    return { ok: true, recipientEmails: data.preparer.recipientEmails }; // silently succeed
  }

  // 3. Render email (builds tally, flags, subject server-side)
  let emailContent: { html: string; text: string; subject: string };
  try {
    emailContent = await renderChecklistEmail({
      preparer: data.preparer,
      gates: data.gates as Gates,
      answers: data.answers as Record<string, { value?: string; note?: string }>,
      submittedAt: new Date(),
    });
  } catch (err) {
    console.error("[submitChecklist] Email render error:", err);
    return { ok: false, error: "Failed to compose email. Please try again." };
  }

  // 4. Send email (no PDF attachment — email is the compliance record per PS 130)
  try {
    await sendChecklistEmail({
      to: data.preparer.recipientEmails,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [],
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

  return { ok: true, recipientEmails: data.preparer.recipientEmails };
}
