# Phase 04 — Server Submission Pipeline

## Context links
- Plan: [plan.md](./plan.md)
- Research: [research/researcher-02-pdf-email.md](./research/researcher-02-pdf-email.md)

## Overview
- Date: 2026-05-05
- Description: Server Action `submitChecklist` — Zod re-validate, build "No"-list, render PDF, send email via Resend, return result.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Server Actions only run in Node when colocated under a Node-runtime route — set `export const runtime = 'nodejs'` on the segment that imports the action OR put the action in a server module that the page imports.
- react-pdf `renderToBuffer` is async and Node-only.
- Resend SDK accepts `Buffer` for attachments — no manual base64.
- Idempotency: client-side disable-on-submit + server-side dedupe via in-memory LRU keyed on hash(payload + minute-bucket). Good enough for solo internal use; durable dedupe needs DB (deferred).

## Requirements
- File: `src/server/submit-checklist.ts` (server-only) exporting `submitChecklist(input: unknown): Promise<SubmitResult>` where `SubmitResult = { ok: true } | { ok: false; error: string }`.
- Validates input with `submissionSchema` from Phase 02. On failure: return `{ ok: false, error: 'Validation failed' }` (don't echo Zod issues — client already validated).
- Builds `noAnswers: { sectionTitle, number, text }[]` by iterating `sections` and filtering `answers[id].value === 'no'`.
- Computes:
  - `engagementSlug = slugifyEngagement(input.preparer.engagementName)`
  - `pdfFilename = 'cbv-checklist-' + engagementSlug + '-' + yyyyMmDd + '.pdf'`
  - `subject = 'Completed CBV Practice Inspection Checklist - ' + engagementName`
  - `bodyVariant = noAnswers.length === 0 ? 'all-yes' : 'has-no'`
- Calls Phase 05 PDF renderer → `Buffer`.
- Calls Phase 06 email renderer → `{ html, text }`.
- Calls `resend.emails.send({ from: env.EMAIL_FROM, to: input.preparer.recipientEmail, subject, html, text, attachments: [{ filename: pdfFilename, content: pdfBuffer }] })`. Recipient comes from the validated form payload (Zod-checked email), NOT from env.
- On Resend failure: log server-side, return `{ ok: false, error: 'Email send failed; please retry' }`. (Future: fall back to returning PDF buffer for client download — not v1.)
- Idempotency: compute SHA-256 of canonical-stringified payload; in-memory `Map<hash, timestamp>` with 60s TTL; if seen → no-op return `{ ok: true }`.

## Architecture
- `src/server/submit-checklist.ts` — `'use server'` at top.
- `src/server/env.ts` — Zod-validated env loader (`RESEND_API_KEY`, `EMAIL_FROM`). Throws on boot if missing. Note: no `EMAIL_TO` — recipient is form-driven.
- `src/server/resend.ts` — singleton `new Resend(env.RESEND_API_KEY)`.
- `src/server/dedupe.ts` — tiny LRU.

## Related code files
- `src/server/submit-checklist.ts`
- `src/server/env.ts`
- `src/server/resend.ts`
- `src/server/dedupe.ts`
- `src/components/checklist-form.tsx` (calls action)
- consumes Phase 05 (`src/server/pdf/render.ts`) and Phase 06 (`src/server/email/render.ts`)

## Implementation Steps
1. `pnpm add resend @react-pdf/renderer zod` and `pnpm add -D @types/node`.
2. `src/server/env.ts`: parse `process.env` with Zod; export typed `env`.
3. `src/server/resend.ts`: lazy singleton.
4. `src/server/submit-checklist.ts`: implement per Requirements. Mark `'use server'`.
5. `src/server/dedupe.ts`: 64-entry Map LRU, `seen(key, ttlMs)` returns boolean.
6. Wire client form to call action (Phase 03 hook-up).
7. Add `export const runtime = 'nodejs'` to `src/app/page.tsx`.
8. Add `export const maxDuration = 30` (no-op on Hobby, used on Pro).

## Todo list
- [ ] Env loader
- [ ] Resend client
- [ ] Dedupe util
- [ ] submitChecklist action skeleton
- [ ] Wire to PDF renderer (Phase 05)
- [ ] Wire to email renderer (Phase 06)
- [ ] Error surfacing to client
- [ ] runtime=nodejs on page

## Success Criteria
- Action receives validated payload, generates PDF, sends email, returns `{ok:true}` in dev with Resend test mode.
- Bad payload returns `{ok:false}` without throwing.
- Double-click submit within 60s sends one email.
- `to:` recipient = the validated `preparer.recipientEmail` from the form payload (defaults to `connect@aspenval.com`).

## Risk Assessment
- Cold start ~1–3s on first invoke. Acceptable for internal form.
- Action throws on Edge runtime; explicit `runtime='nodejs'` is non-negotiable.
- Env-var typo blows up at boot — desirable failure mode.

## Security Considerations
- Server re-validates with same Zod schema. Client cannot inject arbitrary fields beyond schema shape (Zod strips/rejects unknowns — use `.strict()`).
- Resend API key never reaches client.
- **Recipient is request-controlled** (per user requirement). Abuse mitigation: app sits behind basic-auth middleware (Phase 07), so only authenticated internal users can send. Acceptable for internal-tool threat model. If misuse appears, add an env-driven allowlist (`EMAIL_ALLOWLIST=connect@aspenval.com,foo@aspenval.com`) and validate `recipientEmail` ∈ allowlist in the action.

## Next steps
Phases 05/06 in parallel — both consumed by this action.
