# Phase 05 — Deploy & Verify

## Context links
- Plan: [plan.md](./plan.md)
- Depends on: Phases 01–04. Phase 04 is technically optional but strongly recommended before this one.

## Overview
- Date: 2026-05-10
- Description: Swap env vars in Vercel, deploy, run the three production smoke paths from the original Phase 07 (happy / incomplete / recipient-override), confirm a final `git grep` is clean, and append optional VPS deploy notes for future reference.
- Priority: P0 (release-blocker)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Vercel env vars set in the dashboard apply to new deployments only — promote a fresh deploy after editing.
- The basic-auth middleware blocks Vercel's automated preview screenshotting too, which is fine for an internal tool.
- Gmail SMTP from a Vercel data center IP works at low volume but counts against the sender mailbox's daily limit (Workspace 2k recipients/day; consumer 500). Document, don't enforce.

## Requirements
- Vercel env vars (Production + Preview) set:
  - `SMTP_HOST` (optional — leave unset to default to `smtp.gmail.com`)
  - `SMTP_PORT` (optional — defaults to 465)
  - `SMTP_USER` ✅ required
  - `SMTP_PASS` ✅ required (App Password, no spaces)
  - `EMAIL_FROM` (optional — set if a Workspace alias is being used)
  - `BASIC_AUTH_USER` ✅ required (already set from previous deploy)
  - `BASIC_AUTH_PASS` ✅ required
  - **Removed**: `RESEND_API_KEY` (delete from Vercel after first successful new deploy, not before — gives one-step rollback if needed).
- 3 production smoke paths green (see Implementation Steps).
- Final repo state: zero `resend` references in `src/`, `scripts/`, `package.json`, `pnpm-lock.yaml`, `.env.example`, `README.md`. Only `plans/20260505-2006-...` may still mention it (history).

## Architecture
No code changes in this phase — purely deploy + verification.

## Related code files
None modified. Files inspected during smoke:
- `src/server/submit-checklist.ts` (logs reviewed for SMTP errors)
- Vercel function logs

## Implementation Steps
1. **Pre-deploy local check**: with Phase 01–04 merged on `develop`, run locally:
   - `pnpm build` → success.
   - `pnpm smoke:email <your-test-address>` → email arrives with PDF.
2. **Vercel env**:
   - Add `SMTP_USER`, `SMTP_PASS`, optional `EMAIL_FROM` to Production + Preview.
   - Leave `RESEND_API_KEY` in place for now — it's just unread.
3. **Deploy**: `git push origin develop` (or whatever triggers the Vercel build). Wait for green deployment.
4. **Smoke 1 — happy path**:
   - Open the Vercel URL → Basic Auth prompt → submit a fully-filled form with `recipientEmail` = a personal address you can check.
   - Verify: email arrives within 30s, From shows the configured Gmail/alias, Subject matches `Completed CBV Practice Inspection Checklist - <Engagement Name>`, PDF attached and named `cbv-checklist-<slug>-<yyyy-MM-dd>.pdf`, body shows correct branch (no-No vs with-No).
5. **Smoke 2 — incomplete submit**:
   - Leave several questions blank, click COMPLETE.
   - Verify: red banner appears, no email is sent (check inbox AND Vercel function logs for absence of `[submitChecklist]` send line).
6. **Smoke 3 — recipient override**:
   - Change recipient to a *different* address you control, submit.
   - Verify: email goes to the new address only; default `connect@aspenval.com` does NOT receive a copy.
7. **Force a failure** (optional but recommended): in Vercel, temporarily set `SMTP_PASS` to a wrong value, redeploy, submit. Confirm UI shows "Email delivery failed. Please retry." and Vercel logs show `code: 'EAUTH'`. Restore the correct password and redeploy.
8. **Cleanup**: delete `RESEND_API_KEY` from Vercel env. Confirm subsequent submit still succeeds (proves nothing was secretly still depending on it).
9. **Final repo grep**: `git grep -i 'resend\|RESEND_API_KEY' -- ':!plans/20260505-*'` returns zero hits.

## Todo list
- [ ] Local `pnpm build` green
- [ ] Local `pnpm smoke:email` green
- [ ] Vercel env vars set
- [ ] Deploy succeeds
- [ ] Smoke 1: happy path
- [ ] Smoke 2: incomplete (no email sent)
- [ ] Smoke 3: recipient override
- [ ] Optional: forced EAUTH failure shows correct UX + log
- [ ] `RESEND_API_KEY` removed from Vercel
- [ ] Final `git grep` clean

## Success Criteria
- All 3 smoke paths pass.
- No regression in Basic Auth gate, form validation, PDF generation, or duplicate-submit dedupe.
- Vercel function logs for a successful submit show exactly one `[submitChecklist]`-prefixed log only on errors (no log line on success — matches existing convention).

## Risk Assessment
- **Vercel cold start + SMTP exceeds 10s.** If observed: document the option to add `export const maxDuration = 30` to the route segment that hosts the Server Action (Hobby cap is 10s for non-streaming; `maxDuration` extension requires Pro). If Hobby-only, the mitigation is to pre-warm the function or accept occasional cold-start failures and rely on user retry.
- **Gmail rate-limits / temporarily blocks the App Password** after suspicious activity. Mitigation: regenerate App Password; document in a one-liner inside README's Gmail section.
- **Wrong `EMAIL_FROM` alias** (set to a domain/user you don't own) → Gmail silently rewrites to `SMTP_USER` or rejects. Mitigation: leave `EMAIL_FROM` unset until Workspace send-as alias is verified.

## Security Considerations
- Rotate `SMTP_PASS` (regenerate App Password) when team membership changes.
- Vercel env vars are encrypted at rest; team access controls apply. No additional secret store needed at this size.
- Confirm Vercel logs don't display `SMTP_PASS` (they shouldn't — Nodemailer doesn't log credentials, and our error handler explicitly only logs `code/command/responseCode/response/message`).

## Appendix — VPS / Docker deploy notes (not executed in this phase)
If the project is later moved to a long-lived Node host:
1. Set `SMTP_POOL=true` to enable connection pooling.
2. Optionally raise `socketTimeout` if your host has higher tolerance than Vercel's 10s.
3. Basic Auth middleware still applies — Next middleware works on Node runtime hosts identically to Edge.
4. Nodemailer + Gmail SMTP works through any cloud provider that allows outbound TCP 465 (most do; some require explicit egress rules).
5. No code change needed for the move — env-only.

## Next steps
Done. Migration complete. Update plan status fields to "Complete" once each phase ships and link the merged commit hashes here.
