# Nodemailer Migration (Resend → Gmail SMTP) — Implementation Plan

**Date:** 2026-05-10
**Owner:** Solo dev
**Status:** Not started
**Supersedes:** Phase 06 + Phase 07 of `plans/20260505-2006-cbv-practice-inspection-checklist/` (email transport portion only — react-email template is reused unchanged)
**Stack delta:** drop `resend` package; add `nodemailer` + `@types/nodemailer`. Keep `@react-email/render` for HTML/text body (it's transport-agnostic).

## Why
- Switch transactional email from Resend (REST API, third-party sender domain) to Gmail SMTP via Nodemailer.
- Sender will be a real Aspen Valuations Google Workspace mailbox using an App Password — no DNS work required, no `via resend.dev` header, no Resend account dependency.
- Resend is removed entirely (no fallback, no transport switch). One transport, one code path.

## Scope
**In scope**
- Replace `src/server/resend-client.ts` with a Nodemailer SMTP transporter.
- Refactor `src/server/submit-checklist.ts` send call to use Nodemailer's `sendMail()` API.
- Update env schema (`src/server/env.ts`), `.env.example`, README.
- Add unit-level test for transporter wiring + integration "smoke send" script.
- Validate behaviour on **both** Vercel Hobby (serverless) and a generic long-lived Node host (VPS/Docker). Plan must produce code that runs on either without changes.
- Remove Resend code, package, docs, env var.

**Out of scope**
- Changing the email template (`src/server/email/checklist-email.tsx`) — it's pure react-email, transport-agnostic.
- Changing the PDF pipeline.
- Changing the form, schema, or middleware.
- OAuth2 with Gmail (App Password only — simpler, sufficient for a single internal mailbox).
- Migrating away from Vercel — Vercel Hobby remains the default deploy target; VPS notes are advisory.

## Constraints & key decisions
- **Auth method: Gmail App Password** over SMTP (`smtp.gmail.com:465`, `secure: true`). Requires the sender Google account to have 2FA enabled.
- **Sender mailbox is fixed at deploy time** via `SMTP_USER` env. `EMAIL_FROM` defaults to `SMTP_USER` if unset (so most deployments only set `SMTP_USER` + `SMTP_PASS`). `EMAIL_FROM` can override the visible From header (e.g. `"Aspen Valuations <inspections@aspenval.com>"`) when Workspace alias/send-as is configured.
- **No connection pooling** in serverless mode. On Vercel each invocation creates a fresh transporter — pool would be GC'd on cold start anyway and risks exceeding Gmail's concurrent connection limits. On VPS, pooling is opt-in via `SMTP_POOL=true` (documented, off by default to keep code paths identical).
- **Timeouts**: 8s connection + 8s socket. Vercel Hobby `maxDuration` is 10s; PDF gen + SMTP handshake + send must fit. If too tight in practice, document the option to bump `maxDuration` on the route segment.
- **Gmail send limits**: Workspace = 2,000 recipients/day; consumer Gmail = 500/day. Document the limit; not a code concern at current volume (≪10/day).
- **Attachments**: Nodemailer accepts a `Buffer` in `attachments[].content` — same shape we already produce from `renderChecklistPdf()`. No conversion.
- **Error mapping**: SMTP errors come with codes (`EAUTH`, `ECONNECTION`, `ETIMEDOUT`, `EENVELOPE`). Map to user-facing messages without leaking SMTP details.
- **Idempotency**: existing payload-hash dedupe in `src/server/dedupe.ts` is unchanged. SMTP doesn't change retry semantics from the client's perspective.

## Phases

| # | Title | Status | Description |
|---|---|---|---|
| 01 | [Dependency & Env Swap](./phase-01-deps-env.md) | Not started | Remove `resend`; add `nodemailer` + types. Update `env.ts`, `.env.example`, README env table. Generate Gmail App Password and document the steps. |
| 02 | [Transport Module](./phase-02-transport.md) | Not started | New `src/server/mailer.ts` exporting `getTransporter()` (lazy singleton) and `sendChecklistEmail(args)` wrapper. Handles secure/465 vs STARTTLS/587 selection, optional pooling for VPS. |
| 03 | [Submit Pipeline Refactor](./phase-03-submit-refactor.md) | Not started | Rewrite the send block in `src/server/submit-checklist.ts` to call the new mailer. Map SMTP error codes to existing `SubmitResult` error strings. Delete `resend-client.ts`. |
| 04 | [Smoke Test Script + Dev Preview](./phase-04-smoke-and-preview.md) | Not started | `scripts/smoke-send.ts` (tsx) that sends a fixture email to a dev address. Add the long-deferred dev preview route `src/app/(dev)/preview-email/page.tsx` from old Phase 06. |
| 05 | [Deploy & Verify](./phase-05-deploy-verify.md) | Not started | Vercel env var swap (Production + Preview). Smoke 3 paths in production. VPS-deploy notes appended (not executed unless ops asks). Final cleanup of any lingering Resend references. |

## Cross-cutting decisions
- **Env var names** (final):
  - `SMTP_HOST` — default `smtp.gmail.com`, override-able for non-Gmail SMTP later.
  - `SMTP_PORT` — default `465`.
  - `SMTP_SECURE` — default `true` when port = 465, `false` otherwise.
  - `SMTP_USER` — Gmail address (required).
  - `SMTP_PASS` — Gmail App Password, 16 chars no spaces (required).
  - `EMAIL_FROM` — optional; defaults to `SMTP_USER`.
  - `SMTP_POOL` — optional, default `false`. Set `true` only on persistent hosts.
- **Removed env vars**: `RESEND_API_KEY`. (`OPENAI_API_KEY` stays — still unused, still documented.)
- **Runtime**: every route/Server Action that touches the mailer keeps `export const runtime = 'nodejs'`. Nodemailer is Node-only; Edge runtime is incompatible.
- **Logging**: same convention as current code — `console.error("[submitChecklist] ...")`. Never log `SMTP_PASS` or full message body. Log SMTP error code + message only.
- **Testing transport**: Phase 02 includes a tiny `verify()`-call helper exposed on the mailer module so the smoke script and (future) health check can probe SMTP without sending mail.

## Risk Register
- **Gmail blocks the App Password / disables Less Secure Apps lookalike heuristics.** Mitigation: 2FA-enabled Workspace account, not consumer Gmail; document recovery path (regenerate App Password).
- **Vercel cold-start + SMTP handshake exceeds 10s.** Mitigation: 8s timeouts; if observed, switch send to fire-and-forget with a follow-up retry queue (out of scope v1, but flagged).
- **App Password leakage in repo / logs.** Mitigation: env-only, `.env.local` is gitignored, error logs scrub credentials, README warns explicitly.
- **Sender domain reputation / spam.** Gmail-from-Gmail goes to inbox at low volume; if recipients on the same Workspace, internal delivery is essentially guaranteed. Flag for ops to monitor spam reports.
- **Multiple cold starts spamming Gmail with fresh connections.** At current volume (≪10 sends/day) this is irrelevant; documented for future.

## Success Criteria (rollup)
- `pnpm build`, `pnpm type-check`, `pnpm lint`, `pnpm test` all green with zero `resend` references in `src/`, `package.json`, `pnpm-lock.yaml`, `.env.example`, README.
- `pnpm tsx scripts/smoke-send.ts <recipient>` sends a real email through Gmail SMTP from a local machine using `.env.local`.
- Production submit on Vercel sends an email with PDF attached, correct subject, correct body branch, From header showing the configured Gmail/Workspace sender.
- Plan annotates which steps differ on a long-lived Node host so a future migration to VPS is a config change, not a code change.

## Future / Deferred
- Switch to OAuth2 with refresh token if App Passwords get deprecated by Google (currently still supported for Workspace).
- Move to a dedicated transactional provider (SES, Postmark) if volume grows past Gmail's 2k/day or deliverability becomes an issue.
- Persist a `sent_at` + `message_id` audit row when DB lands (deferred from original plan).

## Decisions log (2026-05-10)
- Provider: **Gmail SMTP** with App Password — chosen over OAuth2 for setup simplicity; over Resend SMTP because the goal is to drop Resend entirely.
- Resend: **fully removed** — no transport switch, no fallback. Single code path.
- Pooling: **off by default**, env-flag opt-in for VPS — keeps Vercel and VPS code identical.
- `EMAIL_FROM` is **optional** — defaults to `SMTP_USER` so the minimum env config is just `SMTP_USER` + `SMTP_PASS` + the unchanged `BASIC_AUTH_*`.
- Deploy target: Vercel Hobby remains primary; VPS support is a documented opt-in via `SMTP_POOL`, no code branch.

## Open follow-ups (operational, not blocking)
- Provision the actual Gmail/Workspace sender mailbox (e.g. `inspections@aspenval.com`) and 2FA + App Password.
- Decide whether to add SPF/DKIM for `aspenval.com` so a Workspace alias can be used in `EMAIL_FROM` without Gmail's "via gmail.com" decoration.
- Confirm with ops whether internal recipients are all on Aspen's Workspace (affects deliverability assumptions).
