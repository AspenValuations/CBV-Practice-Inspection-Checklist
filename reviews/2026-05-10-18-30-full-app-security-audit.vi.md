# Audit Bảo mật & Bug Toàn Ứng dụng

**Ngày:** 2026-05-10 18:30
**Người review:** Self-audit (đọc từng dòng)
**Branch:** `feat/nodemailer-gmail-smtp` @ `9cf6b92`
**Phạm vi:** Toàn bộ `src/`, `scripts/`, `next.config.ts`, `package.json`, `.env.example`, `.gitignore`, `middleware.ts`, kèm `pnpm audit` cho CVE transitive.
**Validation tại thời điểm audit:** `pnpm type-check` ✅, `pnpm lint` ✅ (0 warning), `pnpm test` ✅ 93/93, `pnpm build` ✅, `pnpm audit` → 2 moderate.
**Thay thế:** `2026-05-10-17-00-nodemailer-migration-audit.md` (đã được gộp; finding migration nằm trong §3 và §6 dưới).

## Phương pháp
Đọc kiểu pentest mọi production code path. Mỗi finding gồm: **file:line**, **mức độ** (kèm reasoning kiểu CVSS khi áp dụng được), **khả năng khai thác thực tế** (không phải lý thuyết), **cách reproduce**, **fix**. Tests được dùng làm spec hành vi, không phải bằng chứng đúng — test xanh chỉ chứng minh "các case tôi nghĩ ra đều pass". Threat model: app deploy public internet, gate duy nhất bằng HTTP Basic Auth, gửi email qua Gmail SMTP từ 1 Workspace mailbox.

## Mức độ nghiêm trọng
- **Critical** — RCE, bypass auth, exfil data hàng loạt, đánh cắp secret.
- **High** — sai output / mất data / leo thang quyền / DoS trên path thực tế.
- **Medium** — sai output ở edge case, blocker khi deploy, XSS niche path khai thác được, CVE đã biết trên dep đang dùng tích cực.
- **Low** — defensive-only, bug khó xảy ra nhưng có thể, UX glitch liên quan nhẹ tới security.
- **Cosmetic** — style/comment, không ảnh hưởng chức năng hay bảo mật.

---

## §1 — Authentication & Middleware

### #1.1 — Basic Auth credentials so byte-by-byte; side-channel timing user-enum qua 401
**Mức:** Low
**File:** `src/middleware.ts:1-79`

`timingSafeEqual()` đúng (constant-time qua `max(a.length, b.length)`). Fail-closed khi env unset (line 26-31) đúng. Header WWW-Authenticate trên mọi 401 đúng.

Nhưng: khi **header Authorization vắng**, function trả 401 ngay không thực hiện so sánh (line 36-41). Khi credentials CÓ truyền nhưng sai, có chạy compare. Net effect: attacker phân biệt được "không gửi creds" (~0ms) với "creds sai" (~thời gian compare constant). Không khai thác được để đánh cắp credentials, nhưng signal timing có thể quan sát.

**Khai thác thực tế:** ~0. Signal chỉ tiết lộ "server có check password" — đã hiển nhiên qua 401 + `WWW-Authenticate`.

**Khuyến nghị:** giữ nguyên. Thêm dummy compare ở no-header path là defensive code không đáng.

### #1.2 — Không rate limit Basic Auth attempt
**Mức:** Medium (tùy threat model)
**File:** `src/middleware.ts` (toàn file)

Middleware chấp nhận unlimited 401 retry từ mọi IP. Với 16 char entropy trên `BASIC_AUTH_PASS`, brute-force online single-attempt không thực tế, nhưng botnet có thể enumerate password yếu hoặc leak đã biết.

**Khai thác thực tế:** phụ thuộc entropy của `BASIC_AUTH_PASS`. README example dùng `changeme` literal — attacker giỏi crack trong microseconds.

**Khuyến nghị:**
1. Đổi `.env.example` sang placeholder 32 char ngẫu nhiên (không dùng từ gợi ý `changeme`) và thêm note README: "dùng `openssl rand -base64 32`".
2. (Optional) Thêm rate limit qua Vercel Firewall rules hoặc token bucket level middleware key bằng IP + path. Ngoài scope v1 theo decisions log, nhưng threat tồn tại.

### #1.3 — Basic Auth gửi credentials cleartext qua HTTP
**Mức:** Critical nếu serve qua HTTP, N/A trên Vercel HTTPS
**File:** `src/middleware.ts` (phụ thuộc transport)

