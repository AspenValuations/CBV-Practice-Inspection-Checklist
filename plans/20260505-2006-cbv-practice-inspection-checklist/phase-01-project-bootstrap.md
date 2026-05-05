# Phase 01 — Project Bootstrap

## Context links
- Plan: [plan.md](./plan.md)
- Research: [researcher-01-techstack.md](./research/researcher-01-techstack.md)

## Overview
- Date: 2026-05-05
- Description: Stand up empty Next.js 15 App Router repo with TS strict, Tailwind v4, shadcn/ui scaffold, ESLint/Prettier, pnpm, env scaffolding, Vercel project link.
- Priority: P0 (blocks all)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Greenfield. Zero existing code. Repo root has only the source PDF and `plans/`.
- Node runtime mandatory for submission route (react-pdf, Resend). Edge is not an option.
- pnpm chosen — faster, deterministic; Vercel supports natively.
- Tailwind v4 = CSS-first config (`@theme` in globals.css), no `tailwind.config.ts` for tokens.

## Requirements
- `pnpm` lockfile committed.
- TS `strict: true`, `noUncheckedIndexedAccess: true`.
- App Router only (no `pages/`).
- Tailwind v4 with shadcn-compatible CSS variables.
- ESLint flat config; Prettier; sorted imports.
- `.env.example` with: `RESEND_API_KEY`, `EMAIL_FROM=onboarding@resend.dev`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`, `OPENAI_API_KEY` (commented as unused). Note: no `EMAIL_TO` — recipient is form-driven.
- Path alias `@/*` → `src/*`.

## Architecture
Standard Next 15 layout under `src/`. App segments under `src/app/`. UI primitives under `src/components/ui/` (shadcn). Domain code under `src/lib/`. Server-only code colocated with the route or under `src/server/`.

## Related code files
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.prettierrc`
- `src/app/layout.tsx`
- `src/app/page.tsx` (placeholder)
- `src/app/globals.css`
- `components.json` (shadcn)
- `.env.example`
- `.gitignore`
- `README.md` (stub)

## Implementation Steps
1. `pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm`. Verify Tailwind v4 (otherwise upgrade per Tailwind v4 migration guide).
2. Tighten `tsconfig.json`: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes.
3. Add Prettier + `prettier-plugin-tailwindcss`. Hook into ESLint.
4. `pnpm dlx shadcn@latest init` → New York style, neutral base. Generates `components.json`, `src/components/ui/`, CSS variables in globals.css.
5. Pre-pull shadcn primitives needed downstream: `button input textarea radio-group label form alert calendar popover` via `pnpm dlx shadcn@latest add ...`.
6. Create `.env.example`. Create local `.env.local` (git-ignored) with placeholders.
7. Replace home page with placeholder reading `Aspen — CBV Practice Inspection Checklist`.
8. `vercel link` to project. Add prod env vars in Vercel dashboard (defer real Resend key to Phase 07).
9. Verify `pnpm dev`, `pnpm build`, `pnpm lint` all pass clean.

## Todo list
- [ ] Init Next 15 + TS strict + Tailwind v4 + pnpm
- [ ] Tighten tsconfig
- [ ] Prettier + sort imports
- [ ] shadcn init + add primitives
- [ ] .env.example + .env.local
- [ ] Vercel link
- [ ] Smoke build/lint

## Success Criteria
- `pnpm build` clean, `pnpm lint` clean, `pnpm dev` shows placeholder.
- `vercel` deploy of placeholder serves a 200.
- All shadcn primitives importable.

## Risk Assessment
- Tailwind v4 still has ecosystem rough edges (some shadcn templates assume v3). Mitigate by pinning shadcn registry that supports v4 or hand-tweak generated CSS variables.
- `create-next-app` defaults shift release-to-release; double-check `app` + `src` flags are honored.

## Security Considerations
- `.env.local` git-ignored. Never commit.
- README warns OPENAI_API_KEY unused but present.

## Next steps
Phase 02 — encode the 83-question data model.
