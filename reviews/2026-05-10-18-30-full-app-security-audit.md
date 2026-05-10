# Full Application Security & Bug Audit

**Date:** 2026-05-10 18:30
**Reviewer:** Self-audit (line-by-line)
**Branch:** `feat/nodemailer-gmail-smtp` @ `9cf6b92`
**Scope:** Entire `src/`, `scripts/`, `next.config.ts`, `package.json`, `.env.example`, `.gitignore`, `middleware.ts`, plus `pnpm audit` for transitive CVEs.
**Validation at audit time:** `pnpm type-check` ✅, `pnpm lint` ✅ (0 warnings), `pnpm test` ✅ 93/93, `pnpm build` ✅, `pnpm audit` → 2 moderate.
**Supersedes:** `2026-05-10-17-00-nodemailer-migration-audit.md` (now subsumed; migration findings included in §3 & §6 below).

## Method
Pentest-style read of every production code path. For each finding: **file:line**, **severity** (with CVSS-style reasoning where applicable), **realistic exploitability** (not theoretical), **repro**, **fix**. Tests treated as behaviour-spec, not proof of correctness — green tests only mean "the cases I thought of pass". Threat model assumes the deployed app is reachable on the public internet, gated only by HTTP Basic Auth, sending email through Gmail SMTP from a single Workspace mailbox.

## Severity legend
- **Critical** — RCE, auth bypass, mass data exfil, secret theft.
- **High** — wrong output / data loss / privilege escalation / DoS on a realistic path.
- **Medium** — wrong output on edge case, deploy-time blocker, exploitable XSS in a niche path, known CVE in an actively-used dep.
- **Low** — defensive-only, unlikely-but-possible bug, UX glitch with minor security relevance.
- **Cosmetic** — style/comment, no functional or security impact.

---

## §1 — Authentication & Middleware

### #1.1 — Basic Auth credentials are bytewise comparable; user-enum side-channel via 401 timing
**Severity:** Low
**File:** `src/middleware.ts:1-79`

`timingSafeEqual()` is correct (constant-time over `max(a.length, b.length)`). Fail-closed when env unset (line 26-31) is correct. WWW-Authenticate header on every 401 is correct.

But: when the **Authorization header is absent**, the function returns 401 immediately without performing any comparison (line 36-41). When credentials ARE present and wrong, it does perform the compare. Net effect: an attacker can distinguish "no creds sent" (~0ms) from "wrong creds" (~constant compare time). Not exploitable for credential theft, but the timing distinction is observable.

**Realistic exploitability:** ~zero. The signal reveals only "the server checks a password" which is already obvious from the 401 + `WWW-Authenticate` header.

**Recommendation:** leave as-is. Adding a dummy compare on the no-header path is defensive code that costs more than it buys.

### #1.2 — No rate limiting on Basic Auth attempts
**Severity:** Medium (depending on threat model)
**File:** `src/middleware.ts` (entire file)

The middleware accepts unlimited 401-prompted retries from any IP. With 16 chars of entropy on `BASIC_AUTH_PASS`, online brute-force is impractical at single-attempt speeds, but a botnet could enumerate weak passwords or known leaks.

**Realistic exploitability:** depends on `BASIC_AUTH_PASS` entropy. README example uses `changeme` literally — a competent attacker would crack that in microseconds.

**Recommendation:**
1. Change `.env.example` to use a random 32-char placeholder (not the suggestive word `changeme`) and add a README note: "use `openssl rand -base64 32`".
2. (Optional) Add rate limiting via Vercel Firewall rules or a Next.js middleware-level token bucket keyed by IP + path. Out of scope of v1 per project decisions log, but the threat exists.

### #1.3 — Basic Auth sends credentials in cleartext over HTTP
**Severity:** Critical if served over HTTP, N/A on Vercel HTTPS
**File:** `src/middleware.ts` (relies on transport)

Basic Auth is base64, not encrypted. On Vercel the platform forces HTTPS — no exposure. On a custom VPS deploy without TLS termination, credentials would be wire-readable.

**Realistic exploitability:** zero on Vercel; high on a misconfigured self-host.

