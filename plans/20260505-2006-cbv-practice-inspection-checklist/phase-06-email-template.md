# Phase 06 — Email Template

## Context links
- Plan: [plan.md](./plan.md)
- Spec excerpts: see Requirements below (verbatim from user).

## Overview
- Date: 2026-05-05
- Description: `react-email` template producing HTML+text body. Subject + 2 body branches per spec. Plus dev preview route.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- react-email components `Html`, `Body`, `Container`, `Text`, `Heading`, `Section` — keep it boring; this is internal.
- Plain-text fallback matters for some corp clients — render via `@react-email/render`'s `render(component, { plainText: true })`.
- Subject and body interpolations are user-spec'd — exact wording must match.

## Requirements
- Subject: `Completed CBV Practice Inspection Checklist - <Engagement Name>` (raw name, NOT slug).
- Body if zero "No" answers: `Preparer has completed the CBV Practice Inspection Checklist for <Engagement Name>. No "NO" answer was selected.`
- Body if ≥1 "No" answers: `Preparer has completed the CBV Practice Inspection Checklist for <Engagement Name>. Below are the questions with "NO" answer.` followed by a list. List format:
  ```
  <Section Title>
    Q<n>. <question text>
  ```
  Group by section; within each section, ascending Q number.
- Includes a small footer noting "PDF attached".
- HTML version uses simple paragraphs + nested `<ul>` per section. No CSS frills.

## Architecture
- `src/server/email/checklist-email.tsx` — react-email component.
- `src/server/email/render.ts` — exports `renderChecklistEmail(args): Promise<{ html: string; text: string }>`.
- `src/app/(dev)/preview-email/page.tsx` — dev-only route showing rendered HTML; gated by `NODE_ENV !== 'production'`.

## Related code files
- `src/server/email/checklist-email.tsx`
- `src/server/email/render.ts`
- `src/app/(dev)/preview-email/page.tsx`
- consumed by `src/server/submit-checklist.ts`

## Implementation Steps
1. `pnpm add react-email @react-email/components @react-email/render`.
2. Author component accepting `{ engagementName, noAnswers: NoAnswer[] }`. Branch on `noAnswers.length`.
3. `render.ts`: returns both `html` and `text`.
4. Dev preview page: imports component, renders inline; lists toggle examples for both branches.
5. Verify text version renders cleanly (no stray HTML chars).

## Todo list
- [ ] Component w/ both branches
- [ ] HTML+text renderer
- [ ] Dev preview route
- [ ] Test with 0-No fixture
- [ ] Test with 5-No fixture spanning 3 sections

## Success Criteria
- Subject matches spec verbatim, including ASCII hyphen-space "- " per spec.
- Body matches spec verbatim incl. quoted "NO".
- Text version readable in monospace.
- HTML renders OK in Gmail web (sanity test post-deploy).

## Risk Assessment
- Email-client CSS quirks — keep markup minimal. No images.

## Security Considerations
- No HTML injection risk (engagement name is interpolated as text via react-email which escapes by default; verify no `dangerouslySetInnerHTML`).
- Don't include the full submission JSON in the body (PDF attachment is the artifact).

## Next steps
Phase 07 — auth + deploy.
