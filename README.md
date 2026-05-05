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
- **Resend** — transactional email with PDF attachment
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
| `RESEND_API_KEY` | Yes | From [resend.com](https://resend.com) dashboard |
| `EMAIL_FROM` | Yes | Sender address (start with `onboarding@resend.dev`; switch after DNS verified) |
| `BASIC_AUTH_USER` | Yes | Username for HTTP Basic Auth |
| `BASIC_AUTH_PASS` | Yes | Password for HTTP Basic Auth |
| `OPENAI_API_KEY` | No | Present but unused in v1 |

### Getting a Resend API key

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Go to **API Keys** → **Create API Key**
3. Paste into `RESEND_API_KEY` in `.env.local`

### Email sender domain (DNS)

Initially: set `EMAIL_FROM=onboarding@resend.dev` — this works immediately.

To send from your own domain (e.g. `noreply@aspenval.com`):
1. In Resend dashboard → **Domains** → Add domain
2. Add the provided SPF + DKIM DNS records to your domain registrar
3. Once verified, update `EMAIL_FROM=noreply@aspenval.com` in Vercel dashboard

## Deployment (Vercel)

```bash
# Link to Vercel project (one time)
vercel link

# Add production env vars in Vercel dashboard:
# RESEND_API_KEY, EMAIL_FROM, BASIC_AUTH_USER, BASIC_AUTH_PASS

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

- **Database persistence**: Vercel Postgres (Neon) + Vercel Blob for retained PDFs. Add in `src/server/submit-checklist.ts` alongside the Resend call.
- **AI assist**: `OPENAI_API_KEY` is available if note-phrasing suggestions are ever added.
- **Email CC / allowlist**: add `EMAIL_ALLOWLIST` env var and validate recipient in Server Action if abuse concerns arise.
