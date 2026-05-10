# Phase 04 — Smoke Test Script + Dev Email Preview

## Context links
- Plan: [plan.md](./plan.md)
- Depends on: Phases 01–03 complete.
- Closes deferred item from old plan: `plans/20260505-2006-cbv-practice-inspection-checklist/phase-06-email-template.md` "Dev preview route" todo.

## Overview
- Date: 2026-05-10
- Description: Add `scripts/smoke-send.ts` — runnable via `pnpm tsx` — that reads `.env.local`, calls `verifyTransport()`, then sends a fixture email (with a fixture PDF) to a recipient supplied as CLI arg. Also add the dev-only email preview route `src/app/(dev)/preview-email/page.tsx` that was scoped but never implemented in the old Phase 06.
- Priority: P1 (not strictly needed to ship, but greatly de-risks Phase 05 deploy)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- The smoke script is the cheapest way to confirm the App Password works **before** burning a Vercel deploy.
- `tsx` isn't currently a dependency; add it as devDep so the script runs without compilation.
- The dev preview route renders the react-email component server-side and pipes the resulting HTML directly to the browser. Gated by `process.env.NODE_ENV !== "production"` — in production it returns 404.
- Both deliverables share fixtures; centralize them in `scripts/fixtures/` so the dev page and smoke script render the same canonical "0-No" and "5-No across 3 sections" cases.

## Requirements
**Smoke script `scripts/smoke-send.ts`**
- Usage: `pnpm tsx scripts/smoke-send.ts <recipient-email> [fixture]`
  - `fixture` ∈ `"empty" | "with-no"`, default `"with-no"`.
- Loads `.env.local` (via `dotenv/config` import — add `dotenv` as devDep, OR rely on `tsx --env-file=.env.local` flag; pick the env-file flag to avoid adding a runtime dep).
- Steps in order:
  1. `await verifyTransport()` — abort with clear message if it fails.
  2. Build a Submission fixture from `scripts/fixtures/submissions.ts`.
  3. `renderChecklistPdf(submission)` → buffer.
  4. `renderChecklistEmail({...})` → html + text.
  5. `sendChecklistEmail({...})` → log `messageId`.
- Exits non-zero on any error.

**Dev preview route `src/app/(dev)/preview-email/page.tsx`**
- Server component.
- Returns `notFound()` when `process.env.NODE_ENV === "production"`.
- Reads query param `?case=empty|with-no` (default `with-no`).
- Renders the react-email component to HTML using `renderChecklistEmail`.
- Returns the HTML inside an `<iframe srcDoc={html}>` so styles don't leak into the dev page chrome.
- A small `<nav>` above the iframe with two links to swap fixtures.

**Fixtures `scripts/fixtures/submissions.ts`**
- Exports `emptyNoSubmission` and `withFiveNoSubmission` — both shaped as `Submission` from `src/lib/checklist/types.ts`.
- The `with-no` fixture must place "No" answers in **at least 3 distinct sections** to exercise the grouping logic in `checklist-email.tsx:38-46`.

**Package additions**
- `pnpm add -D tsx`
- (No `dotenv` — use `tsx --env-file=.env.local`.)
- `package.json` script: `"smoke:email": "tsx --env-file=.env.local scripts/smoke-send.ts"`.

## Architecture
```
scripts/
  smoke-send.ts
  fixtures/
    submissions.ts
src/app/
  (dev)/
    preview-email/
      page.tsx
```

The `(dev)` route group has no `layout.tsx` of its own (uses the root layout). The `notFound()` guard is the only thing standing between curious prod users and the preview.

## Related code files
- `scripts/smoke-send.ts` (new)
- `scripts/fixtures/submissions.ts` (new)
- `src/app/(dev)/preview-email/page.tsx` (new)
- `package.json` (devDep + script)
- consumed: `src/server/mailer.ts`, `src/server/email/render.ts`, `src/server/pdf/render.ts`, `src/lib/checklist/data.ts`

## Implementation Steps
1. `pnpm add -D tsx`.
2. Author `scripts/fixtures/submissions.ts` — generate `Submission` objects programmatically by walking `sections` from `src/lib/checklist/data.ts` so the fixtures stay in sync if questions are ever added.
3. Author `scripts/smoke-send.ts`:
   - Parse `process.argv[2]` as recipient; bail with usage if missing or not email-like.
   - Try/catch each step with distinct console output so failures point to the right phase.
4. Add `smoke:email` script to `package.json`.
5. Author `src/app/(dev)/preview-email/page.tsx`:
   - `export const dynamic = "force-dynamic"` to avoid prerender.
   - Production guard first thing in the component.
6. Manual run: `pnpm smoke:email your.address@example.com with-no` — receive an email with PDF attached, body listing 5 No answers across 3 sections.
7. Manual run: visit `http://localhost:3000/preview-email?case=with-no` (after Basic Auth) — see the email rendered in the iframe.

## Todo list
- [ ] `pnpm add -D tsx`
- [ ] `scripts/fixtures/submissions.ts`
- [ ] `scripts/smoke-send.ts`
- [ ] `package.json` smoke script entry
- [ ] `(dev)/preview-email/page.tsx`
- [ ] Manual: smoke send `with-no` fixture lands in inbox
- [ ] Manual: smoke send `empty` fixture lands in inbox
- [ ] Manual: dev preview route renders both cases

## Success Criteria
- `pnpm smoke:email <addr>` returns exit 0 and the recipient receives both fixtures correctly.
- Dev preview route 404s when `NODE_ENV=production` (verified by setting it locally for one run).
- The fixtures auto-cover all 83 questions (smoke "empty" answers all yes; smoke "with-no" sets exactly 5 no's in 3 sections, rest yes/na).

## Risk Assessment
- **`tsx --env-file=` flag requires Node 20.6+ for the native loader.** README already requires Node ≥ 20; bump implicit min to 20.6 in a one-liner note.
- **Smoke script accidentally committed with a real recipient.** Mitigation: recipient is CLI arg, never hardcoded.

## Security Considerations
- Smoke script reads `.env.local` only — never commit `.env.local` (already gitignored).
- The `(dev)` route does **not** receive Basic Auth bypass — it sits behind the same middleware as everything else. Even so, the production guard is belt-and-suspenders.

## Next steps
Phase 05 — production deploy and verification.
