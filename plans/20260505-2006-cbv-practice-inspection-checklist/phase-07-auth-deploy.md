# Phase 07 — Auth & Deployment

## Context links
- Plan: [plan.md](./plan.md)
- Research: [research/researcher-01-techstack.md](./research/researcher-01-techstack.md)

## Overview
- Date: 2026-05-05
- Description: Gate the deployment behind basic-auth middleware (Vercel Hobby/Free tier — Deployment Protection not available). Configure env vars. Resend sandbox sender for v1; switch to custom domain when DNS verified. Deploy. Smoke test.
- Priority: P0 (release-blocker)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- **Vercel plan: Hobby (Free).** Deployment Protection (Password / SSO) is Pro+ only — not available. Auth strategy: `middleware.ts` Basic Auth, single env-checked credentials.
- Resend custom-domain sender requires SPF + DKIM TXT records on `aspenval.com`. Until verified, send from `onboarding@resend.dev` (works for production at low volume; visible "via resend.dev" header in clients but functional). Switch via env var only — no code change.
- Hobby `maxDuration` cap = 10s. PDF gen + email send empirically fits in 1–4s warm, 2–5s cold.

## Requirements
- `src/middleware.ts` implementing Basic Auth. Reads `BASIC_AUTH_USER` + `BASIC_AUTH_PASS`. Constant-time comparison. WWW-Authenticate header on 401. Matcher excludes `/_next/static`, `/_next/image`, `/favicon.ico`. **Always on** (no feature flag — Hobby has no alternative auth).
- Vercel project env vars set in dashboard (Production + Preview):
  - `RESEND_API_KEY` (real)
  - `EMAIL_FROM` (start: `onboarding@resend.dev`; later: `noreply@aspenval.com`)
  - `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`
  - `OPENAI_API_KEY` (present but unused; document in README)
- **No `EMAIL_TO`** — recipient is form-driven.
- DNS task (deferred): add SPF + DKIM TXT records per Resend domain wizard whenever ops can access DNS for `aspenval.com`. Then update `EMAIL_FROM` env var.
- `next.config.ts` allows the middleware matcher to cover all routes except `/_next/static`, `/_next/image`, `/favicon.ico`.

## Architecture
- Middleware short-circuits with 401 if creds missing/invalid.
- Single deploy environment. Preview deployments auto-protected by Vercel.

## Related code files
- `src/middleware.ts`
- `next.config.ts`
- `.env.example` (updated)
- `README.md` (deploy section)

## Implementation Steps
1. Implement `middleware.ts` (always-on basic auth).
2. Add env vars to Vercel.
3. Create Resend account, generate API key, add to Vercel env.
4. First production deploy with `EMAIL_FROM=onboarding@resend.dev`.
5. Smoke test: open app → basic-auth challenge → submit fully filled form (default recipient = `connect@aspenval.com`) → verify email arrives with PDF.
6. Smoke test incomplete submit → verify banner, no email.
7. Smoke test recipient override: change recipient in form to a personal address → verify it goes there only.
8. (Deferred) Add Resend domain when DNS access available; flip `EMAIL_FROM` env var.

## Todo list
- [ ] middleware.ts
- [ ] Vercel env vars set
- [ ] Resend account + API key
- [ ] First prod deploy with sandbox sender
- [ ] Smoke happy path
- [ ] Smoke incomplete path
- [ ] Smoke recipient-override path
- [ ] (Deferred) DNS + custom sender flip

## Success Criteria
- Unauth visit returns 401 with WWW-Authenticate prompt.
- Authed visit renders form.
- Successful submit lands email at the form's recipient address (default `connect@aspenval.com`) w/ correctly named PDF attached, correct subject, correct body branch.

## Risk Assessment
- DNS propagation can take hours; have fallback `EMAIL_FROM=onboarding@resend.dev` configured for first prod test.
- Hobby `maxDuration` 10s — verify PDF gen + email send < 8s in practice.
- Basic Auth creds in env only; ensure they're rotated when team changes.

## Security Considerations
- Constant-time string compare in middleware (avoid timing attack on password — pedantic but cheap).
- Deployment Protection (Pro) is preferred; basic-auth is a minimum.
- Never log full request bodies (preparer name + engagement name might be sensitive).

## Next steps
Phase 08 — polish & QA.
