# Tech Stack Research — CBV Practice Inspection Checklist

**Date:** 2026-05-05
**Scope:** Single-form (~83 question) internal valuation checklist on Vercel. Solo dev, low traffic, PDF-on-submit + email.

---

## 1. Framework: Next.js 15 (App Router) vs alternatives

| Option | Verdict |
|---|---|
| **Next.js 15 App Router** | Vercel's first-class target. Server Actions handle the submit-validate-PDF-email pipeline with zero API boilerplate. Mature ecosystem for every other layer below. |
| Remix / React Router v7 | Fine on Vercel, but loses no-config edge over Next here. Smaller ecosystem for the specific bits (shadcn, RHF integrations are Next-flavored in docs). |
| SvelteKit | Excellent DX, smaller bundles — but solo dev + React-centric form/UI ecosystem (RHF, shadcn) means you'd reinvent integrations. No upside for an 83-field form. |
| Astro | Wrong tool. Astro shines for content-heavy mostly-static sites. A stateful 83-field form with client validation is the island-heavy case Astro doesn't optimize for. |

**Pick: Next.js 15 App Router.** Server Actions are the killer feature for this exact shape (form submit -> server-side PDF + email, no separate `/api` route needed). Brutal truth: every alternative is a sidegrade at best for a Vercel-deployed React form app.

## 2. UI: shadcn/ui + Tailwind vs Mantine vs MUI

| Option | Verdict |
|---|---|
| **shadcn/ui + Tailwind** | Components are copy-pasted into your repo — full control, no version lock-in, no runtime cost. `Form`, `RadioGroup`, `Textarea`, `Calendar`/`DatePicker`, `Input` cover 100% of needs. Pairs natively with react-hook-form + Zod (shadcn `Form` is built on RHF). |
| Mantine | Batteries included, good DatePicker. But heavier runtime, opinionated styling, less idiomatic on Vercel/Next 15 RSC (some components require client). Fine, just not better here. |
| MUI | Overkill. Heavy bundle, Emotion runtime cost, Material aesthetic is wrong for an internal accountancy tool. Slowest of the three. |

**Pick: shadcn/ui + Tailwind.** For a long form, having the Form/Field primitives pre-wired to RHF + Zod saves the most boilerplate. No runtime style cost matters when the page is one giant form.

## 3. Form state: react-hook-form + Zod vs alternatives

| Option | Verdict |
|---|---|
| **react-hook-form + Zod (`@hookform/resolvers/zod`)** | The default for a reason. RHF's uncontrolled model handles 83 fields without re-render storms. Zod schema doubles as the Server Action input validator — write once, validate client + server. |
| TanStack Form | Newer, type-safe, framework-agnostic. Solid, but ecosystem (shadcn integration, examples) still trails RHF. No win for solo dev. |
| Formik | Legacy. Slower, more re-renders, smaller community in 2026. Skip. |
| Native `<form>` + Server Actions only | Tempting for "simple" — but with 83 conditional/required fields and per-question note validation, you want client-side feedback before submit. RHF + Zod gives that for ~5kb. |

**Pick: react-hook-form + Zod.** Reuse the Zod schema in the Server Action for defense-in-depth. shadcn `Form` is literally built on this combo.

## 4. Optional persistence

The hard requirement is "PDF emailed to fixed address." Persistence is "nice to have" for audit only.

| Option | Verdict |
|---|---|
| **No DB (default)** | Email IS the audit trail. The recipient inbox + attached PDF is durable, searchable, backed up by IT. Zero ops cost. Ship this first. |
| Vercel Postgres (Neon) | Right answer *if* persistence becomes required. Relational fits the structured 83-question schema. Free tier ample for internal use. |
| Vercel KV (Upstash Redis) | Wrong shape. KV for a structured submission record is awkward; you'd serialize JSON blobs and lose queryability. |
| Supabase | Fine, but adds an external vendor + auth surface for no benefit over Vercel Postgres on a Vercel-deployed app. |

**Pick: No DB initially. If audit persistence is later required, add Vercel Postgres (Neon) and write the row inside the Server Action alongside the email send.** Also stash the generated PDF in Vercel Blob if you do persist — keeps the canonical artifact, not just the data.

## 5. Auth

Internal tool, low traffic, single-form app. Threat model: prevent random internet from submitting noise / DoS'ing the email recipient.

| Option | Verdict |
|---|---|
| **Vercel Deployment Protection (Password / SSO)** | Toggle in dashboard, zero code, gates the entire deployment. On Pro plans includes Vercel Authentication (SSO via Vercel team) and Password Protection. This is the right default. |
| Basic auth middleware | Works (single env-var password checked in `middleware.ts`), but you reinvent what Vercel ships. Use only if on Hobby tier where Deployment Protection is limited. |
| Magic link via Resend (e.g. Auth.js Email provider) | Overengineered for one form one user-class. Adds a users table, email deliverability concerns, session handling. Skip. |
| None | Don't. A public form that emails a fixed address is a spam cannon waiting to happen. |

**Pick: Vercel Deployment Protection (Password Protection or team SSO depending on plan).** If on Hobby, fall back to a one-line basic-auth `middleware.ts` reading `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` env vars.

---

## PDF + Email pipeline (not asked but load-bearing)

- **PDF generation:** `@react-pdf/renderer` in the Server Action. Declarative React components, runs in Node runtime on Vercel (NOT Edge — set `export const runtime = 'nodejs'`). Alternative: `pdf-lib` if you want lower-level control. Avoid headless-Chrome (Puppeteer) on Vercel — cold start pain, larger function size.
- **Email:** **Resend** with `react-email` for the body template. Native Vercel-friendly, generous free tier, attach the PDF buffer directly. Skip Nodemailer/SMTP unless IT mandates a corporate relay.

## OpenAI

YAGNI. The form is structured Y/N/NA + free-text notes. No phrasing-suggestion feature is in scope, and adding it introduces a token-cost surface, latency on every keystroke, and a confidentiality review for an internal compliance tool. Defer until a user actually asks for it.

---

## Recommended stack

- **Framework:** Next.js 15 (App Router) + Server Actions, Node.js runtime for the submit handler
- **Language:** TypeScript (strict)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Form:** react-hook-form + Zod (schema reused server-side in the Server Action)
- **PDF:** @react-pdf/renderer
- **Email:** Resend + react-email template, fixed `to:` address from env var
- **Persistence:** None initially. Upgrade path: Vercel Postgres (Neon) + Vercel Blob if audit requirement is confirmed
- **Auth:** Vercel Deployment Protection (Password or team SSO). Basic-auth middleware fallback on Hobby tier
- **AI:** None. OpenAI key unused.
- **Hosting:** Vercel (obviously)

---

## Unresolved questions

1. **Vercel plan tier?** Determines whether Deployment Protection (Pro+) or basic-auth middleware (Hobby) is the auth path.
2. **Audit retention requirement?** If regulatory/CBV requires retained submissions, persistence becomes mandatory (not optional) — flips default to Vercel Postgres + Blob from day one.
3. **Recipient email — single fixed address or list?** Affects whether to env-var a CSV or build a tiny config.
4. **Conditional logic in the 83 questions?** (e.g., "if Q12 = No, require note"). Affects Zod schema complexity but not the stack choice.
5. **Branding / letterhead on the PDF?** If yes, request the logo/header assets up front for the @react-pdf template.
6. **Draft-saving / resume-later?** Currently assumed no. If yes, persistence becomes required (localStorage is a non-answer for an audit context) and re-evaluate.