**Recommendation:** add a one-line note to README's deploy section: "Basic Auth assumes HTTPS — never deploy this app behind plain HTTP."

### #1.4 — Middleware matcher does not exclude `/api/*` (none today, but future risk)
**Severity:** Cosmetic now, Low later
**File:** `src/middleware.ts:75-79`

Matcher `"/((?!_next/static|_next/image|favicon.ico).*)"` covers everything else, including any future `/api/*` route someone might add for webhooks or health checks. Currently no API routes exist. If someone later adds `/api/health` for an uptime monitor, it'll be locked behind Basic Auth and the monitor will fail mysteriously.

**Recommendation:** leave as-is until the first API route is added; document the gotcha then.

---

## §2 — Server-Side Logic & Server Actions

### #2.1 — Server Action lacks rate limiting; PDF + SMTP send is computationally expensive
**Severity:** Medium
**File:** `src/server/submit-checklist.ts:14`, `src/app/page.tsx:4` (`maxDuration = 30`)

`submitChecklist` is invoked for every form submit. PDF generation via `@react-pdf/renderer` is CPU-bound (typical 1-4s warm); SMTP handshake adds 1-2s. The dedupe map (`src/server/dedupe.ts:3-5`, `MAX_SIZE=64`, `TTL_MS=60_000`) only blocks **exact-duplicate** payloads — an attacker who minimally varies one field (e.g. iterating `note` content) can bypass it freely.

A single authenticated user (Basic Auth credentials shared internally) can trigger unlimited submits, each consuming 1-30s of serverless function time and one Gmail send. Two consequences:
1. Vercel function billing climbs.
2. **Gmail outbound limit** burnt: Workspace caps at 2,000 recipients/day; consumer Gmail at 500/day. A determined insider could exhaust this in minutes by varying engagement names, locking out legitimate sends until midnight Pacific.

**Realistic exploitability:** Requires Basic Auth credential. Internal/insider threat. Real cost: Gmail lockout could affect legitimate workflow.

**Recommendation:**
1. Document in README: "Gmail sender share daily quota with the rest of the inbox; abuse drains it."
2. (Optional) Add a per-IP/per-recipient submission counter via in-memory map similar to `dedupe.ts` — e.g. max 10 sends per IP per hour. The same module-level state pattern works on Vercel for short windows.

### #2.2 — Recipient email is form-controlled; Basic-Auth-holder can spam arbitrary addresses
**Severity:** Medium
**File:** `src/lib/checklist/schema.ts:10`, `src/server/submit-checklist.ts:80`

`recipientEmail` is editable in the form (validated only as a syntactically-valid email, max 254 chars). An attacker with Basic Auth credentials can submit a real-looking checklist to any external address — receiving a Gmail-sender-stamped PDF "from" Aspen Valuations. Three risks:
1. **Phishing/impersonation** — recipient sees a legitimate Aspen email with PDF and may act on it.
2. **Sender reputation damage** — Gmail flags the sender if recipients mark as spam.
3. **Confidential data leak** — preparer can intentionally email a forged/embarrassing checklist to a journalist, competitor, etc.

**Realistic exploitability:** medium. Insider threat is real, especially if Basic Auth password is shared widely.

**Recommendation:**
1. Add `EMAIL_RECIPIENT_ALLOWLIST` env var (comma-separated domains or addresses). Validate `recipientEmail` against it in the Server Action — on miss, return validation error and don't send.
2. Or: lock recipient to a single hard-coded address (`connect@aspenval.com`) and remove the form field entirely. The original plan kept it editable; this could be revisited.
3. At minimum, document the trust boundary in README's deploy section.

### #2.3 — `canonicalize()` drops keys whose value is `undefined`
**Severity:** Low
**File:** `src/server/dedupe.ts:14-19`

Carried from the prior migration audit. `for (const k of Object.keys(obj).sort())` enumerates a key whose value is `undefined`; `canonicalize(undefined)` returns `undefined`; `JSON.stringify` then omits it (standard JSON behaviour). Net effect: `{ a: 1, note: undefined }` hashes identically to `{ a: 1 }`.

