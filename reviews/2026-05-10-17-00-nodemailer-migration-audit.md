# Code Audit — Nodemailer Migration

**Date:** 2026-05-10
**Reviewer:** Self-audit (post-implementation)
**Branch:** `feat/nodemailer-gmail-smtp`
**Commits in scope:** `5a20d8d` (migration) + `32c296c` (tests + dedupe fix + a11y)
**Validation status at audit time:** type-check ✅, lint ✅ (0 warning), test ✅ 93/93, build ✅

## Method
Manual line-by-line read of every file touched by the two commits, plus all transitive callers (`submit-checklist.ts`, form components, middleware). Tests were used as a behaviour-spec but **not** trusted to prove correctness — green tests only prove "the cases I thought of pass."

## Severity legend
- **High** — wrong output, data loss, security, or build/runtime failure on a realistic path.
- **Medium** — wrong output on edge case, deploy-time blocker.
- **Low** — UX glitch, defensive-only, or test gotcha.
- **Cosmetic** — style/comment, no functional impact.

---

## Findings

### #1 — `canonicalize()` drops keys whose value is `undefined`
**Severity:** Low (correctness bug, low realistic incidence)
**File:** `src/server/dedupe.ts:14-19`

`for (const k of Object.keys(obj).sort())` enumerates a key whose value is `undefined`; `canonicalize(undefined)` returns `undefined`; `JSON.stringify` then **omits** that key from output (standard JSON behaviour). Net effect: a payload with `note: undefined` hashes identically to a payload that doesn't declare `note` at all.

Realistic impact in this app:
- Form schema makes `note` optional. RHF default values set `note: ""` (empty string, not undefined) — see `checklist-form.tsx:31`. Empty string ≠ undefined, so they hash differently. **The form path is safe today.**
- Smoke fixtures call `defaultValueFor()` which returns `{ value }` with **no `note` key** at all. Different shape from the form path → already two different hashes possible for "same" submission. Doesn't break dedupe (different fixtures should hash differently), but worth knowing.
- A future caller passing a partially-built object with `undefined` fields would silently dedupe.

**Repro test:**
```ts
hashPayload({ a: 1, note: undefined }) === hashPayload({ a: 1 })  // true
```

**Recommended fix:** in `canonicalize()`, skip keys whose recursed value is `undefined`:
```ts
for (const k of Object.keys(obj).sort()) {
  const v = canonicalize(obj[k]);
  if (v !== undefined) out[k] = v;
}
```
Add a regression test in `dedupe.test.ts` covering `{ a: 1, b: undefined }` vs `{ a: 1 }` (current test suite does NOT cover this).

---

### #2 — `(dev)/preview-email` imports from `scripts/` (outside `src/`)
**Severity:** Medium (deploy-time risk on Vercel)
**File:** `src/app/(dev)/preview-email/page.tsx:5-8`

```ts
import { buildSubmission, type FixtureName } from "../../../../scripts/fixtures/submissions";
```

Local `pnpm build` succeeds. But:
- Next.js + Vercel default **file-tracing** scope is `src/` + `node_modules/`. Files outside that may be excluded from the deployed function bundle.
- The `if (NODE_ENV === "production") notFound()` guard runs at **request** time. The static import resolves at **build/bundle** time — guard does not prevent bundling.
- If Vercel's tracer drops `scripts/fixtures/submissions.ts`, the route's bundle will be incomplete. Either build fails, or the function crashes on cold start (before reaching the `notFound()` guard).

Cannot be confirmed without a Vercel deploy attempt — but it is a known-fragile pattern.

**Recommended fix:** move `scripts/fixtures/submissions.ts` into `src/lib/fixtures/submissions.ts`, update the two importers (`scripts/smoke-send.ts`, the dev page). Tests under `scripts/fixtures/__tests__/` move alongside.

Alternative if you want to keep fixtures co-located with the smoke script: in the dev preview page, redefine the two fixtures inline (5–10 lines of duplication, eliminates the cross-boundary import).

---

