# Code Audit — Nodemailer Migration

**Ngày:** 2026-05-10
**Người review:** Self-audit (sau khi implement xong)
**Branch:** `feat/nodemailer-gmail-smtp`
**Commit trong scope:** `5a20d8d` (migration) + `32c296c` (tests + dedupe fix + a11y)
**Trạng thái validation tại thời điểm audit:** type-check ✅, lint ✅ (0 warning), test ✅ 93/93, build ✅

## Phương pháp
Đọc thủ công từng dòng mọi file bị 2 commit chạm vào, cộng với toàn bộ caller liên đới (`submit-checklist.ts`, form components, middleware). Tests được dùng làm spec hành vi nhưng **không** được tin để chứng minh đúng — test xanh chỉ chứng minh "các case tôi nghĩ ra đều pass".

## Mức độ nghiêm trọng
- **Cao** — sai output, mất data, lỗ hổng bảo mật, hoặc fail build/runtime trên path thực tế.
- **Trung bình** — sai output ở edge case, blocker khi deploy.
- **Thấp** — UX glitch, defensive-only, hoặc test gotcha.
- **Cosmetic** — style/comment, không ảnh hưởng chức năng.

---

## Phát hiện

### #1 — `canonicalize()` mất key có value `undefined`
**Mức:** Thấp (correctness bug, ít xảy ra trong thực tế)
**File:** `src/server/dedupe.ts:14-19`

`for (const k of Object.keys(obj).sort())` enumerate cả key có value `undefined`; `canonicalize(undefined)` trả về `undefined`; `JSON.stringify` sau đó **bỏ qua** key đó (đây là quy tắc JSON chuẩn). Hậu quả: payload có `note: undefined` hash giống hệt payload không khai báo `note`.

Tác động thực tế trong app này:
- Schema form đặt `note` là optional. RHF default values set `note: ""` (chuỗi rỗng, không phải undefined) — xem `checklist-form.tsx:31`. Chuỗi rỗng ≠ undefined, nên hash khác nhau. **Path từ form hiện tại an toàn.**
- Smoke fixtures gọi `defaultValueFor()` trả về `{ value }` **không có key `note`** nào cả. Shape khác với path từ form → đã có khả năng 2 hash khác nhau cho cùng "submission". Không phá dedupe (fixtures khác nhau nên hash khác là đúng), nhưng cần biết.
- Caller tương lai pass object xây dở với field `undefined` sẽ bị silent-dedupe.

**Repro test:**
```ts
hashPayload({ a: 1, note: undefined }) === hashPayload({ a: 1 })  // true
```

**Fix đề xuất:** trong `canonicalize()`, skip key nếu giá trị recurse ra là `undefined`:
```ts
for (const k of Object.keys(obj).sort()) {
  const v = canonicalize(obj[k]);
  if (v !== undefined) out[k] = v;
}
```
Thêm regression test trong `dedupe.test.ts` cover case `{ a: 1, b: undefined }` vs `{ a: 1 }` (test suite hiện tại CHƯA cover).

---

### #2 — `(dev)/preview-email` import từ `scripts/` (ngoài `src/`)
**Mức:** Trung bình (rủi ro deploy-time trên Vercel)
**File:** `src/app/(dev)/preview-email/page.tsx:5-8`

```ts
import { buildSubmission, type FixtureName } from "../../../../scripts/fixtures/submissions";
```

`pnpm build` local thành công. Nhưng:
- Phạm vi **file-tracing** mặc định của Next.js + Vercel là `src/` + `node_modules/`. File ngoài phạm vi này có thể bị loại khỏi function bundle khi deploy.
- Guard `if (NODE_ENV === "production") notFound()` chạy ở **request** time. Static import resolve ở **build/bundle** time — guard không ngăn được việc bundle.
- Nếu tracer của Vercel drop `scripts/fixtures/submissions.ts`, bundle của route sẽ thiếu. Hoặc build fail, hoặc function crash ngay cold start (trước khi tới `notFound()` guard).

Không thể xác nhận nếu chưa thử deploy Vercel — nhưng đây là pattern đã biết là dễ vỡ.