Basic Auth là base64, không mã hoá. Trên Vercel platform force HTTPS — không lộ. Trên VPS tự host không terminate TLS, credentials đọc được trên dây.

**Khai thác thực tế:** 0 trên Vercel; cao trên self-host cấu hình sai.

**Khuyến nghị:** thêm 1 dòng note vào section deploy của README: "Basic Auth giả định HTTPS — không bao giờ deploy app sau plain HTTP."

### #1.4 — Matcher middleware không exclude `/api/*` (chưa có hôm nay, nhưng risk tương lai)
**Mức:** Cosmetic giờ, Low sau
**File:** `src/middleware.ts:75-79`

Matcher `"/((?!_next/static|_next/image|favicon.ico).*)"` cover mọi thứ khác, gồm cả `/api/*` route tương lai cho webhook hay health check. Hiện không có API route nào. Nếu sau này ai đó thêm `/api/health` cho uptime monitor, sẽ bị Basic Auth lock và monitor fail mysteriously.

**Khuyến nghị:** giữ nguyên cho tới khi thêm API route đầu tiên; document gotcha lúc đó.

---

## §2 — Server-Side Logic & Server Actions

### #2.1 — Server Action không có rate limit; PDF + SMTP send tốn CPU
**Mức:** Medium
**File:** `src/server/submit-checklist.ts:14`, `src/app/page.tsx:4` (`maxDuration = 30`)

`submitChecklist` chạy mỗi lần submit form. PDF gen qua `@react-pdf/renderer` CPU-bound (1-4s warm); SMTP handshake thêm 1-2s. Dedupe map (`src/server/dedupe.ts:3-5`, `MAX_SIZE=64`, `TTL_MS=60_000`) chỉ block payload **trùng tuyệt đối** — attacker chỉ cần đổi nhẹ 1 field (vd iterate `note`) là bypass được.

Một authenticated user (Basic Auth credentials chia sẻ nội bộ) có thể trigger unlimited submit, mỗi submit tốn 1-30s function time và 1 Gmail send. 2 hậu quả:
1. Vercel function billing tăng.
2. **Gmail outbound limit** cháy: Workspace 2,000 recipients/day; Gmail consumer 500/day. Insider quyết tâm có thể vắt cạn trong vài phút bằng cách đổi engagement name, lock workflow hợp pháp tới nửa đêm Pacific.

**Khai thác thực tế:** cần Basic Auth credential. Insider threat. Cost thật: Gmail lockout có thể ảnh hưởng workflow hợp pháp.

**Khuyến nghị:**
1. Document trong README: "Gmail sender share quota daily với mailbox; abuse drain hết."
2. (Optional) Thêm counter submit per-IP/per-recipient qua in-memory map giống `dedupe.ts` — vd max 10 submit per IP per hour. Pattern module-level state hoạt động trên Vercel cho window ngắn.

### #2.2 — Recipient email do form điều khiển; người có Basic Auth có thể spam mọi địa chỉ
**Mức:** Medium
**File:** `src/lib/checklist/schema.ts:10`, `src/server/submit-checklist.ts:80`

`recipientEmail` editable trong form (chỉ validate syntax email, max 254 char). Attacker có Basic Auth có thể submit checklist trông thật tới mọi địa chỉ external — recipient nhận PDF Gmail-stamped "from" Aspen Valuations. 3 risk:
1. **Phishing/impersonation** — recipient thấy email Aspen hợp pháp với PDF, có thể act on nó.
2. **Sender reputation damage** — Gmail flag sender nếu recipient mark spam.
3. **Lộ data confidential** — preparer có thể chủ động email checklist forge/embarrassing tới journalist, đối thủ, vv.

**Khai thác thực tế:** medium. Insider threat thật, đặc biệt khi Basic Auth password chia sẻ rộng.

**Khuyến nghị:**
1. Thêm env `EMAIL_RECIPIENT_ALLOWLIST` (domain hoặc address phân tách dấu phẩy). Validate `recipientEmail` trong Server Action — miss → return validation error, không send.
2. Hoặc: lock recipient cố định 1 address (`connect@aspenval.com`) và bỏ form field. Plan gốc giữ editable; có thể xét lại.
3. Tối thiểu: document trust boundary trong section deploy README.

### #2.3 — `canonicalize()` mất key có value `undefined`
**Mức:** Low
**File:** `src/server/dedupe.ts:14-19`