Today the form path sets `note: ""` (empty string ≠ undefined) so dedupe is safe. A future caller that sets `note: undefined` explicitly would silently dedupe.

**Repro:**
```ts
hashPayload({ a: 1, note: undefined }) === hashPayload({ a: 1 })  // true
```

**Recommendation:**
```ts
for (const k of Object.keys(obj).sort()) {
  const v = canonicalize(obj[k]);
  if (v !== undefined) out[k] = v;
}
```
Add a regression test (current `dedupe.test.ts` does not cover this).

### #2.4 — `canonicalize()` no cycle detection — stack overflow on cyclic input
**Severity:** Low (defensive only)
**File:** `src/server/dedupe.ts:10-20`

Object with self-reference (`a.self = a`) causes infinite recursion. Today's only caller is `submit-checklist.ts:36` passing Zod-validated tree-shaped data — no cycle path exists.

**Recommendation:** leave as-is, document the assumption in a code comment.

### #2.5 — Dedupe map is module-level state — shared across **all users** on a warm Vercel function
**Severity:** Low (informational)
**File:** `src/server/dedupe.ts:3`

`const seen = new Map<string, number>()` lives in the module closure. On Vercel, multiple concurrent users hit the same warm function instance and **share** this map. The `MAX_SIZE = 64` cap means a single user submitting 64 unique checklists will start evicting entries belonging to other users — defeating dedupe for them.

Real-world impact: with the current low-volume internal-only usage, irrelevant. At higher volume, dedupe becomes unreliable.

**Recommendation:** leave as-is for v1. Plan the path to a real persistent dedupe (DB row with unique key) once volume warrants.

### #2.6 — Server Action error log fields are PII-adjacent
**Severity:** Low
**File:** `src/server/submit-checklist.ts:93-99`

The SMTP error logger logs `responseCode` and `response` from Nodemailer. SMTP `response` strings frequently echo the recipient address ("550 5.1.1 <foo@bar.com>: recipient rejected"). Recipient address is user-supplied form data, but logging it server-side persists it in Vercel function logs (retention varies by plan). Combined with engagement names and timestamps, an attacker with log access could build a rough audit trail.

**Realistic exploitability:** requires Vercel project log access (team-level RBAC).

**Recommendation:** acceptable for an internal tool. If logs are ever exported off-platform (e.g. shipped to an external SIEM), redact `response` before egress.

### #2.7 — `submit-checklist.ts:74` returns generic "Failed to compose email" on render error, but `renderChecklistEmail` has no realistic failure mode
**Severity:** Cosmetic
**File:** `src/server/submit-checklist.ts:62-75`

The try/catch around `renderChecklistEmail` is defensive — react-email's `render()` doesn't throw on valid React trees. The branch is effectively unreachable. Doesn't hurt, but is dead error-handling.

**Recommendation:** leave as-is.

---

## §3 — Email Transport (Nodemailer + Gmail SMTP)

Findings carried/refined from the prior migration audit.

### #3.1 — `(dev)/preview-email` imports from `scripts/` (outside `src/`) — Vercel file-tracing risk
**Severity:** Medium
**File:** `src/app/(dev)/preview-email/page.tsx:5-8`

```ts
import { buildSubmission, type FixtureName } from "../../../../scripts/fixtures/submissions";
```

Local `pnpm build` succeeds. But Next.js + Vercel default file-tracing scope is `src/` + `node_modules/`. Files outside that scope may be excluded from the deployed function bundle. The `if (NODE_ENV === "production") notFound()` guard runs at request time; the static import resolves at build/bundle time — guard does NOT prevent bundling.

If Vercel's tracer drops `scripts/fixtures/submissions.ts`, the route's bundle is incomplete. Either build fails or the function crashes on cold start (before reaching the guard). Cannot be confirmed without a Vercel deploy.

**Recommendation:** move `scripts/fixtures/submissions.ts` → `src/lib/fixtures/submissions.ts`; update both importers (`scripts/smoke-send.ts`, the dev page); move test under `scripts/fixtures/__tests__/` accordingly. ~3 file moves + 2 import path edits.

Alternative: delete the `(dev)/preview-email` route entirely since it duplicates `pnpm smoke:email`.