**Fix đề xuất:** chuyển `scripts/fixtures/submissions.ts` vào `src/lib/fixtures/submissions.ts`, cập nhật 2 importer (`scripts/smoke-send.ts`, dev page). Tests dưới `scripts/fixtures/__tests__/` chuyển theo.

Phương án thay thế nếu muốn giữ fixtures cùng chỗ với smoke script: trong dev preview page, định nghĩa lại 2 fixtures inline (5–10 dòng duplication, loại bỏ cross-boundary import).

---

### #3 — `canonicalize()` infinite recursion với input có cycle
**Mức:** Thấp (defensive only — caller hiện tại không thể tạo cycle)
**File:** `src/server/dedupe.ts:10-20`

`canonicalize(value)` không detect cycle. Object có self-reference (`a.self = a`) sẽ recurse cho tới stack overflow.

Tác động thực tế: **không có hôm nay**. Caller duy nhất là `submit-checklist.ts:36` truyền `data` đã được Zod validate — Zod sinh ra output dạng cây. Không có path nào tạo được cycle.

**Khuyến nghị:** giữ nguyên. Thêm cycle detection (`WeakSet` của ref đã thấy) là defensive code premature theo nguyên tắc KISS của project. Document assumption trong code comment nếu function này có caller thứ 2.

---

### #4 — Smoke script crash với error khó hiểu khi `.env.local` thiếu var bắt buộc
**Mức:** Thấp (UX, dev-only)
**File:** `scripts/smoke-send.ts:1-9`

`import { sendChecklistEmail, verifyTransport } from "@/server/mailer"` ở top-level kích hoạt `env.ts` → `parseEnv()` chạy ngay tại import time. Nếu thiếu `SMTP_USER`/`SMTP_PASS`, script chết với `Error: Missing required environment variables: ...` **trước khi** `usage()` kịp chạy, nên dev không thấy được help text.

Tác động thực tế: trải nghiệm first-run lúng túng cho người vừa clone repo và quên đổ `.env.local`. Tự khắc phục được khi đọc error.

**Khuyến nghị:** giữ nguyên. Error message đã nêu rõ var thiếu. Thêm lazy-import dance để fix cái này tốn nhiều code hơn giá trị mang lại.

---

### #5 — Test isolation phụ thuộc engagement-name unique, không reset dedupe rõ ràng
**Mức:** Thấp (rủi ro maintain test)
**File:** `src/server/__tests__/submit-checklist.test.ts`

Tests dùng ``engagementName: `Happy ${Date.now()}` `` để tránh va chạm với module-level Map `seen` trong `dedupe.ts`. Hoạt động được vì `Date.now()` khác nhau mỗi test, nhưng **giả định ngầm**. Dev tương lai copy test mà quên `Date.now()` engagement name sẽ gặp flaky failure khi test của họ chạy sau test khác có cùng tên.

`dedupe.ts` giờ đã export `_resetDedupe()` (thêm trong commit `32c296c`) — submit-checklist tests nên dùng nó trong `beforeEach` nhưng hiện chưa.

**Fix đề xuất:** thêm `import { _resetDedupe } from "../dedupe"` và `beforeEach(() => _resetDedupe())` trong `submit-checklist.test.ts`. Sau đó có thể bỏ suffix `Date.now()` trong engagement name.

---

### #6 — `scripts/fixtures/submissions.ts` logic chọn 5-No có nhánh "fallback" chết
**Mức:** Cosmetic
**File:** `scripts/fixtures/submissions.ts:50-70`

Dòng 50-58 iterate `sections.slice(3)` để thêm 2 "no" answers nữa. Với data hiện tại (12 sections, ≥1 question mỗi cái), nhánh này luôn tìm được 2 candidate và `targets.length` đạt 5. Fallback ở dòng 59-70 không bao giờ chạy.

Nếu sections rút xuống còn 3, fallback sẽ kick in. Không phải bug — chỉ là code hiện không có execution path nào verify.

**Khuyến nghị:** giữ nguyên. Bỏ fallback chỉ tiết kiệm vài dòng nhưng comment ("ít nhất 3 sections") là contract; nếu data shrink thì vẫn cần honour.

---

