# Phase 01 — Dependency & Env Swap

## Context links
- Plan: [plan.md](./plan.md)
- Replaces parts of: `plans/20260505-2006-cbv-practice-inspection-checklist/phase-07-auth-deploy.md` (env section)

## Overview
- Date: 2026-05-10
- Description: Remove the `resend` package + env var. Add `nodemailer` + `@types/nodemailer`. Update `src/server/env.ts`, `.env.example`, and the env table in `README.md`. Document Gmail App Password generation.
- Priority: P0 (blocks all later phases)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- `resend` is only referenced in `src/server/resend-client.ts` and `src/server/submit-checklist.ts` (verified by grep at plan time). Removing the dep cleanly is mechanical.
- `env.ts` uses Zod with `safeParse` — schema changes propagate type-safely to all consumers via `import { env }`.
- Gmail App Passwords are 16 chars, displayed with spaces in the UI; users must paste them **without spaces** — call this out in `.env.example` and README.

## Requirements
- `package.json`: remove `resend`; add `nodemailer` (latest stable, ^6.x) and `@types/nodemailer` (devDep).
- `pnpm-lock.yaml` regenerated.
- `src/server/env.ts` final schema:
  ```ts
  z.object({
    SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().int().positive().default(465),
    SMTP_SECURE: z.coerce.boolean().optional(),  // resolved in mailer.ts based on port
    SMTP_USER: z.string().email(),
    SMTP_PASS: z.string().min(1),
    EMAIL_FROM: z.string().min(1).optional(),    // defaults to SMTP_USER at use site
    SMTP_POOL: z.coerce.boolean().default(false),
  })
  ```
  No `RESEND_API_KEY`.
- `.env.example` rewritten — see Architecture below for exact contents.
- `README.md` env table updated; "Getting a Resend API key" section replaced by "Generating a Gmail App Password".
- Zero references to `resend`, `Resend`, `RESEND_API_KEY` anywhere outside `plans/` (the old plans stay as historical record).

## Architecture
**`.env.example` (full new contents)**
```
# --- SMTP (Gmail) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
# SMTP_SECURE=true   # auto: true when SMTP_PORT=465, false otherwise

SMTP_USER=inspections@aspenval.com
# 16-char App Password from Google Account → Security → App Passwords.
# Paste WITHOUT spaces.
SMTP_PASS=abcdabcdabcdabcd

# Optional. Defaults to SMTP_USER when unset.
# Use a display name + alias when Workspace send-as is configured:
# EMAIL_FROM="Aspen Valuations <inspections@aspenval.com>"
# EMAIL_FROM=

# Optional. Set true ONLY on a long-lived Node host (VPS/Docker), never on Vercel.
# SMTP_POOL=false

# --- Basic Auth (Vercel Hobby) ---
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=changeme

# --- Unused in v1, retained for future ---
# OPENAI_API_KEY=sk-...
```

**README env table (replacement)**
| Variable | Required | Description |
|---|---|---|
| `SMTP_HOST` | No | SMTP host. Default `smtp.gmail.com`. |
| `SMTP_PORT` | No | SMTP port. Default `465` (TLS). Use `587` for STARTTLS. |
| `SMTP_USER` | Yes | Sender Gmail/Workspace address. |
| `SMTP_PASS` | Yes | Gmail **App Password** (16 chars, no spaces). |
| `EMAIL_FROM` | No | From header. Defaults to `SMTP_USER`. |
| `SMTP_POOL` | No | `true` to enable connection pooling. **Leave false on Vercel.** |
| `BASIC_AUTH_USER` | Yes | HTTP Basic Auth username. |
| `BASIC_AUTH_PASS` | Yes | HTTP Basic Auth password. |
| `OPENAI_API_KEY` | No | Present but unused in v1. |

**README "Generating a Gmail App Password" (new section, replaces Resend section)**
1. Sign in to the Google account you want to send from. **2-Step Verification must be enabled** (Account → Security → 2-Step Verification).
2. Go to https://myaccount.google.com/apppasswords.
3. Name it "CBV Checklist" and click **Create**.
4. Copy the 16-char password Google shows once. **Strip the spaces** before pasting into `SMTP_PASS`.
5. If your Google account is a Workspace tenant and admins have disabled App Passwords, ask your admin to allow them, OR switch to the deferred OAuth2 path (out of scope v1).

## Related code files
- `package.json`
- `pnpm-lock.yaml`
- `src/server/env.ts`
- `.env.example`
- `README.md`

## Implementation Steps
1. `pnpm remove resend`
2. `pnpm add nodemailer`
3. `pnpm add -D @types/nodemailer`
4. Rewrite `src/server/env.ts` per schema above. Verify `pnpm type-check` still green at this point — `submit-checklist.ts` will break (expected, fixed in Phase 03), but `env.ts` itself must compile cleanly.
5. Overwrite `.env.example` with the new contents above.
6. Update `README.md`:
   - Replace the env table.
   - Replace the "Getting a Resend API key" + "Email sender domain (DNS)" sections with the new "Generating a Gmail App Password" section.
   - Update the Stack section: `**Resend** — transactional email` → `**Nodemailer** (Gmail SMTP) — transactional email`.
7. `git grep -i resend -- src/ README.md .env.example package.json` should return nothing. (grep in `plans/` is allowed — that's history.)

## Todo list
- [ ] `pnpm remove resend`
- [ ] `pnpm add nodemailer @types/nodemailer`
- [ ] Rewrite `src/server/env.ts`
- [ ] Overwrite `.env.example`
- [ ] Update README env table + Resend section
- [ ] Update README Stack section
- [ ] `git grep` clean of `resend` in src/

## Success Criteria
- `pnpm install` clean, lockfile updated.
- `pnpm type-check` reports the **expected** breakage in `submit-checklist.ts` only (caught and fixed in Phase 03). `env.ts`, `mailer.ts` (Phase 02) compile.
- `.env.example` parses successfully through the new Zod schema when filled with placeholder values.
- README has zero Resend mentions outside the historical plan folder.

## Risk Assessment
- **App Passwords disabled by Google in future.** Low near-term risk — Google has signaled deprecation only for consumer Gmail without 2FA. Workspace + 2FA path remains. Fallback: OAuth2 (deferred).
- **User pastes App Password with spaces.** SMTP auth fails with `EAUTH` — README + `.env.example` both warn explicitly.

## Security Considerations
- `SMTP_PASS` must never be logged. Phase 03 error handler logs only `err.code` + `err.message` (Nodemailer scrubs credentials from its own messages, but the rule still stands).
- `.env.local` is already gitignored (verified at plan time); no change needed.
- README must NOT include the literal App Password example as a copy-paste-able value — current `.env.example` uses `abcdabcdabcdabcd` placeholder which is obviously fake.

## Next steps
Phase 02 — implement the transport module that consumes these env vars.