Carry từ migration audit. `for (const k of Object.keys(obj).sort())` enumerate cả key có value `undefined`; `canonicalize(undefined)` trả về `undefined`; `JSON.stringify` sau đó **omit** key đó (quy tắc JSON chuẩn). Net effect: `{ a: 1, note: undefined }` hash giống `{ a: 1 }`.

Hôm nay path từ form set `note: ""` (chuỗi rỗng ≠ undefined) nên dedupe an toàn. Caller tương lai set explicit `note: undefined` sẽ silent dedupe.

**Repro:**
```ts
hashPayload({ a: 1, note: undefined }) === hashPayload({ a: 1 })  // true
```

**Khuyến nghị:**
```ts
for (const k of Object.keys(obj).sort()) {
  const v = canonicalize(obj[k]);
  if (v !== undefined) out[k] = v;
}
```
Thêm regression test (`dedupe.test.ts` hiện tại chưa cover).

### #2.4 — `canonicalize()` không detect cycle — stack overflow với input cyclic
**Mức:** Low (defensive only)
**File:** `src/server/dedupe.ts:10-20`

Object có self-reference (`a.self = a`) gây infinite recursion. Hôm nay caller duy nhất là `submit-checklist.ts:36` truyền data Zod-validated dạng cây — không có path tạo cycle.

**Khuyến nghị:** giữ nguyên, document assumption trong code comment.

### #2.5 — Dedupe map là module-level state — share giữa **mọi user** trên Vercel function warm
**Mức:** Low (informational)
**File:** `src/server/dedupe.ts:3`

`const seen = new Map<string, number>()` sống trong module closure. Trên Vercel, nhiều user concurrent hit cùng warm function instance và **share** map này. Cap `MAX_SIZE = 64` nghĩa là 1 user submit 64 checklist unique sẽ bắt đầu evict entry của user khác — phá dedupe của họ.

Tác động thực tế: với volume thấp internal-only hiện tại, không liên quan. Volume cao hơn, dedupe trở nên không tin được.

**Khuyến nghị:** giữ nguyên cho v1. Plan path tới dedupe persistent thật (DB row với unique key) khi volume yêu cầu.

### #2.6 — Field log error Server Action gần PII
**Mức:** Low
**File:** `src/server/submit-checklist.ts:93-99`

SMTP error logger log `responseCode` và `response` từ Nodemailer. SMTP `response` thường echo địa chỉ recipient ("550 5.1.1 <foo@bar.com>: recipient rejected"). Recipient là user-supplied form data, nhưng log server-side persist trong Vercel function logs (retention tùy plan). Kết hợp engagement name + timestamp, attacker có log access có thể build audit trail.

**Khai thác thực tế:** cần access Vercel project logs (RBAC team-level).

**Khuyến nghị:** chấp nhận được cho internal tool. Nếu log ever export off-platform (vd ship sang SIEM external), redact `response` trước egress.

### #2.7 — `submit-checklist.ts:74` trả "Failed to compose email" khi render error, nhưng `renderChecklistEmail` không có failure mode thực tế
**Mức:** Cosmetic
**File:** `src/server/submit-checklist.ts:62-75`

Try/catch quanh `renderChecklistEmail` là defensive — `render()` của react-email không throw với React tree hợp lệ. Branch effectively unreachable. Không hại, nhưng dead error-handling.

**Khuyến nghị:** giữ nguyên.

---

## §3 — Email Transport (Nodemailer + Gmail SMTP)

Findings carry/refine từ migration audit trước.

### #3.1 — `(dev)/preview-email` import từ `scripts/` (ngoài `src/`) — risk Vercel file-tracing
**Mức:** Medium
**File:** `src/app/(dev)/preview-email/page.tsx:5-8`

```ts
import { buildSubmission, type FixtureName } from "../../../../scripts/fixtures/submissions";
```

`pnpm build` local thành công. Nhưng phạm vi file-tracing mặc định Next.js + Vercel là `src/` + `node_modules/`. File ngoài phạm vi đó có thể bị loại khỏi function bundle khi deploy. Guard `if (NODE_ENV === "production") notFound()` chạy ở request time; static import resolve ở build/bundle time — guard KHÔNG ngăn được bundle.

Nếu tracer Vercel drop `scripts/fixtures/submissions.ts`, bundle route thiếu. Hoặc build fail hoặc function crash cold start (trước khi tới guard). Không thể xác nhận nếu chưa deploy Vercel.

