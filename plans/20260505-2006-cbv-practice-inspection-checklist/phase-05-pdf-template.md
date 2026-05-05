# Phase 05 — PDF Template

## Context links
- Plan: [plan.md](./plan.md)
- Research: [research/researcher-02-pdf-email.md](./research/researcher-02-pdf-email.md)
- Source PDF: `2026-Valuation-Practice-Standards-Checklist-EN.pdf`

## Overview
- Date: 2026-05-05
- Description: `@react-pdf/renderer` document mirroring source PDF structure. Header, preparer block, sections w/ titles, Q rows (number + text + answer + note). Page-break-safe.
- Priority: P0
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- Use Helvetica (PDF standard font) — no asset bundling, no Font.register.
- react-pdf auto-handles page breaks for `<View>` flows. Use `wrap` (default) and `break` props sparingly.
- Multi-line note text and bullet lists in q37/q57/q66/q78 wrap fine via `<Text>`.
- Output is a Buffer via `renderToBuffer(<Doc … />)`. Async.

## Requirements
- File `src/server/pdf/checklist-pdf.tsx` exports `<ChecklistPdf data={Submission} />`.
- File `src/server/pdf/render.ts` exports `renderChecklistPdf(data: Submission): Promise<Buffer>`.
- PDF structure:
  1. **Header page top:** "CBV PRACTICE INSPECTION CHECKLIST" centered bold; sub: "Completed Submission".
  2. **Preparer block:** key/value rows for Preparer's Name, Checklist Completion Date (formatted yyyy-MM-dd), Engagement Name.
  3. **Per section:** section title (bold, slightly larger), then question rows.
  4. **Per question row:** "Q{number}. {text}" wrapped; "Answer: {Yes|No|N/A}" line; if note present, "Note: {note}" wrapped block.
  5. **Footer on each page:** "Aspen Valuations — Internal" + page X of Y.
- Page size A4 or Letter (Letter — North American context).
- Margins ~50pt.

## Architecture
- Pure server module. Imports `sections` from `src/lib/checklist/data.ts` for traversal order + section names + question text (don't duplicate text into the submission).
- StyleSheet at module top.

## Related code files
- `src/server/pdf/checklist-pdf.tsx`
- `src/server/pdf/render.ts`
- `src/server/pdf/styles.ts`
- consumed by `src/server/submit-checklist.ts` (Phase 04)

## Implementation Steps
1. `pnpm add @react-pdf/renderer`.
2. Author `styles.ts` with `StyleSheet.create({ page, header, sectionTitle, questionRow, qNum, qText, answer, note, footer })`.
3. Author `checklist-pdf.tsx` traversing `sections` and looking up answers/notes by id.
4. `render.ts`: `renderToBuffer(<ChecklistPdf data={…} />)`. Wrap try/catch — re-throw with context.
5. Manual verify: write a dev-only test page that downloads a sample PDF (gated by `NODE_ENV !== 'production'`).

## Todo list
- [ ] Styles
- [ ] Document component
- [ ] renderChecklistPdf wrapper
- [ ] Footer w/ page numbers
- [ ] Dev sample-PDF route (gated)
- [ ] Visually compare to source PDF layout

## Success Criteria
- PDF renders for a fully-answered fixture in <2s warm.
- All 83 Qs present, in correct sections, in source order.
- File opens cleanly in Acrobat + Preview + Chrome built-in viewer.
- File size <500KB for typical (no notes) submission, <1MB with long notes.

## Risk Assessment
- react-pdf cold-start memory footprint occasionally OOMs Hobby (1024MB) — unlikely at this size. Mitigation: keep PDF generation synchronous-per-request, no parallel.
- Long notes may overflow narrow pages — test with 2000-char note fixture.

## Security Considerations
- No external font fetches (deterministic, offline-safe).
- Don't include any secrets in PDF metadata.

## Next steps
Phase 06 in parallel.
