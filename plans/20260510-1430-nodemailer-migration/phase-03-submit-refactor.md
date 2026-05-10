# Phase 03 — Submit Pipeline Refactor

## Context links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 01 (env), Phase 02 (mailer module).

## Overview
- Date: 2026-05-10
- Description: Replace the Resend send block in `src/server/submit-checklist.ts` with a call to `sendChecklistEmail()` from the new mailer. Map SMTP error codes to existing user-facing strings. Delete `src/server/resend-client.ts`.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Current send block lives at `src/server/submit-checklist.ts:78-101`. Everything before that (validation, dedupe, PDF gen, email render) is unchanged.
- The Server Action's public contract — `SubmitResult = { ok: true } | { ok: false; error: string }` — does not change. Form code (`src/components/checklist-form.tsx`) needs zero edits.
- Existing error UX strings to preserve: `"Email delivery failed. Please retry."` for any send failure. No need to surface SMTP codes to users.
- We DO want richer **server-side** logging: SMTP errors carry `code`, `command`, `responseCode`, `response`. Logging these (without the password) makes ops debugging much easier.

## Requirements
- `src/server/submit-checklist.ts` lines 78–101 replaced with a call to `sendChecklistEmail()`.
- `import { getResend } from "./resend-client";` removed.
- `import { env } from "./env";` removed if no longer used in this file (it was only used for `EMAIL_FROM` on the Resend call — `from` is now resolved inside the mailer).
- New import: `import { sendChecklistEmail } from "./mailer";`.
- Error handling:
  - Catch the rejected promise.
  - Log: `console.error("[submitChecklist] SMTP send failed:", { code, command, responseCode, response, message })`. Never log `err.stack` of an `EAUTH` error (it can include credential context in some setups — keep it minimal).
  - Return `{ ok: false, error: "Email delivery failed. Please retry." }` for ALL send failures (uniform UX).
- `src/server/resend-client.ts` deleted.
- `pnpm-lock.yaml` should already reflect the `resend` removal from Phase 01.

## Architecture
**Replacement block** (illustrative):
```ts
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
```

Compare to old block — the deleted parts are:
- `const resend = getResend();`
- `const result = await resend.emails.send({...})`
- `if (result.error) { ... }` branch (Resend returns errors in a result envelope; Nodemailer throws — single catch is enough).

## Related code files
- `src/server/submit-checklist.ts` (modified)
- `src/server/resend-client.ts` (deleted)
- `src/server/mailer.ts` (consumed, from Phase 02)

## Implementation Steps
1. Edit `src/server/submit-checklist.ts`:
   - Swap the import (`resend-client` → `mailer`).
   - Drop the `env` import if unused.
   - Replace lines 78–101 with the new try/catch.
2. `git rm src/server/resend-client.ts`.
3. `pnpm type-check` — must be fully green now.
4. `pnpm lint` — fix any unused-import warnings introduced.
5. `pnpm test` — existing tests must still pass (none of them mock the mail layer; if `data.test.ts` is the only test file, it's unaffected).
6. `git grep -i 'resend\|RESEND_API_KEY' -- src/ scripts/` must return zero hits.

## Todo list
- [ ] Refactor `submit-checklist.ts` send block
- [ ] Delete `resend-client.ts`
- [ ] type-check green
- [ ] lint green
- [ ] vitest green
- [ ] grep clean

## Success Criteria
- Server Action signature unchanged; form code unmodified.
- Happy-path manual test (next phase) succeeds with PDF attached and correct From/Subject.
- Failure-path manual test (wrong `SMTP_PASS` in `.env.local`) returns the standard "Email delivery failed. Please retry." with a `code: 'EAUTH'` log line on the server.

## Risk Assessment
- **Forgetting to remove `env` import** if it becomes unused → `next lint` warning. Trivial to fix; flagged here so it doesn't surprise the implementer.
- **Nodemailer error not having `.code`** for some classes of failure (e.g. timeout from socket layer can come as `Error: timeout`). Mitigation: log `message` always; `code` may be undefined.

## Security Considerations
- The `responseCode` and `response` fields from SMTP can contain the recipient address echoed back ("550 5.1.1 <foo@bar.com>: recipient rejected"). Recipient address is already user-supplied form data, not a secret — logging it server-side is fine.
- Do NOT log `data.preparer` or `pdfBuffer` in the catch block. Only the SMTP error fields above.

## Next steps
Phase 04 — smoke script + the long-deferred dev preview route.
