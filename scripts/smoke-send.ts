import { renderChecklistEmail } from "@/server/email/render";
import { sendChecklistEmail, verifyTransport } from "@/server/mailer";
import { buildSubmission, type FixtureName } from "./fixtures/submissions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usage(msg?: string): never {
  if (msg) console.error(`error: ${msg}`);
  console.error(
    "usage: pnpm smoke:email <recipient-email> [empty|with-no]\n" +
      "  recipient-email: where to send the smoke test\n" +
      "  fixture:         'with-no' (default) or 'empty'",
  );
  process.exit(2);
}

async function main(): Promise<void> {
  const recipient = process.argv[2];
  const fixtureArg = (process.argv[3] ?? "with-no") as FixtureName;

  if (!recipient) usage("recipient-email is required");
  if (!EMAIL_RE.test(recipient)) usage(`'${recipient}' does not look like an email`);
  if (fixtureArg !== "empty" && fixtureArg !== "with-no") {
    usage(`fixture must be 'empty' or 'with-no', got '${fixtureArg}'`);
  }

  console.log(`[smoke] verifying SMTP transport ...`);
  try {
    await verifyTransport();
    console.log("[smoke] SMTP verify OK");
  } catch (err) {
    console.error("[smoke] SMTP verify FAILED:", err);
    process.exit(1);
  }

  console.log(`[smoke] building submission fixture: ${fixtureArg}`);
  const submission = buildSubmission(fixtureArg);

  console.log("[smoke] rendering email body ...");
  const { html, text, subject } = await renderChecklistEmail({
    preparer: submission.preparer,
    gates: submission.gates,
    answers: submission.answers,
    submittedAt: new Date(),
  });

  console.log(`[smoke] sending to ${recipient} (subject: ${subject}) ...`);
  try {
    const { messageId } = await sendChecklistEmail({
      to: recipient,
      subject,
      html,
      text,
      attachments: [], // no PDF — email is the compliance record
    });
    console.log(`[smoke] sent. messageId=${messageId}`);
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      code?: string;
      command?: string;
      responseCode?: number;
      response?: string;
    };
    console.error("[smoke] SMTP send FAILED:", {
      code: e.code,
      command: e.command,
      responseCode: e.responseCode,
      response: e.response,
      message: e.message,
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[smoke] unexpected error:", err);
  process.exit(1);
});
