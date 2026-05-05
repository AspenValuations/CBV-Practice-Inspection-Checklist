# CBV Practice Inspection Checklist — Implementation Plan

**Date:** 2026-05-05
**Owner:** Solo dev
**Status:** Not started
**Stack:** Next.js 15 App Router + TS strict + Tailwind v4 + shadcn/ui + RHF/Zod + @react-pdf/renderer + Resend + Vercel
**Out of scope (deferred):** OpenAI/AI features (env var present, unused). Database persistence — email IS audit trail v1. Future upgrade path: Vercel Postgres (Neon) + Vercel Blob for retained PDFs.

## Source-of-truth content
- PDF: `2026-Valuation-Practice-Standards-Checklist-EN.pdf` (10pp, 86 Qs)
- Extract: `plans/20260505-2006-cbv-practice-inspection-checklist/research/pdf-extract.txt`
- IVS section excluded: Q9, Q10, Q11. Final count: **83 questions**.
- Per-Q answer: Yes/No, Yes/No/N/A (some), or special (Q9 IVS-vs-PS — excluded anyway).

## Phases

| # | Title | Status | Description |
|---|---|---|---|
| 01 | [Project Bootstrap](./phase-01-project-bootstrap.md) | Not started | Next.js 15 init, TS strict, Tailwind v4, shadcn init, ESLint/Prettier, env scaffold, Vercel link, pnpm. |
| 02 | [Checklist Data Model + Zod](./phase-02-data-model.md) | Not started | Encode 83 Qs in typed TS file. Mark allowsNA per-Q. Generate Zod schema. Slug helper. IVS exclusion documented. |
| 03 | [Form UI](./phase-03-form-ui.md) | Not started | Preparer block + sectioned Q list. shadcn Form + RadioGroup + Textarea + DatePicker. RHF wiring. A11y. Missed-Q highlight + scroll-to-first. |
| 04 | [Server Submission Pipeline](./phase-04-submission-pipeline.md) | Not started | Server Action: validate, build no-list, render PDF, send Resend email w/ attachment. Error surfacing. Idempotency (disable+payload-hash dedupe). |
| 05 | [PDF Template](./phase-05-pdf-template.md) | Not started | @react-pdf/renderer doc mirroring source structure. Header + preparer block + sections + Q rows. Page-break safe. PDF standard fonts. |
| 06 | [Email Template](./phase-06-email-template.md) | Not started | react-email body. Subject + 2 body branches (zero-No vs has-No-list w/ section + Q numbers). Plaintext fallback. Dev preview route. |
| 07 | [Auth & Deployment](./phase-07-auth-deploy.md) | Not started | Vercel Deployment Protection (Pro) OR basic-auth middleware (Hobby). Env vars. Resend DNS verification. Deploy + smoke test. |
| 08 | [Polish & QA](./phase-08-polish-qa.md) | Not started | Manual test matrix (incomplete / all-yes / has-No / long-notes / mobile). README. Lighthouse pass. |

## Cross-cutting decisions
- **Vercel plan: Hobby (Free).** Auth via `middleware.ts` Basic Auth (no Deployment Protection). `maxDuration` = 10s default — sufficient.
- **Recipient email is a form field**, editable, default `connect@aspenval.com`. Persisted in submission, used by Server Action as `to:`. Validated server-side (Zod email).
- Engagement Name → single `slugifyEngagement(name)` helper in `src/lib/engagement.ts`. Used by PDF filename, email subject, email body. Defined in Phase 02.
- Yes/No vs Yes/No/N/A is per-Q metadata (`allowsNA: boolean`) baked into data file. Zod uses `z.enum(['yes','no'])` or `z.enum(['yes','no','na'])` per Q. No runtime guessing.
- Submission shape: `{ preparer: { name, completionDate, engagementName, recipientEmail }, answers: Record<questionId, { value, note? }> }`. Question IDs are stable (`q1`, `q2`, …, `q86`; `q9`/`q10`/`q11` absent).
- Validation error UX: top alert lists missing Q numbers + click-to-jump; per-row red ring; aria-live=assertive; `scrollIntoView({ block: 'center' })` + focus on first missed.
- All Server Actions: `'use server'` + `export const runtime = 'nodejs'` on the route segment. Resend + react-pdf require Node, not Edge.
- **Note field always optional** (no conditional-required logic).
- **Date format: ISO `yyyy-MM-dd`** in PDF and email body (sortable, unambiguous).
- **Brand: none** — Helvetica + plain text header. Logo can be added later without schema changes.
- **Email sender (`EMAIL_FROM`):** start with `onboarding@resend.dev` (Resend sandbox) until `aspenval.com` DNS verified. Switch via env var, no code change.

## Future / Deferred (NOT a phase)
- Persistence: Vercel Postgres (Neon) for submission rows + Vercel Blob for canonical PDF artifact. Add inside Server Action alongside Resend send when retention requirement materializes.
- AI assist: OpenAI key already in .env; defer until a real user request justifies token cost + confidentiality review.
- Submitter CC, draft-saving, conditional-required notes — out of scope v1.

## Decisions log (2026-05-05)
- Vercel Hobby (Free) → basic-auth middleware.
- Recipient email = form field (editable), default `connect@aspenval.com`.
- DNS not controlled yet → start on Resend sandbox sender, switch via env when DNS done.
- Notes always optional; no brand assets; ISO date format; single recipient.

## Open follow-ups (operational, not blocking implementation)
- Verify `aspenval.com` SPF/DKIM whenever ops can access DNS — then flip `EMAIL_FROM`.
- Decide whether to add an allowlist for the editable recipient email if abuse becomes a concern (currently mitigated by basic-auth gate).