### #3 — `canonicalize()` infinite recursion on cyclic input
**Severity:** Low (defensive only — current callers can't produce cycles)
**File:** `src/server/dedupe.ts:10-20`

`canonicalize(value)` does no cycle detection. An object with a self-reference (`a.self = a`) would recurse until stack overflow.

Realistic impact: **none today**. The only caller is `submit-checklist.ts:36` which passes `data` already validated by Zod — Zod produces tree-shaped output. No cycle path exists.

**Recommendation:** leave as-is. Adding cycle detection (`WeakSet` of seen refs) would be premature defensive code per project's KISS rule. Document the assumption in a code comment if the function ever gets a second caller.

---

### #4 — Smoke script crashes with cryptic error when `.env.local` is missing required vars
**Severity:** Low (UX, dev-only)
**File:** `scripts/smoke-send.ts:1-9`

The top-level `import { sendChecklistEmail, verifyTransport } from "@/server/mailer"` triggers `env.ts` → `parseEnv()` at import time. If `SMTP_USER`/`SMTP_PASS` are missing, the script dies with `Error: Missing required environment variables: ...` **before** `usage()` can run, so the dev never sees the help text.

Realistic impact: confusing first-run experience for someone who just cloned the repo and forgot to populate `.env.local`. Self-correcting once they read the error.

**Recommendation:** leave as-is. The error message names the missing var. Adding a lazy-import dance to fix this is more code than it's worth.

---

### #5 — Test isolation depends on engagement-name uniqueness, not explicit dedupe reset
**Severity:** Low (test maintenance risk)
**File:** `src/server/__tests__/submit-checklist.test.ts`

Tests use ``engagementName: `Happy ${Date.now()}` `` to avoid collisions with the module-level `seen` Map in `dedupe.ts`. Works because `Date.now()` differs per test, but the **assumption is implicit**. A future dev who copies a test and forgets to `Date.now()` the engagement name will get a flaky failure when their test runs after another test with the same name.

`dedupe.ts` now exports `_resetDedupe()` (added in commit `32c296c`) — submit-checklist tests should use it in `beforeEach`, but currently don't.

**Recommended fix:** add `import { _resetDedupe } from "../dedupe"` and `beforeEach(() => _resetDedupe())` in `submit-checklist.test.ts`. Then the `Date.now()` engagement-name suffix can be removed.

---

### #6 — `scripts/fixtures/submissions.ts` 5-No selection logic has dead "fallback" branch
**Severity:** Cosmetic
**File:** `scripts/fixtures/submissions.ts:50-70`

Lines 50-58 iterate `sections.slice(3)` to add 2 more "no" answers. With current data (12 sections, ≥1 question each), this branch always finds 2 candidates and `targets.length` reaches 5. The fallback at lines 59-70 is unreachable.

If sections shrink to 3, the fallback would kick in. Not a bug — just code that's currently unverified by any execution path.

**Recommendation:** leave as-is. Removing the fallback is a one-liner saving but the comment ("at least 3 sections") is the contract; data-shrink would still need to honour it.

---

### #7 — `mailer.ts` lazy-singleton can leak between Vitest tests if `vi.resetModules()` is forgotten
**Severity:** Low (test gotcha)
**File:** `src/server/mailer.ts:6`

`let _transporter: Transporter | null = null` is module-level. Vitest's default behaviour caches modules across tests in the same file. Existing `mailer.test.ts` uses `vi.resetModules()` in `beforeEach` to force re-import — but this is implicit knowledge.

**Recommendation:** leave as-is. Documenting the gotcha in a code comment would help future test authors but is optional.

---

### #8 — `checklist-form.tsx:111` non-null assertion on `missing[0]`
**Severity:** Cosmetic
**File:** `src/components/checklist-form.tsx:110-111`

```ts
if (missing.length > 0) {
  const firstNum = parseInt(missing[0]!.replace("q", ""), 10);
```

The `!` is required because `noUncheckedIndexedAccess: true` in tsconfig types `missing[0]` as `string | undefined`. Behaviour is correct (the length check guarantees presence). Pure style choice between `!`, `?? ""`, or destructuring with default.

**Recommendation:** leave as-is.

---

## Items audited and confirmed correct

These were checked closely and found to be sound. Listed so a future re-audit doesn't redo the work.

| File | What was checked | Verdict |
|---|---|---|
| `src/server/mailer.ts` | `resolveSecure()` precedence (env override > port-default), pool vs no-pool branching, TLS minVersion pinning, timeout values | ✅ Correct |
| `src/server/env.ts` | `envBool` preprocess covers all expected truthy/falsy strings, port coercion rejects negative/zero/non-numeric, email validation on `SMTP_USER` | ✅ Correct |
| `src/server/submit-checklist.ts` | Order of operations (validate → dedupe → derive → PDF → render → send), error propagation, sanitised SMTP error logging (no `auth`, no `stack`, no password) | ✅ Correct |
| `src/server/email/render.ts` | `buildEmailSubject` matches spec verbatim (hyphen-space), `buildNoAnswersList` preserves section + question ordering, react-email auto-escapes interpolations | ✅ Correct |
| `src/middleware.ts` | Basic Auth with timing-safe compare, fail-closed when env missing | ✅ Correct (pre-existing) |
| `src/components/checklist-form.tsx` | React 19 `inert` prop usage, missed-question scroll-and-focus flow | ✅ Correct |
| `src/server/__tests__/*.test.ts` | Coverage of error branches, security assertions (no password leak, no XSS), edge cases | ✅ Comprehensive (with caveat #5) |

---

## Summary

**3 actionable findings:**
- **#1** — Fix `undefined`-key handling in `canonicalize()`. Add regression test. (~5 lines + 1 test.)
- **#2** — Move `scripts/fixtures/submissions.ts` into `src/` to remove the cross-boundary import in `(dev)/preview-email/page.tsx`. (~3 file moves + 2 import path updates.)
- **#5** — Use `_resetDedupe()` in `submit-checklist.test.ts beforeEach` instead of `Date.now()` engagement names. (~2 lines.)

**5 informational:** #3, #4, #6, #7, #8 — recommend leave-as-is per YAGNI/KISS.

**Net assessment:** migration is functionally sound. No high-severity issues. The two findings worth acting on (#1 and #2) are both small and isolated; together they are <30 lines of code change.

## Open questions
- Should `(dev)/preview-email` route survive at all? It's already gated by `NODE_ENV !== "production"` and duplicates what the smoke script does. Removing it would also resolve finding #2 with zero cost.
- Vercel deploy of this branch hasn't happened — finding #2 is a hypothesis, not a confirmed failure. A throwaway preview deploy would settle it.
