# Researcher-02: PDF Generation & Transactional Email on Vercel Serverless

Date: 2026-05-05
Scope: Form submit → generate 5–10 page PDF (preparer info + 83 Q&A items) → email PDF to `connect@aspenval.com`. Body templated, lists "No" answers.

## PDF Generation Options

### 1. `@react-pdf/renderer` — declarative React → PDF
- **Pros:** JSX-driven layout matches existing React/Next mental model; styles look CSS-like (flex, fontFamily); pure JS, runs fine in Node serverless; great for repetitive layouts (looping over 83 Q&A items as `<View>` rows is trivial); page breaks handled automatically.
- **Cons:** Bundle weight is real — adds ~1–2 MB to function (well under 250 MB Pro, but visible on Hobby's 50 MB compressed limit if combined with other heavy deps); cold start ~500–900 ms first invocation; font loading from disk requires `Font.register` with explicit paths bundled in `public/` or imported as buffers; CSS support is a subset (no grid, limited media queries).
- **Verdict:** Best fit here. Worth the weight.

### 2. `pdf-lib` — programmatic, lightweight
- **Pros:** Tiny (~500 KB), fast, can also *modify* existing PDFs, no JSX surface. Great for stamping a template or filling AcroForm fields.
- **Cons:** No layout engine. Drawing 83 rows of Q&A means manual `drawText` with x/y coordinates, manual page-break math, manual word wrap. For a 5–10 page document with mixed-length notes, you'll reinvent flexbox.
- **Verdict:** Wrong tool for variable-length content. Reserve for filling a fixed PDF template if one exists.

### 3. `pdfkit` — imperative, mature
- **Pros:** Mature, decent flow API (`doc.text(...).moveDown()`); auto page-breaks; reasonable size (~1 MB).
- **Cons:** Imperative — every conditional ("show note row only if note present") becomes procedural code; styling is verbose; less ergonomic than React for component reuse; font subsetting historically painful in serverless.
- **Verdict:** Workable but loses to react-pdf on DX for this use case.

### 4. Headless Chromium (`@sparticuz/chromium` + `puppeteer-core`)
- **Pros:** Pixel-perfect HTML/CSS rendering — you literally print the existing UI.
- **Cons:** ~50 MB compressed binary alone — blows Hobby tier and consumes most of Pro's 250 MB; cold starts 2–5 s; binary version drift with Node/Next upgrades is a maintenance tax. Overkill for a structured form.
- **Verdict:** Avoid unless the layout *must* match a complex existing HTML page exactly. Not the case here — 83 Q&A rows are trivially modeled in react-pdf.

### 5. Client-side (`window.print` / `jsPDF` / `html2canvas`)
- **Pros:** Zero server cost; uses user's CPU; bypasses serverless size/time limits entirely.
- **Cons:** `window.print` produces user-saved file, not an attachment payload — can't auto-email without a separate upload step. `jsPDF + html2canvas` rasterizes to canvas → bloated, ugly, non-selectable text, font issues. Multi-page output quality is poor. User can also abort/close the tab mid-flow.
- **Verdict:** Not viable for "auto-email on submit" UX. Acceptable only as a user-initiated "Download PDF" button alongside the email flow.

## Email Service Options

### 1. Resend — **recommended**
- Free tier: **3,000/mo, 100/day, 1 domain**. Plenty for an internal CBV checklist.
- Vercel partner integration (one-click env var injection); idiomatic SDK (`resend.emails.send({ attachments: [{ filename, content }] })`); React Email components if templated body grows.
- **Attachment limit: 40 MB total per message (base64-encoded)** — a 5–10 page text PDF is ~50–200 KB, nowhere near.
- Requires DNS verification (SPF/DKIM via TXT records) for custom sender domain (e.g., `noreply@aspenval.com`). Without it, must send from `onboarding@resend.dev` (fine for testing only).

### 2. SendGrid
- Free tier killed/reduced in 2025; paid plans start higher than Resend. Heavier setup, more enterprise-y. **Skip** for one-recipient internal use.

### 3. Postmark
- Excellent deliverability and support; no free tier (100 test emails only); ~$15/mo entry. Worth it for transactional volume but overkill here.

### 4. Nodemailer + SMTP (Gmail / SES)
- Most flexible, but you wire auth, retries, error handling, and (for Gmail) deal with app passwords + 2000/day cap. SES is cheap ($0.10/1k) and supports 40 MB but requires AWS account + verification dance.
- **Verdict:** Use only if Aspen already standardizes on SES/Workspace.

## Recommended Approach

**Stack: `@react-pdf/renderer` (server-side, in a Next.js route handler) + `Resend`.**

Flow:
1. Client posts form JSON to `/api/submit` (App Router route handler, `runtime = 'nodejs'`).
2. Handler renders `<ChecklistPDF data={...} />` to a Buffer via `renderToBuffer`.
3. Builds plaintext + HTML body listing all "No" answers (filter `items.where(answer === 'no')`).
4. Calls `resend.emails.send({ from, to: 'connect@aspenval.com', subject, html, attachments: [{ filename: 'checklist-${date}.pdf', content: buffer }] })`.
5. Returns 200 to client; client shows success.

Rationale: pure JS, no chromium, fits comfortably in Hobby 50 MB and 10 s budgets (PDF gen for 10 pages of text ≈ 1–2 s warm, 2–4 s cold). Resend free tier covers this forever at expected volume. React-pdf's declarative layout maps 1:1 to the 83-item structure (single `.map()`).

Set `maxDuration = 30` on the route (Pro) or rely on 10 s default (Hobby — still ample for this workload).

## Edge Cases & Gotchas

- **Cold start:** First invocation after idle ≈ 1–3 s (Node + react-pdf init). Mitigate with Vercel cron warmer if UX-critical; not necessary for a low-frequency internal form.
- **Font loading in serverless:** Bundle TTF/OTF files via `import` or place in repo and pass absolute path; do **not** fetch fonts from network at request time (adds latency + flakiness). Stick to PDF standard fonts (Helvetica, Times) unless brand requires custom.
- **Resend attachment encoding:** Pass `Buffer` directly (SDK handles base64). 40 MB cap is post-encoding; PDF here is <1 MB so irrelevant.
- **Sender DNS:** Plan a short DNS task — add SPF/DKIM TXT records for `aspenval.com` (or a subdomain like `mail.aspenval.com` to isolate reputation). Until verified, send from `onboarding@resend.dev` in dev.
- **Server-side gen vs client + upload:** Server-side wins. Client-gen-then-upload requires a signed upload endpoint, doubles round-trips, and clients can abort. Only revisit if PDF gen ever exceeds Hobby's 10 s ceiling — unlikely at 10 pages.
- **Idempotency:** If user double-submits, you'll send two emails. Add a client-side disable-on-submit + optional server-side dedupe key (hash of submission payload + timestamp window).
- **Error handling:** If Resend send fails after PDF generated, surface error to user and offer download fallback (return PDF buffer as response). Don't silently swallow.
- **Hobby vs Pro:** Whole stack fits Hobby. Upgrade to Pro only if you need >10 s execution or >100 emails/day.

## Unresolved Questions

1. Is `aspenval.com` DNS controllable by the team for SPF/DKIM, or will sender be a Resend subdomain?
2. Does brand want custom fonts in the PDF (changes bundle approach) or are PDF standard fonts acceptable?
3. Should the submitter receive a CC/confirmation copy, or is it strictly one-recipient to `connect@aspenval.com`?
4. Retention: does a copy of the PDF need to be stored (Vercel Blob / S3) for audit, or is the email the system of record?
5. Hobby vs Pro plan already chosen? Affects size headroom and `maxDuration`.

## Sources

- [Resend Pricing](https://resend.com/pricing)
- [Resend account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
- [Resend new free tier announcement](https://resend.com/blog/new-free-tier)
- [Resend vs SendGrid 2026 (DEV)](https://dev.to/thiago_alvarez_a7561753aa/resend-vs-sendgrid-2026-sendgrid-killed-its-free-tier-now-what-2gh4)
- [Vercel 250 MB function size troubleshooting](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit)
- [react-pdf bundle size on Vercel issue #1504](https://github.com/wojtekmaj/react-pdf/issues/1504)
- [Process PDFs on Vercel serverless guide](https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide)
- [Postmark attachment & size limits](https://postmarkapp.com/support/article/1056-what-are-the-attachment-and-email-size-limits)