### #3.2 — `mailer.ts` lazy singleton can leak between Vitest tests if `vi.resetModules()` is forgotten
**Severity:** Low (test gotcha)
**File:** `src/server/mailer.ts:6`

Module-level `_transporter` persists across tests in the same file. Existing `mailer.test.ts` uses `vi.resetModules()` in `beforeEach`. New test files would need to repeat this dance.

**Recommendation:** leave as-is. Optional: add a code comment explaining the pattern.

### #3.3 — Smoke script crashes with cryptic error when `.env.local` missing required vars
**Severity:** Low (UX, dev-only)
**File:** `scripts/smoke-send.ts:1-9`

Top-level mailer import → env.ts `parseEnv()` → throws before usage() can print help. A new dev sees `Error: Missing required environment variables` instead of script usage.

**Recommendation:** leave as-is. Error message names the missing var.

### #3.4 — `EMAIL_FROM` not validated as RFC-5322 syntax
**Severity:** Low
**File:** `src/server/env.ts:20`

`EMAIL_FROM: z.string().min(1).optional()` accepts any non-empty string. A malformed value (e.g. `inspections at aspenval`) would be passed to Nodemailer which would either silently rewrite it or reject the send with `EENVELOPE`.

**Realistic exploitability:** none — this is a self-foot-shoot for the deploy operator, not an attacker.

**Recommendation:** leave as-is. The README documents the expected formats; misconfiguration surfaces immediately on first send attempt.

### #3.5 — Recipient address not normalised before use
**Severity:** Cosmetic
**File:** `src/server/submit-checklist.ts:80`

`data.preparer.recipientEmail` flows directly to Nodemailer. Trailing whitespace or capitalisation differences (`Foo@Bar.COM` vs `foo@bar.com`) hash to different dedupe entries — see §2.5 implications.

**Recommendation:** lowercase + trim before hashing AND sending. ~1 line in `submit-checklist.ts`.

### #3.6 — No unsubscribe / List-Unsubscribe header
**Severity:** Cosmetic (non-marketing email)
**File:** `src/server/mailer.ts` (`sendChecklistEmail`)

Pure transactional email to a single internal address. CAN-SPAM / Gmail bulk sender requirements don't apply at this volume. Including `List-Unsubscribe` for transactional mail can actually trigger Gmail to mark the sender as bulk.

**Recommendation:** leave as-is. Reconsider only if recipient list grows beyond internal team.

---

## §4 — Frontend / Client-Side

### #4.1 — Zod schema accepts past dates with no upper or lower bound
**Severity:** Low
**File:** `src/lib/checklist/schema.ts:6-7`

`completionDate: z.coerce.date()` accepts any valid Date — year 1, year 9999, NaN-via-coercion-failure. The form's `<DatePicker>` component visually constrains to a sensible range, but client-side validation can be bypassed by replaying a crafted Server Action POST.

**Realistic exploitability:** very low (cosmetic — would only produce a nonsensical PDF/email with date "1066-10-14"). Not a security issue.

**Recommendation:** add `.refine()` constraints:
```ts
completionDate: z.coerce.date()
  .refine(d => d >= new Date('2000-01-01') && d <= new Date(), 'Date out of range'),
```

### #4.2 — `engagementName` (200 chars) used as PDF filename + email subject + slug — no filename-injection sanitization
**Severity:** Low
**File:** `src/server/submit-checklist.ts:43-47`, `src/lib/engagement.ts:3-10`

`slugifyEngagement()` is well-formed: lowercases, replaces non-alphanumeric runs with `-`, trims hyphens, slices to 80 chars. Output is a clean ASCII slug, safe for filenames. Email subject uses raw `engagementName` (per spec) — react-email renders it as text, no HTML interpretation. Tested in `render.test.ts`.

PDF filename is `cbv-checklist-${engagementSlug}-${dateStr}.pdf` — slug guarantees no `..`, no `/`, no quotes. Nodemailer accepts `attachments[].filename` as a string and handles MIME header escaping itself.

**Recommendation:** none — this path is correct. Listed for future reference: do NOT bypass `slugifyEngagement()` if you ever derive other filenames from user input.

