# CBV Practice Inspection Checklist

**Aspen Valuations** — Internal tool for completing the CBV Practice Inspection Checklist per Valuation Practice Standards 100/110/120/130.

## What it does

1. Preparer fills in their name, completion date, engagement name, and recipient email.
2. Answers 83 Yes/No/N/A questions (sections PS100 → PS130; IVS section excluded per firm policy).
3. Clicks **COMPLETE** — the app validates all answers, generates a PDF, and emails it to the recipient.
   - If questions are missing: highlights them with a jump-to-question banner.
   - If all complete: sends email with PDF attached. Body lists any "No" answers for follow-up.

## Stack

- **Next.js 15** App Router + Server Actions (Node runtime)
- **TypeScript** (strict)
- **Tailwind CSS v4** + custom shadcn-compatible UI components
- **react-hook-form** + **Zod**
- **@react-pdf/renderer** — server-side PDF generation
- **Nodemailer** (Gmail SMTP) — transactional email with PDF attachment
- **Vercel** — deployment target (Hobby/Free tier)
- **Basic Auth middleware** — gates all routes

## Local development

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 10

### Setup

```bash
# Install dependencies
pnpm install

# Copy env template and fill in values
cp .env.example .env.local
# Edit .env.local — see Environment Variables below

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — browser will prompt for Basic Auth credentials.

## Environment variables

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

### Generating a Gmail App Password

1. Sign in to the Google account you want to send from. **2-Step Verification must be enabled** (Account → Security → 2-Step Verification).
2. Go to https://myaccount.google.com/apppasswords.
3. Name it "CBV Checklist" and click **Create**.
4. Copy the 16-char password Google shows once. **Strip the spaces** before pasting into `SMTP_PASS`.
5. If your Google account is a Workspace tenant and admins have disabled App Passwords, ask your admin to allow them, OR switch to OAuth2 (out of scope v1).

If Gmail later blocks the App Password (e.g. after suspicious-login alerts), regenerate a new one in the same screen and update `SMTP_PASS`.

## Deployment (Vercel)

```bash
# Link to Vercel project (one time)
vercel link

# Add production env vars in Vercel dashboard:
# SMTP_USER, SMTP_PASS, EMAIL_FROM (optional), BASIC_AUTH_USER, BASIC_AUTH_PASS

# Deploy
vercel --prod
```

Auth on Vercel Hobby: the `src/middleware.ts` basic-auth middleware runs on every request. Set `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` in the Vercel project environment variables — the app **blocks all traffic** until both are set.

## Scripts

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm type-check   # TypeScript check
pnpm lint         # ESLint
pnpm test         # Vitest unit tests
```

## Data model

All 83 questions are encoded in [`src/lib/checklist/data.ts`](src/lib/checklist/data.ts). Question IDs are intentionally gappy (`q9`/`q10`/`q11` absent — IVS section excluded) so question numbers match the source PDF verbatim.

## Future / deferred

- **Database persistence**: Vercel Postgres (Neon) + Vercel Blob for retained PDFs. Add in `src/server/submit-checklist.ts` alongside the SMTP send call.
- **AI assist**: `OPENAI_API_KEY` is available if note-phrasing suggestions are ever added.
- **Email CC / allowlist**: add `EMAIL_ALLOWLIST` env var and validate recipient in Server Action if abuse concerns arise.