### #7 — `mailer.ts` lazy-singleton có thể leak giữa Vitest tests nếu quên `vi.resetModules()`
**Mức:** Thấp (test gotcha)
**File:** `src/server/mailer.ts:6`

`let _transporter: Transporter | null = null` là module-level. Mặc định Vitest cache module qua các test cùng file. `mailer.test.ts` hiện tại dùng `vi.resetModules()` trong `beforeEach` để force re-import — nhưng đây là kiến thức ngầm.

**Khuyến nghị:** giữ nguyên. Document gotcha trong code comment có thể giúp test author tương lai nhưng không bắt buộc.

---

### #8 — `checklist-form.tsx:111` non-null assertion trên `missing[0]`
**Mức:** Cosmetic
**File:** `src/components/checklist-form.tsx:110-111`

```ts
if (missing.length > 0) {
  const firstNum = parseInt(missing[0]!.replace("q", ""), 10);
```

Cần `!` vì `noUncheckedIndexedAccess: true` trong tsconfig làm `missing[0]` có type `string | undefined`. Hành vi đúng (length check đảm bảo có giá trị). Lựa chọn style giữa `!`, `?? ""`, hoặc destructuring với default.

**Khuyến nghị:** giữ nguyên.

---

## Các mục đã audit và xác nhận đúng

Đã được kiểm tra kỹ và thấy ổn. Liệt kê để re-audit tương lai không phải làm lại.

| File | Đã check | Kết luận |
|---|---|---|
| `src/server/mailer.ts` | Thứ tự ưu tiên `resolveSecure()` (env override > port-default), branching pool/no-pool, pin TLS minVersion, giá trị timeout | ✅ Đúng |
| `src/server/env.ts` | `envBool` preprocess cover mọi chuỗi truthy/falsy mong đợi, port coercion từ chối số âm/zero/non-numeric, email validation cho `SMTP_USER` | ✅ Đúng |
| `src/server/submit-checklist.ts` | Thứ tự thao tác (validate → dedupe → derive → PDF → render → send), error propagation, log SMTP error đã sanitise (không có `auth`, không có `stack`, không có password) | ✅ Đúng |
| `src/server/email/render.ts` | `buildEmailSubject` khớp spec verbatim (hyphen-space), `buildNoAnswersList` giữ thứ tự section + question, react-email tự escape interpolation | ✅ Đúng |
| `src/middleware.ts` | Basic Auth với timing-safe compare, fail-closed khi env thiếu | ✅ Đúng (có sẵn từ trước) |
| `src/components/checklist-form.tsx` | Cách dùng prop React 19 `inert`, flow scroll-and-focus tới câu hỏi bị thiếu | ✅ Đúng |
| `src/server/__tests__/*.test.ts` | Coverage error branch, security assertion (không leak password, không XSS), edge cases | ✅ Toàn diện (kèm caveat #5) |

---

## Tổng kết

**3 phát hiện cần hành động:**
- **#1** — Fix xử lý `undefined`-key trong `canonicalize()`. Thêm regression test. (~5 dòng + 1 test.)
- **#2** — Chuyển `scripts/fixtures/submissions.ts` vào `src/` để bỏ cross-boundary import trong `(dev)/preview-email/page.tsx`. (~3 file move + 2 import path update.)
- **#5** — Dùng `_resetDedupe()` trong `submit-checklist.test.ts beforeEach` thay vì engagement name có `Date.now()`. (~2 dòng.)

**5 informational:** #3, #4, #6, #7, #8 — khuyến nghị giữ nguyên theo YAGNI/KISS.

**Đánh giá tổng:** migration đã hoạt động đúng chức năng. Không có vấn đề nghiêm trọng. 2 phát hiện đáng act (#1 và #2) đều nhỏ và tách biệt; cộng lại <30 dòng code thay đổi.

## Câu hỏi mở
- Có nên giữ route `(dev)/preview-email` không? Đã được gate bằng `NODE_ENV !== "production"` và làm trùng việc với smoke script. Bỏ nó cũng giải quyết luôn finding #2 với chi phí 0.
- Branch này chưa deploy lên Vercel — finding #2 là giả thuyết, không phải failure đã xác nhận. Một throwaway preview deploy sẽ giải quyết được.