### #4.3 — XSS surface in form: zero
**Severity:** N/A (verified safe)
**File:** all of `src/components/`

No raw-HTML injection sinks. All user text rendered via React text nodes (auto-escaped). Tested for engagement name escape in `render.test.ts`.

### #4.4 — No CSRF protection on Server Actions
**Severity:** Low (Next.js handles it)
**File:** Next.js framework default

Next.js 15 Server Actions include automatic CSRF protection via the `Origin` header check + signed action IDs. Confirmed by reading Next docs (not re-verified at this audit). Combined with Basic Auth gating the entire app, the CSRF surface is essentially closed.

**Recommendation:** none.

### #4.5 — `MissingBanner.scrollToQuestion` accesses `document` without SSR guard
**Severity:** N/A (client component)
**File:** `src/components/missing-banner.tsx:14-21`

Component is `"use client"` — `document` is always defined when this code runs.

**Recommendation:** none.

### #4.6 — `parseInt(missing[0]!.replace("q", ""), 10)` non-null assertion
**Severity:** Cosmetic
**File:** `src/components/checklist-form.tsx:111`, `src/components/missing-banner.tsx:11`

`missing[0]!` after `if (missing.length > 0)` is correct; `noUncheckedIndexedAccess: true` in tsconfig forces the assertion. Same pattern repeats in `missing-banner.tsx:idToNumber` (no assertion needed there because it's destructured from a map).

**Recommendation:** leave as-is.

### #4.7 — `successEngagement` displayed verbatim on success screen — XSS check
**Severity:** N/A (verified safe)
**File:** `src/components/checklist-form.tsx:131`

```tsx
The completed CBV Practice Inspection Checklist for{" "}
<strong>{successEngagement}</strong> has been emailed successfully.
```

React text node — auto-escaped. Cannot be exploited.

### #4.8 — `aria-labelledby` ID generation may collide for sections sharing first 20 chars
**Severity:** Low (a11y)
**File:** `src/components/checklist-form.tsx:193, 199`

`section-${section.title.slice(0, 20).replace(/\s/g, "-")}`. With current 12 sections, no two share their first 20 chars (verified against `data.ts`). If a future section is named e.g. "Practice Standard 100 — Part 2" alongside the existing "Practice Standard 100 – Valuation Conclusions and Valuation Reports", they'd both produce the same ID → AT confusion.

**Recommendation:** key by `section.title` hash or by index instead of slice.

### #4.9 — Missing `aria-required` on the recipient email input despite `*` indicator
**Severity:** Cosmetic (a11y)
**File:** `src/components/preparer-block.tsx:144-151`

The visible `*` and the helper text say required, but the `<Input>` is not given `aria-required="true"`. RHF + Zod validate it on submit. Screen readers won't announce "required" upfront. Same for several other fields in the preparer block.

**Recommendation:** add `aria-required="true"` on each required input. ~6 line edits.

### #4.10 — `Inter` font loaded from Google Fonts — third-party request on every page load
**Severity:** Low (privacy)
**File:** `src/app/layout.tsx:2, 5`

`next/font/google` self-hosts at build time (Google Fonts no longer served from Google's CDN at runtime since Next 14). Verified — no PII leak to Google.

**Recommendation:** none.

### #4.11 — No `Content-Security-Policy` header
**Severity:** Low
**File:** `next.config.ts` (entire file)

No CSP. Default Next.js inline scripts and style attributes in components require either `unsafe-inline` or strict-nonce — adding a CSP without breaking the app is non-trivial.

**Realistic exploitability:** low because (a) no UGC rendered as HTML, (b) Basic Auth gates the entire surface. CSP is defense-in-depth.

**Recommendation:** add a Vercel `vercel.json` with at least `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. CSP can wait.

---

## §5 — Build / Deploy / Configuration

### #5.1 — `next.config.ts` enables experimental Server Actions with 2MB body limit
**Severity:** Low
**File:** `next.config.ts:4-8`

```ts
experimental: {
  serverActions: { bodySizeLimit: "2mb" },
},
```

Server Actions are no longer experimental in Next 15 — the `experimental` wrapper is unnecessary but harmless. The 2MB limit caps payload — well above the largest expected submission (~50KB). An attacker can still force a 2MB payload to consume parsing time; combined with §2.1 (no rate limit) this magnifies the DoS surface.

**Recommendation:** drop the `experimental` wrapper; keep `bodySizeLimit` at a tighter `200kb` since real submissions are ~50KB:
```ts
const nextConfig: NextConfig = {
  serverActions: { bodySizeLimit: "200kb" },
};
```

### #5.2 — Two lockfiles detected by Next.js (workspace-root warning)
**Severity:** Low
**File:** `D:\Github\pnpm-lock.yaml` (parent dir) + `pnpm-lock.yaml`

Build output: `Detected additional lockfiles: D:\Github\CBV-Practice-Inspection-Checklist\pnpm-lock.yaml`. Next infers the workspace root from `D:\Github\pnpm-lock.yaml` (parent), which may include unrelated files in file-tracing → bloated bundles AND can interact with finding #3.1 (file-tracing scope).

**Recommendation:** add `outputFileTracingRoot` to `next.config.ts`:
```ts
import path from 'node:path';
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // ...
};
```

### #5.3 — `package.json` script `smoke:email` requires `.env.local` to exist
**Severity:** Cosmetic
**File:** `package.json:13`

`tsx --env-file=.env.local scripts/smoke-send.ts` fails with "ENOENT" if `.env.local` is absent. Documented in README implicitly via `.env.example`.

**Recommendation:** leave as-is.

### #5.4 — `.gitignore` covers `.env*.local` and `.claude/` correctly; misses `*.log`
**Severity:** Cosmetic
**File:** `.gitignore`

No glob for `*.log`. Vitest, Next, pnpm can all produce `.log` files in cwd that would be accidentally committed.

**Recommendation:** add `*.log` to `.gitignore`.

### #5.5 — `.env.example` lists `OPENAI_API_KEY` as "unused in v1" but it's not parsed by `env.ts`
**Severity:** Cosmetic (consistency)
**File:** `.env.example:24`, `src/server/env.ts:14-22`

The example mentions `OPENAI_API_KEY` but the Zod schema doesn't include it. If a deploy operator sets it expecting it to do something, nothing happens silently. README also lists it as "Present but unused".

**Recommendation:** either add `OPENAI_API_KEY: z.string().optional()` to `env.ts` for forward-compat, or remove the mention from `.env.example` entirely until v2 needs it.

### #5.6 — README example `BASIC_AUTH_PASS=changeme` is dangerous if copied to prod
**Severity:** Medium
**File:** `.env.example:21`

Literal `changeme` is more dangerous than helpful. A rushed deploy that doesn't rotate it = trivially crackable.

**Recommendation:** replace with `BASIC_AUTH_PASS=__GENERATE_A_RANDOM_VALUE__` and add a one-line README instruction `openssl rand -base64 32`. Same for `BASIC_AUTH_USER` (default `admin` is enumerable).

---

## §6 — Dependency CVEs (`pnpm audit`)

Two **moderate** advisories, both transitive (not direct deps):

### #6.1 — `prismjs@1.29.0` — DOM Clobbering → resultant XSS
**Severity:** Medium per CVSS (4.9), but **N/A in this app**
**Path:** `.>@react-email/components>@react-email/code-block>prismjs`
**CVE:** CVE-2024-53382, GHSA-x7hr-w5r2-h6wg
**Fixed in:** `prismjs@1.30.0`

`prismjs` is pulled in transitively via `@react-email/components`'s `code-block` component. We **do not use** `<CodeBlock>` in our email template (`checklist-email.tsx` uses only `Html`, `Head`, `Body`, `Container`, `Heading`, `Text`, `Section`, `Hr`). The vulnerable code is dead in our bundle.

**Realistic exploitability:** zero. PrismJS is server-rendered at email-build time, not in any browser context that processes untrusted HTML.

**Recommendation:** suppress via `pnpm overrides` to force `prismjs@^1.30.0` for cleanliness:
```json
"pnpm": { "overrides": { "prismjs": "^1.30.0" } }
```

### #6.2 — `postcss@8.4.31` — XSS via unescaped `</style>` in stringify output
**Severity:** Medium per CVSS (6.1), but **N/A in this app**
**Path:** `.>next>postcss`
**CVE:** CVE-2026-41305, GHSA-qx2v-qp2m-jg93
**Fixed in:** `postcss@8.5.10`

PostCSS is part of Next.js's build toolchain. Vulnerability requires (a) parsing user-controlled CSS, (b) re-stringifying it, (c) embedding the output in a `<style>` tag served to a browser. None of those happen in this app — we don't process user CSS at all.

**Realistic exploitability:** zero in this app's threat model.

**Recommendation:** Next.js will pull in the patched version on its next minor release. Force the override now if you want a clean audit:
```json
"pnpm": { "overrides": { "postcss": "^8.5.10" } }
```

### #6.3 — Deprecated transitive packages (informational)
`pnpm install` warns: 20 deprecated `@react-email/*` subpackages from `@react-email/components@0.0.35`. The deprecation is upstream-driven (consolidated into newer monolithic package). Functional today; one major version upgrade away from breaking.

**Recommendation:** plan a `@react-email/components` upgrade in next maintenance window.

---

## §7 — Testing Surface

### #7.1 — Submit-checklist tests rely on `Date.now()` engagement names for dedupe isolation
**Severity:** Low (test maintenance risk)
**File:** `src/server/__tests__/submit-checklist.test.ts`

Tests use ``engagementName: `Happy ${Date.now()}` `` to dodge the module-level `seen` Map in `dedupe.ts`. Implicit assumption: dedupe map persists across tests. `_resetDedupe()` was added in commit `32c296c` but submit tests don't call it.

**Recommendation:** `import { _resetDedupe } from "../dedupe"` + `beforeEach(() => _resetDedupe())`. Then drop the `Date.now()` suffix.

### #7.2 — `dedupe.test.ts` doesn't cover the `undefined`-key collision (Finding #2.3)
**Severity:** Cosmetic
**File:** `src/server/__tests__/dedupe.test.ts`

Add:
```ts
it("treats {a:1, note: undefined} as different from {a:1}", () => {
  // After fix #2.3, these should hash differently. Today they collide.
  // ...
});
```

### #7.3 — No integration test that `submitChecklist` happy path actually invokes Nodemailer
**Severity:** Cosmetic
**File:** `src/server/__tests__/submit-checklist.test.ts`

Existing happy-path test mocks `mailer` entirely. Doesn't verify the wiring through to a real (or testcontainer) SMTP server. Acceptable for unit-test layer; an end-to-end smoke is what `pnpm smoke:email` is for.

**Recommendation:** none — the layered approach is correct.

### #7.4 — `mailer.test.ts` casts `transporter.options` via `unknown as` — type-fragile
**Severity:** Cosmetic
**File:** `src/server/__tests__/mailer.test.ts:38, 50, 60, 70, 78`

Repeated `(t as unknown as { options: Record<string, unknown> }).options`. Works but couples tests to Nodemailer's internal API surface. If Nodemailer changes the options getter, all five sites break together.

**Recommendation:** extract a helper:
```ts
function getOpts(t: Transporter): Record<string, unknown> {
  return (t as unknown as { options: Record<string, unknown> }).options;
}
```

---

## §8 — Confirmed Safe (no further action)

Listed so a future re-audit doesn't redo the work.

| File | What was checked | Verdict |
|---|---|---|
| `src/server/mailer.ts` | `resolveSecure()` precedence, pool branching, TLS minVersion, timeout values, no top-level side effect | ✅ Correct |
| `src/server/env.ts` | `envBool` covers all standard truthy/falsy strings, port coercion rejects negative/zero/non-numeric, email validation on `SMTP_USER` | ✅ Correct |
| `src/server/submit-checklist.ts` | Order of operations, error propagation, sanitised SMTP error logging (no `auth`, no `stack`, no password) | ✅ Correct |
| `src/server/email/render.ts` + `checklist-email.tsx` | Subject verbatim, `buildNoAnswersList` ordering, react-email auto-escapes interpolations, no raw-HTML injection sinks | ✅ Correct |
| `src/server/pdf/checklist-pdf.tsx` | All user data rendered via `<Text>` nodes (escaped), no eval/Function constructor | ✅ Correct |
| `src/lib/engagement.ts` | `slugifyEngagement` produces filename-safe ASCII; `formatDate` deterministic | ✅ Correct |
| `src/middleware.ts` | Basic Auth with timing-safe compare, fail-closed when env missing | ✅ Correct |
| `src/components/checklist-form.tsx` | React 19 `inert`, scroll-and-focus flow, no XSS sinks | ✅ Correct |
| All `src/components/ui/*` | Pure presentational wrappers, no HTML injection paths | ✅ Correct |
| `.gitignore` | `.env`, `.env.local`, `.claude/`, `.serena/` covered | ✅ Correct |

---

## Prioritised Fix List

**Should fix before next deploy:**
1. **#5.6** — Remove `BASIC_AUTH_PASS=changeme` from `.env.example`. (1 line + README note.)
2. **#3.1** — Move fixtures into `src/lib/fixtures/` so `(dev)/preview-email` doesn't import from outside `src/`. (3 file moves + 2 import updates.)

**Should fix soon:**
3. **#2.2** — Add `EMAIL_RECIPIENT_ALLOWLIST` env var or remove the form-controlled recipient. (~10 lines.)
4. **#2.1** — Add submission rate limit (per-IP token bucket in same in-memory style as dedupe). (~30 lines + 1 test.)
5. **#5.1** — Drop `experimental` wrapper, tighten `bodySizeLimit` to `200kb`. (3 lines.)
6. **#5.2** — Set `outputFileTracingRoot` in `next.config.ts`. (3 lines.)
7. **#2.3** — Fix `canonicalize()` `undefined`-key handling + add regression test. (~5 lines + 1 test.)
8. **#7.1** — Use `_resetDedupe()` in submit-checklist tests. (2 lines.)

**Nice-to-have:**
9. **#6.1, #6.2** — Add `pnpm overrides` to silence audit. (5 lines in `package.json`.)
10. **#5.4** — Add `*.log` to `.gitignore`. (1 line.)
11. **#4.9** — Add `aria-required="true"` to required inputs in `preparer-block.tsx`. (~6 lines.)
12. **#4.8** — Stop slicing `section.title` to 20 chars for ID generation. (~2 lines.)
13. **#3.5** — Lowercase + trim recipient email before hashing/sending. (~1 line.)

**Defer / leave-as-is** (per YAGNI/KISS): #1.1, #1.2, #1.3, #1.4, #2.4, #2.5, #2.6, #2.7, #3.2, #3.3, #3.4, #3.6, #4.1, #4.4–#4.7, #4.10, #4.11, #5.3, #5.5, #6.3, #7.2–#7.4.

---

## Threat-model summary

The deployed app is a low-volume internal tool gated by a single shared HTTP Basic Auth credential, sending emails through one Gmail/Workspace mailbox. The realistic threats are:
1. **Insider abuse** of the shared Basic Auth credential to email arbitrary recipients (#2.2).
2. **Quota exhaustion** of the Gmail sender by repeated submits (#2.1).
3. **Credential leakage** if `BASIC_AUTH_PASS` is left at `changeme` (#5.6) or via a logs/SIEM export pipeline (#2.6).
4. **Build-time deploy failure** on Vercel from the cross-boundary import in `(dev)/preview-email` (#3.1).

Nothing in scope is **critical** or **high** severity. The codebase is well-structured and the migration's test discipline catches a meaningful share of regressions. Top three fixes are small enough to land in one commit.

## Open questions
- Should `(dev)/preview-email` be deleted entirely (resolves #3.1 with zero cost) or kept and refactored?
- Is the `recipientEmail` form field a hard product requirement, or can it be locked to `connect@aspenval.com`? (resolves #2.2 cleanly)
- What's the actual deployment target — single-tenant Vercel Hobby for one client, or shared platform? (changes the calculus on #1.2 / #2.1 rate limiting.)