**Khuyến nghị:** chuyển `scripts/fixtures/submissions.ts` → `src/lib/fixtures/submissions.ts`; cập nhật cả 2 importer (`scripts/smoke-send.ts`, dev page); chuyển test dưới `scripts/fixtures/__tests__/` theo. ~3 file move + 2 import path edit.

Phương án thay thế: xoá hẳn route `(dev)/preview-email` vì duplicate `pnpm smoke:email`.

### #3.2 — `mailer.ts` lazy singleton có thể leak giữa Vitest tests nếu quên `vi.resetModules()`
**Mức:** Low (test gotcha)
**File:** `src/server/mailer.ts:6`

Module-level `_transporter` persist qua các test cùng file. `mailer.test.ts` hiện tại dùng `vi.resetModules()` trong `beforeEach`. Test file mới cần lặp lại dance này.

**Khuyến nghị:** giữ nguyên. Optional: thêm code comment giải thích pattern.

### #3.3 — Smoke script crash với error khó hiểu khi `.env.local` thiếu var bắt buộc
**Mức:** Low (UX, dev-only)
**File:** `scripts/smoke-send.ts:1-9`

Top-level mailer import → env.ts `parseEnv()` → throw trước khi usage() kịp print help. Dev mới thấy `Error: Missing required environment variables` thay vì usage script.

**Khuyến nghị:** giữ nguyên. Error message đã nêu var thiếu.

### #3.4 — `EMAIL_FROM` không validate syntax RFC-5322
**Mức:** Low
**File:** `src/server/env.ts:20`

`EMAIL_FROM: z.string().min(1).optional()` chấp nhận mọi chuỗi non-empty. Value malformed (vd `inspections at aspenval`) sẽ pass cho Nodemailer — hoặc silently rewrite hoặc reject send với `EENVELOPE`.

**Khai thác thực tế:** không — đây là tự bắn chân operator, không phải attacker.

**Khuyến nghị:** giữ nguyên. README đã document format mong đợi; misconfiguration surface ngay attempt send đầu tiên.

### #3.5 — Recipient address không normalize trước khi dùng
**Mức:** Cosmetic
**File:** `src/server/submit-checklist.ts:80`

`data.preparer.recipientEmail` chảy thẳng vào Nodemailer. Whitespace cuối hoặc khác case (`Foo@Bar.COM` vs `foo@bar.com`) hash khác nhau trong dedupe — xem implication §2.5.

**Khuyến nghị:** lowercase + trim trước khi hash VÀ send. ~1 dòng trong `submit-checklist.ts`.

### #3.6 — Không có header List-Unsubscribe / unsubscribe
**Mức:** Cosmetic (email không marketing)
**File:** `src/server/mailer.ts` (`sendChecklistEmail`)

Thuần transactional email tới 1 internal address. CAN-SPAM / Gmail bulk sender requirement không apply ở volume này. Thêm `List-Unsubscribe` cho transactional mail có thể trigger Gmail mark sender là bulk.

**Khuyến nghị:** giữ nguyên. Xét lại chỉ khi recipient list mở rộng ngoài team nội bộ.

---

## §4 — Frontend / Client-Side

### #4.1 — Schema Zod chấp nhận date không bound trên/dưới
**Mức:** Low
**File:** `src/lib/checklist/schema.ts:6-7`

`completionDate: z.coerce.date()` chấp nhận mọi Date hợp lệ — năm 1, năm 9999, NaN-via-coercion-failure. Component `<DatePicker>` của form constrain visual về range hợp lý, nhưng client-side validation có thể bypass bằng replay POST Server Action crafted.

**Khai thác thực tế:** rất thấp (cosmetic — chỉ tạo PDF/email nonsensical với date "1066-10-14"). Không phải security issue.

**Khuyến nghị:** thêm `.refine()` constraint:
```ts
completionDate: z.coerce.date()
  .refine(d => d >= new Date('2000-01-01') && d <= new Date(), 'Date out of range'),
```

### #4.2 — `engagementName` (200 char) dùng làm filename PDF + email subject + slug — không sanitize filename-injection
**Mức:** Low
**File:** `src/server/submit-checklist.ts:43-47`, `src/lib/engagement.ts:3-10`

`slugifyEngagement()` well-formed: lowercase, replace non-alphanumeric runs bằng `-`, trim hyphen, slice 80 char. Output là slug ASCII sạch, an toàn cho filename. Email subject dùng raw `engagementName` (theo spec) — react-email render dạng text, không HTML interpret. Đã test trong `render.test.ts`.

