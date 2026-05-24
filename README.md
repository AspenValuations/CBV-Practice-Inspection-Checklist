# CBV Practice Inspection Checklist

**Aspen Valuations** — Internal tool for completing the CBV Practice Inspection Checklist per Valuation Practice Standards 100/110/120/130.

**v2 changes:** Engagement Profile gate logic (6 gates that grey out non-applicable questions), redesigned branded HTML email (no PDF), run-compacted Q&A log, review modal with pre-submit validation.

---

## How to use this tool

1. **Engagement Details** — Enter the preparer name, reviewer name, engagement name, completion date, valuation date, and the recipient email address where the completed checklist will be sent.

2. **Engagement Profile** — Answer the 6 gate questions:
   - G1: Is this an oral valuation conclusion?
   - G2: Which standards apply (CBV or IVS)?
   - G3: What type of conclusion (Comprehensive / Estimate / Calculation / IVS Standard)?
   - G4: Are there scope limitations?
   - G5: Was a signed engagement letter obtained?
   - G6: Was a representation letter obtained?

   Gates immediately grey out questions that are not applicable to your engagement.

3. **PS Sections (100–130)** — Work through each question with Yes / No / N/A buttons. Any "No" answer is flagged and highlighted in red. Add an optional note to explain the deviation.

4. **Review & Submit** — Once all active questions are answered, the "Review & Submit" button opens a modal showing the submission summary: scorecard (Yes / No / N/A / Excluded counts), flagged items list, and preparer/reviewer signatures. The button is disabled until every active question has an answer.

5. **Email** — After confirming in the modal, the server sends a branded HTML email to the recipient address. The email contains:
   - **Part 1:** Engagement details, scorecard, status banner, and flagged item list.
   - **Part 2:** Full Q&A log — compacted "run" lines for consecutive same-answer questions, full No rows with notes, and greyed exclusion blocks for inactive questions with the gate reason.

   Per PS 130, save each email to the engagement file as the 5-year compliance record. No PDF is generated.

---

## Stack

- **Next.js 15** App Router + Server Actions (Node runtime)
- **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** + Radix UI primitives
- **react-hook-form** + **Zod** — form state, validation, gate-aware schema
- **react-email** (`@react-email/render`) — branded HTML email, no PDF
- **Nodemailer** (Gmail SMTP) — transactional email
- **Vitest** — unit tests
- **Vercel** — deployment target

---

## Local development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10

### Setup

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local with your SMTP credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Email preview (dev only)

```bash
# Visit the dev preview page to see the rendered email in an iframe:
# http://localhost:3000/preview-email
# http://localhost:3000/preview-email?case=empty
# http://localhost:3000/preview-email?case=with-no
```

### Smoke send

```bash
# Send a real email via SMTP to verify end-to-end delivery:
pnpm tsx scripts/smoke-send.ts your@email.com
pnpm tsx scripts/smoke-send.ts your@email.com empty    # 0 flags
pnpm tsx scripts/smoke-send.ts your@email.com with-no  # 5 flags
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SMTP_HOST` | No | SMTP host. Default `smtp.gmail.com`. |
| `SMTP_PORT` | No | SMTP port. Default `465` (TLS). Use `587` for STARTTLS. |
| `SMTP_USER` | Yes | Sender Gmail/Workspace address. |
| `SMTP_PASS` | Yes | Gmail **App Password** (16 chars, no spaces). |
| `EMAIL_FROM` | No | From header. Defaults to `SMTP_USER`. |
| `SMTP_POOL` | No | `true` to enable connection pooling. Leave `false` on Vercel. |

### Generating a Gmail App Password

1. Sign in to the Google account you want to send from. **2-Step Verification must be enabled.**
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Name it "CBV Checklist" and click **Create**.
4. Copy the 16-char password. **Strip the spaces** before pasting into `SMTP_PASS`.

---

## Architecture

### Gate logic

Six gate questions (`g1Oral` through `g6RepLetter`) feed `computeInactiveSet(gates)` which returns a `Set<string>` of greyed question IDs. All downstream logic (form validation, scorecard tally, email Q&A log, exclusion blocks) receives this set and skips inactive questions consistently.

Gate rules are declared in [`src/lib/checklist/gates.ts`](src/lib/checklist/gates.ts).

### Email pipeline

```
Server Action (submitChecklist)
  → renderChecklistEmail()
      → computeInactiveSet()  → tallyAll()  → buildFlaggedItems()  → buildBlocks()
      → ChecklistEmail (react-email JSX)
      → render() → html + plainText
  → sendChecklistEmail() (Nodemailer)
```

`buildBlocks()` produces `SectionBlocks[]` with three block types:
- **`run`** — compacted consecutive same-label (Yes or N/A) questions
- **`no`** — a full No row with question text, answer badge, and note
- **`exclusion`** — a grey box naming excluded question numbers and the gate reason

### Data model

All 83 questions are in [`src/lib/checklist/data.ts`](src/lib/checklist/data.ts). IDs are intentionally gappy (`q9/q10/q11` absent — IVS section excluded per firm policy) so question numbers match the source PDF.

Question text uses `parts: QPart[]` (array of `{ text, bold? }` segments) for keyword bolding.

---

## Scripts

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm type-check   # TypeScript check
pnpm lint         # ESLint
pnpm test         # Vitest unit tests
```

---

## Deployment (Vercel)

```bash
vercel link        # one-time project link
vercel --prod      # deploy to production
```

Set these env vars in the Vercel dashboard: `SMTP_USER`, `SMTP_PASS`, and optionally `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`.

The `/preview-email` dev route returns 404 in production automatically.

---

## Retention

Per PS 130, each submitted checklist email serves as the compliance record. Save the email to the client engagement file. Recommended retention: 5 years.
