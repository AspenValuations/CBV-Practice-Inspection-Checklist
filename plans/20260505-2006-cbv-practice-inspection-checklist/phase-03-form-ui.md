# Phase 03 — Form UI

## Context links
- Plan: [plan.md](./plan.md)
- Phase 02 (data model): [phase-02-data-model.md](./phase-02-data-model.md)

## Overview
- Date: 2026-05-05
- Description: Build the single-page form. Preparer block + sectioned Q list. shadcn-driven RHF/Zod wiring. Accessible. Missed-Q highlight + scroll-to-first on submit.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- 83 fields × ~2 inputs each (radio + textarea) = ~250 inputs. RHF uncontrolled mode is mandatory for perf — do NOT use controlled inputs.
- shadcn `Form` already wires RHF context. Use it.
- Section grouping via `<section aria-labelledby>` with sticky-ish headings; long page is fine — don't paginate.
- Date picker: shadcn Calendar + Popover composition.
- Validation error UX is the most-spec'd UX in this app — get it right first time.

## Requirements
- Preparer block at top: Preparer's Name (text, required), Checklist Completion Date (date picker, required, defaults today), Engagement Name (text, required, max 200), **Recipient Email (email input, required, defaults `DEFAULT_RECIPIENT_EMAIL` from `src/lib/engagement.ts` = `connect@aspenval.com`, editable)**. Show helper text under the email field: "Default: connect@aspenval.com — change only if needed."
- Per question: question number + text rendered, RadioGroup with 2 or 3 options (Yes/No or Yes/No/N/A per `allowsNA`), Textarea labeled "Note (optional)".
- COMPLETE button at bottom; disabled while submitting.
- On submit:
  - **Incomplete:** prevent submit. Compute missing Q IDs via `getMissingQuestionIds`. Render top `Alert` (variant destructive) listing the Q numbers as clickable jump-links. Add `data-missing="true"` + ring-2 ring-destructive on each missed row. `aria-live="assertive"`. Smooth-scroll first missed into view, focus its first radio. Focus management: capture pre-submit focus, restore on success.
  - **Complete:** call Server Action from Phase 04. Show success state replacing the form (with engagement name + summary).
- Mobile responsive (single column ≥ sm; tighter spacing < sm).
- No localStorage draft saving (out of scope v1).

## Architecture
- `src/app/page.tsx` — server component. Renders `<ChecklistForm />` (client) + page chrome.
- `src/components/checklist-form.tsx` — `'use client'`. Reads `sections` from data module. Hosts RHF `useForm({ resolver: zodResolver(submissionSchema) })`.
- `src/components/preparer-block.tsx`, `src/components/question-row.tsx`, `src/components/missing-banner.tsx`.
- Submit calls `submitChecklist` Server Action (defined in Phase 04). On error, surface message via `Alert`.

## Related code files
- `src/app/page.tsx`
- `src/components/checklist-form.tsx`
- `src/components/preparer-block.tsx`
- `src/components/question-row.tsx`
- `src/components/missing-banner.tsx`
- `src/components/section-heading.tsx`
- `src/components/ui/*` (shadcn primitives, already added in Phase 01)
- consumes: `src/lib/checklist/data.ts`, `src/lib/checklist/schema.ts`

## Implementation Steps
1. Build `preparer-block.tsx` with three controlled-by-RHF fields.
2. Build `question-row.tsx`: props `{ question }`. Renders number + text + RadioGroup + Textarea. Uses `useFormContext()`. Applies `data-missing` styling driven by `formState.errors.answers?.[id]`.
3. Build `section-heading.tsx`: sticky, accessible heading.
4. Build `missing-banner.tsx`: takes `string[]` Q numbers, renders Alert + link list. Click → `document.getElementById('q-' + n).scrollIntoView` + focus first radio.
5. Wire `checklist-form.tsx`: `useForm`, `FormProvider`, default values from data, `onSubmit` → `submitChecklist(formData)`. On Zod fail, build missing list and trigger banner.
6. Page-level: render under `max-w-3xl mx-auto p-6`.
7. A11y pass: every RadioGroup has `<Label>` + `aria-describedby` for note; every error has `role="alert"`; first missed radio receives `tabIndex={-1}` then `.focus()`.
8. Disable COMPLETE during pending; show spinner.

## Todo list
- [ ] Preparer block
- [ ] Question row
- [ ] Section heading
- [ ] Missing banner + jump links
- [ ] Form host + RHF/Zod wiring
- [ ] Scroll-to-first-missed + focus
- [ ] Submitting state + disabled button
- [ ] Mobile pass

## Success Criteria
- All 83 Qs render in source order, correct Yes/No vs Yes/No/N/A per data flag.
- Empty form submit: banner with all 83 Q numbers, page scrolls to Q1, Q1 first radio is focused, no Server Action call.
- Partially filled (skip Q14): banner shows only "Q14", scrolls there.
- Successful submit triggers Phase 04 path.
- Lighthouse Accessibility ≥ 95 on the form page.

## Risk Assessment
- Re-render storms if anyone reaches for `watch()`/`useWatch()` carelessly. Stick to RHF's uncontrolled register; only watch on submit.
- Long pages can break sticky headers; if so, drop sticky.

## Security Considerations
- Client-side validation is UX only. Server re-validates same Zod schema (Phase 04). Never trust client.

## Next steps
Phase 04 — Server Action wiring.