PDF filename là `cbv-checklist-${engagementSlug}-${dateStr}.pdf` — slug guarantee không có `..`, không `/`, không quote. Nodemailer chấp nhận `attachments[].filename` string và xử lý MIME header escape tự.

**Khuyến nghị:** không — path này đúng. List để reference tương lai: KHÔNG bypass `slugifyEngagement()` nếu derive filename khác từ user input.

### #4.3 — XSS surface trong form: zero
**Mức:** N/A (đã verify safe)
**File:** toàn `src/components/`

Không có raw-HTML injection sink. Mọi user text render qua React text node (auto-escape). Đã test escape engagement name trong `render.test.ts`.

### #4.4 — Không có CSRF protection trên Server Actions
**Mức:** Low (Next.js handle)
**File:** Default framework Next.js

Server Actions Next.js 15 có built-in CSRF protection qua check header `Origin` + signed action ID. Confirm bằng đọc Next docs (không re-verify ở audit này). Kết hợp Basic Auth gate toàn app, surface CSRF essentially closed.

**Khuyến nghị:** không.

### #4.5 — `MissingBanner.scrollToQuestion` access `document` không SSR guard
**Mức:** N/A (client component)
**File:** `src/components/missing-banner.tsx:14-21`

Component là `"use client"` — `document` luôn defined khi code này chạy.

**Khuyến nghị:** không.

### #4.6 — `parseInt(missing[0]!.replace("q", ""), 10)` non-null assertion
**Mức:** Cosmetic
**File:** `src/components/checklist-form.tsx:111`, `src/components/missing-banner.tsx:11`

`missing[0]!` sau `if (missing.length > 0)` đúng; `noUncheckedIndexedAccess: true` trong tsconfig force assertion. Cùng pattern trong `missing-banner.tsx:idToNumber` (không cần assertion vì destructure từ map).

**Khuyến nghị:** giữ nguyên.

### #4.7 — `successEngagement` hiển thị verbatim ở success screen — XSS check
**Mức:** N/A (đã verify safe)
**File:** `src/components/checklist-form.tsx:131`

```tsx
The completed CBV Practice Inspection Checklist for{" "}
<strong>{successEngagement}</strong> has been emailed successfully.
```

React text node — auto-escape. Không khai thác được.

### #4.8 — ID generation `aria-labelledby` có thể collide với section share 20 char đầu
**Mức:** Low (a11y)
**File:** `src/components/checklist-form.tsx:193, 199`

`section-${section.title.slice(0, 20).replace(/\s/g, "-")}`. Với 12 section hiện tại, không section nào share 20 char đầu (verify với `data.ts`). Nếu tương lai thêm section tên "Practice Standard 100 — Part 2" cùng "Practice Standard 100 – Valuation Conclusions and Valuation Reports", cả 2 sẽ produce cùng ID → AT confusion.

**Khuyến nghị:** key bằng hash `section.title` hoặc index thay vì slice.

### #4.9 — Thiếu `aria-required` trên input recipient email dù có indicator `*`
**Mức:** Cosmetic (a11y)
**File:** `src/components/preparer-block.tsx:144-151`

`*` visible và helper text bảo required, nhưng `<Input>` không được set `aria-required="true"`. RHF + Zod validate khi submit. Screen reader không announce "required" upfront. Cùng issue với mấy field khác trong preparer block.

**Khuyến nghị:** thêm `aria-required="true"` trên mỗi input required. ~6 dòng edit.

### #4.10 — Font `Inter` load từ Google Fonts — request third-party mỗi page load
**Mức:** Low (privacy)
**File:** `src/app/layout.tsx:2, 5`

`next/font/google` self-host ở build time (Google Fonts không serve từ Google CDN runtime từ Next 14). Verified — không leak PII tới Google.

**Khuyến nghị:** không.

### #4.11 — Không có header `Content-Security-Policy`
**Mức:** Low
**File:** `next.config.ts` (toàn file)

Không CSP. Default Next.js inline script và style attribute trong component cần `unsafe-inline` hoặc strict-nonce — thêm CSP không phá app là non-trivial.

**Khai thác thực tế:** thấp vì (a) không UGC render dạng HTML, (b) Basic Auth gate toàn surface. CSP là defense-in-depth.

