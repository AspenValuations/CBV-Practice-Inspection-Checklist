# Phase 02 — Transport Module

## Context links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 01 (env vars must exist).

## Overview
- Date: 2026-05-10
- Description: Create `src/server/mailer.ts` — a thin Nodemailer wrapper exposing a lazy-singleton transporter, a `sendChecklistEmail(args)` function used by the Server Action, and a `verifyTransport()` probe for the smoke script.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Nodemailer's `createTransport()` is synchronous and cheap; the actual TCP/TLS handshake happens on first `sendMail()`. Lazy-singleton pattern matches the existing `resend-client.ts` shape.
- `secure: true` requires port 465 (implicit TLS). `secure: false` + port 587 uses STARTTLS. We resolve `SMTP_SECURE` at module load: explicit env wins, otherwise `port === 465`.
- `pool: true` only meaningful on long-lived Node hosts. Setting it on Vercel does nothing harmful but offers no benefit and slightly slows cold start. Off by default.
- `verify()` does an SMTP `EHLO` + `AUTH` round-trip without sending — perfect for the smoke script's pre-flight check, and a future `/api/health` endpoint.
- Nodemailer error shape: `Error & { code?: string; command?: string; response?: string; responseCode?: number }`. Phase 03 maps these.

## Requirements
- File `src/server/mailer.ts` exports:
  - `getTransporter(): Transporter` — lazy singleton.
  - `sendChecklistEmail(args: SendArgs): Promise<{ messageId: string }>` — the only function `submit-checklist.ts` calls.
  - `verifyTransport(): Promise<true>` — wraps `transporter.verify()`, throws on failure.
- `SendArgs` shape:
  ```ts
  {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments: Array<{ filename: string; content: Buffer }>;
  }
  ```
- `from` is resolved inside `sendChecklistEmail` (not by caller): `env.EMAIL_FROM ?? env.SMTP_USER`.
- Timeouts wired in `createTransport()`:
  - `connectionTimeout: 8000`
  - `greetingTimeout: 8000`
  - `socketTimeout: 8000`
- `tls: { minVersion: 'TLSv1.2' }` — Gmail rejects older.
- No retries inside the mailer. Server Action surfaces failures; user retries via UI.

## Architecture
```
src/server/
  mailer.ts          ← NEW. Single source of SMTP truth.
  env.ts             ← already updated in Phase 01.
  submit-checklist.ts ← Phase 03 will switch its import to ./mailer.
  resend-client.ts   ← deleted in Phase 03.
```

**`mailer.ts` skeleton** (illustrative — not a literal write-as-is, the implementer fills in details):
```ts
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

let _transporter: Transporter | null = null;

function resolveSecure(): boolean {
  if (env.SMTP_SECURE !== undefined) return env.SMTP_SECURE;
  return env.SMTP_PORT === 465;
}

export function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: resolveSecure(),
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    pool: env.SMTP_POOL,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    tls: { minVersion: "TLSv1.2" },
  });
  return _transporter;
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: Array<{ filename: string; content: Buffer }>;
}

export async function sendChecklistEmail(args: SendArgs): Promise<{ messageId: string }> {
  const from = env.EMAIL_FROM ?? env.SMTP_USER;
  const info = await getTransporter().sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: args.attachments,
  });
  return { messageId: info.messageId };
}

export async function verifyTransport(): Promise<true> {
  await getTransporter().verify();
  return true;
}
```

## Related code files
- `src/server/mailer.ts` (new)
- `src/server/env.ts` (consumed)

## Implementation Steps
1. Create `src/server/mailer.ts` per skeleton above.
2. Confirm `pnpm type-check` passes for the new file in isolation (the rest of the project still has Phase-01-induced errors in `submit-checklist.ts` — that's fine until Phase 03).
3. Do **not** call `getTransporter()` at module top level — singleton must initialize on first use, not on import (avoids touching env at build time on Vercel).

## Todo list
- [ ] Write `mailer.ts`
- [ ] Type-check the new module
- [ ] Confirm no top-level side effects (no `getTransporter()` outside functions)

## Success Criteria
- `import { sendChecklistEmail, verifyTransport, getTransporter } from "@/server/mailer"` resolves with correct types.
- `verifyTransport()` returns true against a real Gmail account when run from `scripts/smoke-send.ts` (Phase 04).
- Setting `SMTP_PORT=587` flips `secure` to `false` automatically (smoke-tested locally if needed).

## Risk Assessment
- **Top-level transporter init at import** would crash builds when env is absent. Mitigation: lazy singleton, env access inside functions only.
- **`pool: true` on Vercel** would still work but is wasteful. Mitigation: README + `.env.example` warn; default `false`.

## Security Considerations
- The transporter object holds `SMTP_PASS` in memory — never `JSON.stringify` or log it. Nodemailer doesn't expose it via toString, but don't add convenience getters that would.
- TLS minimum version pinned to 1.2.

## Next steps
Phase 03 — wire `submit-checklist.ts` to use the new mailer and delete `resend-client.ts`.
