# Phase 02 — Checklist Data Model + Zod

## Context links
- Plan: [plan.md](./plan.md)
- Source extract: [research/pdf-extract.txt](./research/pdf-extract.txt)

## Overview
- Date: 2026-05-05
- Description: Encode the 83 in-scope questions as a typed TS data file. Generate Zod schema dynamically from it. Single source of truth — drives form, PDF, email, validation.
- Priority: P0 (blocks Phases 03–06)
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Get the data wrong → every downstream phase pays. This phase's review must verify Q-by-Q against the PDF extract.
- Question IDs are stable: `q1` … `q86`. **`q9`, `q10`, `q11` (IVS) are deliberately omitted** — keep the numeric IDs gappy so PDF/email cross-references match the source PDF question numbers exactly. Do not renumber.
- `allowsNA` is per-Q. Verified from extract:
  - Yes/No only: q1, q2, q3, q12, q13, q14, q16, q17, q18–q29, q32–q41, q44–q51, q53–q64, q66, q69–q86.
  - Yes/No/N/A: q4, q5, q6, q7, q8, q15, q30, q31, q42, q43, q47, q52, q65, q67, q68.
  - (Reviewer must double-check this list against pdf-extract.txt during code review.)
- Sections (preserve exact PDF wording for traceability):
  - "Practice Standard 100 – Valuation Conclusions and Valuation Reports" (q1–q4)
  - "Oral Valuation Conclusions" (q5–q8)
  - "International Valuation Standards" — **EXCLUDED** (q9–q11)
  - "Levels of Valuation Conclusions" (q12–q16)
  - "Practice Standard 110 – Valuation Reports - Report Disclosure Standards" (q17–q29)
  - "Report Limitations" (q30–q31)
  - "Specific Disclosure Standards" (q32–q40)
  - "Report Scope of Review" (q41)
  - "Scope Limitations" (q42–q43)
  - "Restrictions" (q44)
  - "Conclusion" (q45)
  - "Practice Standard 120 – Valuation Reports – Scope of Work Standards" (q46–q69)
  - "Practice Standard 130 – Valuation Reports – File Documentation Standards" (q70–q86)

## Requirements
- One file `src/lib/checklist/data.ts` exporting typed `sections: ChecklistSection[]`.
- Each `ChecklistQuestion` carries: `id` (`q12`), `number` (12), `text` (verbatim from PDF, multi-line preserved), `allowsNA: boolean`, optional `bullets: string[]` for q37/q38/q57/q66/q78 examples, optional `subItems` for q17/q44 (a/b/c/d).
- IVS exclusion documented in code comment block at top of file with the Q-numbers and rationale (per user requirement).
- `src/lib/checklist/schema.ts` derives `submissionSchema` from `sections` programmatically. Output type: `Submission`.
- `src/lib/engagement.ts` exports `slugifyEngagement(name: string): string` — lowercases, strips/replaces non-alphanum with `-`, collapses `--`, trims edge `-`, max 80 chars. Used by PDF filename + email subject + email body interpolation.
- Pure functions, zero deps beyond zod. Importable from server and client.

## Architecture
- `data.ts` is a const literal with `as const` typing for full type-narrowing of `id` literal union.
- `schema.ts` reduces `sections.flatMap(s => s.questions)` to a `z.object({ answers: z.object({ [id]: z.object({ value: enum, note: optional string }) }) })`.
- Preparer block: `z.object({ name, completionDate (z.coerce.date()), engagementName, recipientEmail })` with non-empty + length caps (name ≤ 200, engagement ≤ 200) and `recipientEmail = z.string().email().max(254)`.
- Default recipient email exposed as `DEFAULT_RECIPIENT_EMAIL = 'connect@aspenval.com'` constant in `src/lib/engagement.ts` (or co-located). UI seeds the form field from this; user can edit before submit.

## Related code files
- `src/lib/checklist/data.ts`
- `src/lib/checklist/schema.ts`
- `src/lib/checklist/types.ts`
- `src/lib/engagement.ts`
- `src/lib/checklist/__tests__/data.test.ts` (vitest, optional but recommended)

## Implementation Steps
1. Create `types.ts` with `ChecklistAnswer`, `ChecklistQuestion`, `ChecklistSection`, `Submission`.
2. Author `data.ts`. Copy verbatim text from `pdf-extract.txt`. Verify count = 83 (assertion at module load: `if (allQuestions.length !== 83) throw`).
3. Author `schema.ts`. Generator function: per Q, produce `z.object({ value: question.allowsNA ? z.enum(['yes','no','na']) : z.enum(['yes','no']), note: z.string().max(5000).optional() })`. Wrap in `answers` and combine with preparer.
4. `engagement.ts`: implement + add unit test cases (`"Acme Corp - 2026 Q1"` → `"acme-corp-2026-q1"`, empty → throws, unicode → strips, very long truncates to 80).
5. Cross-check `allowsNA` against extract by writing a small data-integrity test that lists each id + allowsNA — manual review pass.
6. Add `getMissingQuestionIds(sub: Partial<Submission>): string[]` helper for Phase 03 use.

## Todo list
- [ ] types.ts
- [ ] data.ts (verbatim Q text + section names)
- [ ] count + allowsNA assertions
- [ ] schema.ts (zod generator)
- [ ] engagement.ts + slug tests
- [ ] getMissingQuestionIds helper

## Success Criteria
- Module load asserts 83 questions, 13 sections (12 + IVS skipped).
- Zod schema accepts a fully-answered fixture; rejects missing answer; rejects `na` on a Yes/No-only question.
- `slugifyEngagement` test cases pass.

## Risk Assessment
- **Highest risk in plan: data entry errors.** A wrong `allowsNA` flag silently passes wrong shape downstream. Mitigation: code-review pass with PDF side-by-side; integrity test enumerates each.
- Verbatim text long → keep as template-literal strings, lint-allow long lines in this file only.

## Security Considerations
- No PII in this file. Pure config.

## Next steps
Phase 03 — UI consuming this data.