**Khuyến nghị:** thêm `vercel.json` Vercel với ít nhất `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. CSP có thể chờ.

---

## §5 — Build / Deploy / Configuration

### #5.1 — `next.config.ts` enable experimental Server Actions với body limit 2MB
**Mức:** Low
**File:** `next.config.ts:4-8`

```ts
experimental: {
  serverActions: { bodySizeLimit: "2mb" },
},
```

Server Actions không còn experimental trong Next 15 — wrapper `experimental` không cần nhưng vô hại. Limit 2MB cap payload — vượt xa submission lớn nhất mong đợi (~50KB). Attacker vẫn force được payload 2MB tốn parse time; kết hợp §2.1 (no rate limit) khuếch đại DoS surface.

**Khuyến nghị:** drop wrapper `experimental`; giảm `bodySizeLimit` xuống `200kb` vì submission thật ~50KB:
```ts
const nextConfig: NextConfig = {
  serverActions: { bodySizeLimit: "200kb" },
};
```

### #5.2 — Next.js detect 2 lockfile (warning workspace-root)
**Mức:** Low
**File:** `D:\Github\pnpm-lock.yaml` (parent dir) + `pnpm-lock.yaml`

Build output: `Detected additional lockfiles: D:\Github\CBV-Practice-Inspection-Checklist\pnpm-lock.yaml`. Next infer workspace root từ `D:\Github\pnpm-lock.yaml` (parent), có thể include file không liên quan trong file-tracing → bundle phình AND có thể tương tác với finding #3.1 (file-tracing scope).

**Khuyến nghị:** thêm `outputFileTracingRoot` vào `next.config.ts`:
```ts
import path from 'node:path';
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // ...
};
```

### #5.3 — Script `smoke:email` trong `package.json` cần `.env.local` tồn tại
**Mức:** Cosmetic
**File:** `package.json:13`

`tsx --env-file=.env.local scripts/smoke-send.ts` fail với "ENOENT" nếu `.env.local` vắng. Documented implicit qua `.env.example` trong README.

**Khuyến nghị:** giữ nguyên.

### #5.4 — `.gitignore` cover `.env*.local` và `.claude/` đúng; thiếu `*.log`
**Mức:** Cosmetic
**File:** `.gitignore`

Không có glob `*.log`. Vitest, Next, pnpm đều có thể tạo `.log` file trong cwd, sẽ bị accidentally commit.

**Khuyến nghị:** thêm `*.log` vào `.gitignore`.

### #5.5 — `.env.example` list `OPENAI_API_KEY` là "unused in v1" nhưng không parse trong `env.ts`
**Mức:** Cosmetic (consistency)
**File:** `.env.example:24`, `src/server/env.ts:14-22`

Example mention `OPENAI_API_KEY` nhưng schema Zod không include. Nếu deploy operator set tưởng nó làm gì đó, không gì xảy ra silently. README cũng list "Present but unused".

**Khuyến nghị:** hoặc thêm `OPENAI_API_KEY: z.string().optional()` vào `env.ts` cho forward-compat, hoặc remove mention khỏi `.env.example` cho tới khi v2 cần.

### #5.6 — README example `BASIC_AUTH_PASS=changeme` nguy hiểm nếu copy lên prod
**Mức:** Medium
**File:** `.env.example:21`

Literal `changeme` nguy hiểm hơn helpful. Deploy gấp không rotate = trivially crackable.

**Khuyến nghị:** thay bằng `BASIC_AUTH_PASS=__GENERATE_A_RANDOM_VALUE__` và thêm 1 dòng instruction README `openssl rand -base64 32`. Tương tự cho `BASIC_AUTH_USER` (default `admin` enumerable).

---

## §6 — Dependency CVEs (`pnpm audit`)

2 advisory **moderate**, đều transitive (không phải dep direct):

### #6.1 — `prismjs@1.29.0` — DOM Clobbering → resultant XSS
**Mức:** Medium per CVSS (4.9), nhưng **N/A trong app này**
**Path:** `.>@react-email/components>@react-email/code-block>prismjs`
**CVE:** CVE-2024-53382, GHSA-x7hr-w5r2-h6wg
**Fix trong:** `prismjs@1.30.0`

`prismjs` được pull transitive qua component `code-block` của `@react-email/components`. Chúng ta **không dùng** `<CodeBlock>` trong email template (`checklist-email.tsx` chỉ dùng `Html`, `Head`, `Body`, `Container`, `Heading`, `Text`, `Section`, `Hr`). Code vulnerable là dead trong bundle.

**Khai thác thực tế:** zero. PrismJS server-render ở email-build time, không browser context xử lý HTML untrusted.

**Khuyến nghị:** suppress qua `pnpm overrides` để force `prismjs@^1.30.0` cho clean:
```json
"pnpm": { "overrides": { "prismjs": "^1.30.0" } }
```

### #6.2 — `postcss@8.4.31` — XSS qua `</style>` không escape trong stringify output
**Mức:** Medium per CVSS (6.1), nhưng **N/A trong app này**
**Path:** `.>next>postcss`
**CVE:** CVE-2026-41305, GHSA-qx2v-qp2m-jg93
**Fix trong:** `postcss@8.5.10`

PostCSS là phần build toolchain Next.js. Vulnerability cần (a) parse CSS user-controlled, (b) re-stringify, (c) embed output trong tag `<style>` serve cho browser. Không có cái nào xảy ra trong app này — chúng ta không xử lý CSS user.

**Khai thác thực tế:** zero trong threat model app này.

**Khuyến nghị:** Next.js sẽ pull version patched ở minor release tiếp. Force override giờ nếu muốn audit clean:
```json
"pnpm": { "overrides": { "postcss": "^8.5.10" } }
```

### #6.3 — Package transitive deprecated (informational)
`pnpm install` warn: 20 subpackage `@react-email/*` deprecated từ `@react-email/components@0.0.35`. Deprecation upstream-driven (consolidate vào package monolithic mới hơn). Functional hôm nay; cách 1 major version từ break.

**Khuyến nghị:** plan upgrade `@react-email/components` ở maintenance window tiếp.

---

## §7 — Testing Surface

### #7.1 — Test submit-checklist phụ thuộc `Date.now()` engagement name cho dedupe isolation
**Mức:** Low (test maintenance risk)
**File:** `src/server/__tests__/submit-checklist.test.ts`

Test dùng ``engagementName: `Happy ${Date.now()}` `` để né Map `seen` module-level trong `dedupe.ts`. Assumption ngầm: dedupe map persist qua test. `_resetDedupe()` đã thêm trong commit `32c296c` nhưng test submit không gọi.

**Khuyến nghị:** `import { _resetDedupe } from "../dedupe"` + `beforeEach(() => _resetDedupe())`. Sau đó drop suffix `Date.now()`.

### #7.2 — `dedupe.test.ts` không cover collision `undefined`-key (Finding #2.3)
**Mức:** Cosmetic
**File:** `src/server/__tests__/dedupe.test.ts`

Thêm:
```ts
it("treats {a:1, note: undefined} as different from {a:1}", () => {
  // Sau fix #2.3, 2 cái này nên hash khác. Hôm nay collide.
  // ...
});
```

### #7.3 — Không có integration test verify happy path `submitChecklist` thực sự invoke Nodemailer
**Mức:** Cosmetic
**File:** `src/server/__tests__/submit-checklist.test.ts`

Test happy-path hiện tại mock `mailer` toàn bộ. Không verify wiring qua tới SMTP server thật (hoặc testcontainer). Acceptable cho layer unit-test; smoke end-to-end là việc của `pnpm smoke:email`.

**Khuyến nghị:** không — approach layered đúng.

### #7.4 — `mailer.test.ts` cast `transporter.options` qua `unknown as` — type-fragile
**Mức:** Cosmetic
**File:** `src/server/__tests__/mailer.test.ts:38, 50, 60, 70, 78`

Lặp `(t as unknown as { options: Record<string, unknown> }).options`. Hoạt động nhưng couple test với internal API surface của Nodemailer. Nếu Nodemailer đổi options getter, cả 5 site break cùng nhau.

**Khuyến nghị:** extract helper:
```ts
function getOpts(t: Transporter): Record<string, unknown> {
  return (t as unknown as { options: Record<string, unknown> }).options;
}
```

---

## §8 — Confirmed Safe (không cần action)

List để re-audit tương lai không phải làm lại.

| File | Đã check | Kết luận |
|---|---|---|
| `src/server/mailer.ts` | Thứ tự ưu tiên `resolveSecure()`, branching pool, pin TLS minVersion, giá trị timeout, không top-level side effect | ✅ Đúng |
| `src/server/env.ts` | `envBool` cover mọi chuỗi truthy/falsy chuẩn, port coercion từ chối số âm/zero/non-numeric, email validation cho `SMTP_USER` | ✅ Đúng |
| `src/server/submit-checklist.ts` | Thứ tự thao tác, error propagation, log SMTP error đã sanitise (không có `auth`, không `stack`, không password) | ✅ Đúng |
| `src/server/email/render.ts` + `checklist-email.tsx` | Subject verbatim, ordering `buildNoAnswersList`, react-email auto-escape interpolation, không có raw-HTML injection sink | ✅ Đúng |
| `src/server/pdf/checklist-pdf.tsx` | Mọi user data render qua node `<Text>` (escape), không eval/Function constructor | ✅ Đúng |
| `src/lib/engagement.ts` | `slugifyEngagement` produce ASCII filename-safe; `formatDate` deterministic | ✅ Đúng |
| `src/middleware.ts` | Basic Auth với timing-safe compare, fail-closed khi env thiếu | ✅ Đúng |
| `src/components/checklist-form.tsx` | React 19 `inert`, scroll-and-focus flow, không XSS sink | ✅ Đúng |
| Toàn `src/components/ui/*` | Wrapper presentational thuần, không HTML injection path | ✅ Đúng |
| `.gitignore` | `.env`, `.env.local`, `.claude/`, `.serena/` cover | ✅ Đúng |

---

## Danh sách Fix theo Ưu tiên

**Nên fix trước deploy tiếp theo:**
1. **#5.6** — Bỏ `BASIC_AUTH_PASS=changeme` khỏi `.env.example`. (1 dòng + note README.)
2. **#3.1** — Chuyển fixtures vào `src/lib/fixtures/` để `(dev)/preview-email` không import từ ngoài `src/`. (3 file move + 2 import update.)

**Nên fix sớm:**
3. **#2.2** — Thêm env `EMAIL_RECIPIENT_ALLOWLIST` hoặc bỏ recipient form-controlled. (~10 dòng.)
4. **#2.1** — Thêm rate limit submit (token bucket per-IP cùng style in-memory với dedupe). (~30 dòng + 1 test.)
5. **#5.1** — Drop wrapper `experimental`, siết `bodySizeLimit` xuống `200kb`. (3 dòng.)
6. **#5.2** — Set `outputFileTracingRoot` trong `next.config.ts`. (3 dòng.)
7. **#2.3** — Fix xử lý `undefined`-key trong `canonicalize()` + thêm regression test. (~5 dòng + 1 test.)
8. **#7.1** — Dùng `_resetDedupe()` trong test submit-checklist. (2 dòng.)

**Nice-to-have:**
9. **#6.1, #6.2** — Thêm `pnpm overrides` để silence audit. (5 dòng trong `package.json`.)
10. **#5.4** — Thêm `*.log` vào `.gitignore`. (1 dòng.)
11. **#4.9** — Thêm `aria-required="true"` cho input required trong `preparer-block.tsx`. (~6 dòng.)
12. **#4.8** — Ngừng slice `section.title` 20 char để gen ID. (~2 dòng.)
13. **#3.5** — Lowercase + trim recipient email trước hash/send. (~1 dòng.)

**Defer / giữ nguyên** (theo YAGNI/KISS): #1.1, #1.2, #1.3, #1.4, #2.4, #2.5, #2.6, #2.7, #3.2, #3.3, #3.4, #3.6, #4.1, #4.4–#4.7, #4.10, #4.11, #5.3, #5.5, #6.3, #7.2–#7.4.

---

## Tóm tắt Threat Model

App deployed là tool internal volume thấp gate bằng 1 HTTP Basic Auth credential chia sẻ, gửi email qua 1 Gmail/Workspace mailbox. Threat thực tế:
1. **Insider abuse** Basic Auth credential chia sẻ để email mọi recipient (#2.2).
2. **Vắt cạn quota** Gmail sender bằng submit lặp (#2.1).
3. **Lộ credential** nếu `BASIC_AUTH_PASS` để `changeme` (#5.6) hoặc qua pipeline export logs/SIEM (#2.6).
4. **Build-time deploy fail** trên Vercel từ cross-boundary import trong `(dev)/preview-email` (#3.1).

Không có gì trong scope là **critical** hay **high**. Codebase well-structured và test discipline của migration bắt được phần meaningful của regression. 3 fix top đủ nhỏ để land trong 1 commit.

## Câu hỏi mở
- Có nên xoá hẳn `(dev)/preview-email` không (resolve #3.1 với chi phí 0) hay giữ và refactor?
- Field form `recipientEmail` có phải product requirement cứng không, hay có thể lock vào `connect@aspenval.com`? (resolve #2.2 sạch)
- Deploy target thực tế là gì — single-tenant Vercel Hobby cho 1 client, hay shared platform? (đổi calculus #1.2 / #2.1 rate limiting.)
