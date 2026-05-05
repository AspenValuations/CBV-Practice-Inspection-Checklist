# Phase 08 — Polish & QA

## Context links
- Plan: [plan.md](./plan.md)

## Overview
- Date: 2026-05-05
- Description: Manual test matrix, README, Lighthouse pass, final cleanup.
- Priority: P1
- Implementation status: Not started
- Review status: Not reviewed

## Key Insights
- No automated test suite specified; rely on focused manual matrix + a minimal vitest run for the data/schema/slug helpers.
- Internal tool: Lighthouse perf less critical, but a11y must pass clean.

## Requirements
- README covers: stack, run dev, env vars, deploy, auth tier choice, DNS task, manual test plan, future upgrade path.
- Manual test matrix executed and signed off:
  1. Empty form → COMPLETE → banner lists all 83 Qs, scrolls to Q1, focuses first radio.
  2. Skip Q14, Q42 only → banner lists Q14 + Q42; click "Q42" → scrolls/focuses.
  3. All Yes → COMPLETE → success state; verify email body branch = "all-yes"; verify PDF.
  4. Mixed Yes/No (e.g., Q12 No, Q50 No, Q70 No) → email body branch = "has-no" with sectioned list; verify PDF shows "Answer: No" rows.
  4b. **Recipient override** — change recipient to a tester address before submit → verify only that address receives the email; default `connect@aspenval.com` does NOT.
  5. Long-note edge: 2000-char note on Q18 + Q66 → PDF wraps cleanly across pages.
  6. Mobile (375px viewport): every Q row legible, RadioGroup tappable, no horizontal scroll.
  7. Auth: unauth visit returns 401/auth wall.
  8. Idempotency: spam COMPLETE 3× quickly → single email arrives.
  9. Resend down (simulate by bad API key) → user sees error alert; no double email on retry.
- Lighthouse: A11y ≥ 95, Best Practices ≥ 95.
- Vitest: unit tests for `slugifyEngagement`, `submissionSchema` happy/sad paths, `getMissingQuestionIds`, `data.ts` integrity assertion.

## Architecture
N/A — quality gate only.

## Related code files
- `README.md`
- `src/lib/checklist/__tests__/*.test.ts`
- `src/lib/__tests__/engagement.test.ts`

## Implementation Steps
1. Write README.
2. Add minimal vitest config + 3–4 test files.
3. Execute manual matrix; log results in a `QA-LOG.md` (if user wants persistent record) or comment in the relevant PR.
4. Run Lighthouse on prod URL.
5. Address any P0/P1 findings.

## Todo list
- [ ] README
- [ ] Vitest config + tests
- [ ] Manual matrix executed
- [ ] Lighthouse pass
- [ ] Findings remediated

## Success Criteria
- Matrix all green.
- Lighthouse a11y ≥ 95.
- Tests green in CI/local.

## Risk Assessment
- Some failures will surface in Phase 02 (data) or Phase 03 (UX) and require small loop-backs. Budget half a day for that.

## Security Considerations
- README must NOT include real env values. Use placeholders.

## Next steps
Ship. Future work tracked in plan.md "Future / Deferred" section.
