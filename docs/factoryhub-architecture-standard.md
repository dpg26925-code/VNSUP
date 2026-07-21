# FactoryHub — Chuẩn kiến trúc (TanStack Start + Supabase)

> Dùng cho Lovable / Hermes / mọi prompt liên quan đến code & deploy.
> Stack: **TanStack Start (React 19, Vite 7)** chạy trên **Cloudflare Worker Edge** + **Supabase Postgres/Storage/Auth**.
> Tài liệu này đã được hiệu chỉnh cho đúng stack Lovable — **KHÔNG** dùng Supabase Edge Functions làm server layer mặc định.

---

## 1. Nguyên tắc vàng

```
Frontend (SSR)        = TanStack Start route + component + head() metadata
App-internal backend  = createServerFn (RPC type-safe, chạy trên CF Worker)
Public HTTP endpoint  = TanStack server route (/api/public/*)
Database + Auth       = Supabase Postgres + RLS + Auth
Supabase Edge Function = CHỈ dùng khi buộc phải chạy tại URL Supabase (rất hiếm)
```

Cloudflare Worker của TanStack Start **đủ mạnh** để xử lý: SSR, RPC, webhook (HMAC), cron endpoint, AI fetch, admin CRUD. Không cần tách sang Supabase EF.

---

## 2. Phân chia trách nhiệm

### TanStack Start (CF Worker) làm

- **SSR & routing**: file-based routing dưới `src/routes/`.
- **SEO metadata**: `head()` trên từng route (title, description, OG, JSON-LD).
- **`createServerFn`**: mọi RPC nội bộ — đọc/ghi DB, business logic, gọi AI Gateway, gọi payOS API.
- **Server routes `/api/public/*`**: webhook (payOS), cron endpoint, public API, feed (sitemap.xml, rss).
- **Auth check**: middleware `requireSupabaseAuth` trong server fn; route bảo vệ dưới `_authenticated/`.
- **File upload nhỏ (<10MB)**: qua server fn → Supabase Storage.

### TanStack Start (CF Worker) **KHÔNG** làm

- Xử lý ảnh nặng (resize, watermark >5MB) → dùng Supabase Storage transform hoặc external service.
- Long-running job (>30s wall time) → chuyển sang pg_cron + server route callback.
- Subprocess / native binaries (sharp, canvas, puppeteer) → không có Node runtime thật.

### Supabase làm

- **Postgres + RLS**: nguồn dữ liệu duy nhất, mọi bảng có policy scoped `auth.uid()`.
- **Auth**: email/password, Google OAuth (qua Lovable broker), session JWT.
- **Storage**: file upload, ảnh công ty, tài liệu.
- **pg_cron**: lịch chạy định kỳ, gọi vào `/api/public/hooks/*` để trigger job.
- **Trigger/Function SQL**: chuẩn hoá slug, sinh meta, audit log.

### Supabase Edge Functions

- **KHÔNG dùng làm mặc định.** Chỉ tạo khi:
  - Cần URL cố định trên domain `*.supabase.co` (VD: một số webhook provider yêu cầu).
  - Cần chạy Deno-specific runtime (rất hiếm).
- Nếu tạo, phải ghi rõ lý do vào docstring của function.

---

## 3. Cấu trúc thư mục chuẩn

```
src/
  routes/
    __root.tsx                              -- layout gốc, meta chung, ThemeProvider
    index.tsx                               -- /
    search.tsx                              -- /search
    company.$slug.tsx                       -- /company/:slug
    industry.$slug.tsx                      -- /industry/:slug
    province.$slug.tsx                      -- /province/:slug
    pricing.tsx                             -- /pricing
    auth.tsx                                -- /auth (public)
    sitemap[.]xml.ts                        -- /sitemap.xml
    _authenticated/
      route.tsx                             -- gate ssr:false (integration-managed)
      dashboard.tsx                         -- /dashboard
      dashboard.submit-company.tsx
      dashboard.admin.companies.tsx
      admin.tsx                             -- /admin
    api/
      public/
        webhooks/
          payos.ts                          -- HMAC verify + supabaseAdmin
        hooks/
          expire-subscriptions.ts           -- pg_cron gọi vào
        admin/
          articles.ts
          companies.ts
          leads.ts
          analytics.summary.ts

  lib/
    factory.ts                              -- constants: PROVINCES, INDUSTRIES
    payments.functions.ts                   -- createServerFn: createPayment, listMyOrders
    payos.server.ts                         -- helper server-only (HMAC, signing)
    admin-api.server.ts                     -- helper server-only cho /api/public/admin
    seo.ts                                  -- generateTitle, generateMeta, JSON-LD

  components/
    ui/                                     -- shadcn components
    site-header.tsx, site-footer.tsx
    company/, search/, admin/

  integrations/
    supabase/
      client.ts                             -- browser client
      client.server.ts                      -- admin (service role), CHỈ import trong .handler()
      auth-middleware.ts                    -- requireSupabaseAuth
      types.ts                              -- generated, KHÔNG sửa tay

supabase/
  migrations/                               -- SQL migrations (do tool quản lý)
  config.toml
```

**Quy tắc file:**
- `*.functions.ts` = chứa `createServerFn`, client có thể import an toàn.
- `*.server.ts` = server-only helper, bundler chặn client import.
- **Không** đặt `.functions.ts` dưới `src/server/` — thư mục này bị chặn client-side.
- Trong `.functions.ts`, `supabaseAdmin` chỉ được import bằng `await import()` **trong body của `.handler()`**.

---

## 4. Quy ước routing

| Loại | Đường dẫn | Auth | Ví dụ |
|---|---|---|---|
| Public page | `src/routes/*.tsx` | Không | `/`, `/company/:slug` |
| Protected page | `src/routes/_authenticated/*.tsx` | Có (gate `ssr:false`) | `/dashboard`, `/admin` |
| Public HTTP API | `src/routes/api/public/*.ts` | Tự verify | webhook, cron |
| App-internal RPC | `src/lib/*.functions.ts` | `requireSupabaseAuth` khi cần user | mọi CRUD từ UI |

**Không** tạo `src/routes/api/private/` — logic nội bộ phải qua `createServerFn`, không phải HTTP route.

---

## 5. Bundle size & performance

- **CF Worker bundle**: mục tiêu <1MB gzipped. Kiểm tra bằng `bun run build` → xem output size.
- **`createServerFn` handler**: giữ nhẹ, không import thư viện nặng ở module scope.
- **Server route webhook**: verify signature TRƯỚC khi parse body / query DB.
- **Loader**: default TanStack Query — `context.queryClient.ensureQueryData(queryOptions)` + `useSuspenseQuery` trong component.

---

## 6. Database access

| Client | Dùng ở đâu | RLS | Key |
|---|---|---|---|
| `supabase` (browser) | Component, hook, realtime | Có | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Server publishable | Server fn/route đọc public | Có (as anon) | `SUPABASE_PUBLISHABLE_KEY` |
| `context.supabase` (từ `requireSupabaseAuth`) | Server fn có middleware | Có (as user) | user JWT |
| `supabaseAdmin` | Webhook verified, admin op | **Bypass** | `SUPABASE_SERVICE_ROLE_KEY` |

**Rule sắt:** `supabaseAdmin` chỉ nạp bằng `await import('@/integrations/supabase/client.server')` **bên trong** `.handler()`. Import ở module scope của `.functions.ts` sẽ leak service role vào client bundle.

---

## 7. Auth flow

1. User đăng nhập tại `/auth` (email/password hoặc `lovable.auth.signInWithOAuth('google')`).
2. Supabase Auth trả JWT, lưu trong localStorage (browser client).
3. Route bảo vệ đặt dưới `src/routes/_authenticated/` — layout `ssr:false` do integration quản lý, tự redirect `/auth` nếu không có user.
4. Server fn cần user → `.middleware([requireSupabaseAuth])`, bearer attach tự động bởi `functionMiddleware` trong `src/start.ts`.
5. Role check: query bảng `user_roles` qua `has_role(user_id, role)` SQL function (SECURITY DEFINER, tránh RLS recursion).

**Không** lưu role trong bảng `profiles`.

---

## 8. SEO metadata chuẩn

Mỗi route public có `head()` riêng, KHÔNG copy từ home page:

```tsx
export const Route = createFileRoute('/industry/$slug')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(industryQueryOptions(params.slug)),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData.industry.name} — VNSupplier.cloud` },
      { name: 'description', content: loaderData.industry.desc },
      { property: 'og:title', content: `${loaderData.industry.name} — VNSupplier.cloud` },
      { property: 'og:image', content: loaderData.industry.coverUrl },
      { rel: 'canonical', href: `https://vnsupplier.cloud/industry/${loaderData.industry.slug}` },
    ],
  }),
  component: IndustryPage,
});
```

- `og:image` **chỉ** đặt ở leaf route, KHÔNG đặt ở `__root.tsx`.
- Home page có JSON-LD `Organization`; trang công ty có JSON-LD `LocalBusiness`.
- Sitemap sinh động tại `src/routes/sitemap[.]xml.ts`.

---

## 9. Payment (payOS)

- Tạo payment link: `createPayment` server fn (`src/lib/payments.functions.ts`).
- HMAC verify + xử lý webhook: `src/routes/api/public/webhooks/payos.ts`.
- Bảng liên quan: `payment_orders`, `subscriptions`, cờ `is_featured` / `is_verified` / `owner_id` trên `companies`.
- Hạ cờ hết hạn: `src/routes/api/public/hooks/expire-subscriptions.ts`, gọi bằng pg_cron.

---

## 10. Deploy & environment

**Client (VITE_ prefix, lộ ra browser):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

**Server-only (KHÔNG có VITE_):**
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- `LOVABLE_API_KEY` (Lovable tự provision, không hỏi user).

**Đọc secret:** `process.env.X` **chỉ** trong body của `.handler()` hoặc server route handler. Không đọc ở module scope (undefined trên CF Worker).

**Domain:** `vnsupplier.cloud` (production), `project--2496ed4d-c5af-4466-9520-a171e69e17fb.lovable.app` (stable preview cho webhook config).

---

## 11. Checklist trước khi thêm feature

Trước khi viết code, hỏi 4 câu:

1. **Ai gọi?** User trên UI → `createServerFn`. External (payOS, cron) → server route `/api/public/*`.
2. **Cần auth không?** User → `requireSupabaseAuth`. Webhook → verify HMAC. Cron → verify `CRON_SECRET`.
3. **Đọc DB kiểu nào?** Public data → server publishable client + policy `TO anon`. User data → `context.supabase`. Privileged → `supabaseAdmin` sau khi verify caller.
4. **Có cần SEO không?** Nếu là trang public share được → thêm `head()` riêng + JSON-LD nếu có schema phù hợp.

---

## 12. Anti-pattern — TUYỆT ĐỐI tránh

- ❌ Tạo `supabase/functions/<name>/index.ts` cho logic nội bộ.
- ❌ Import `supabaseAdmin` ở module scope của `.functions.ts` hoặc route file.
- ❌ Đọc `process.env.X` ở module scope.
- ❌ Gọi DB / secret trực tiếp trong `loader` (loader chạy cả client).
- ❌ Đặt `beforeLoad` auth gate trên route SSR top-level (loop trên hard refresh).
- ❌ `fetch()` thẳng vào URL của server fn — dùng `useServerFn`.
- ❌ Lưu role trong `profiles` — luôn dùng bảng `user_roles` + `has_role()`.
- ❌ CHECK constraint với `now()` — dùng validation trigger.
- ❌ Tạo bảng public không có `GRANT` — PostgREST sẽ 401.

---

## 13. Prompt template khi thêm feature

```
Thêm feature: <tên>

Kiến trúc:
- UI: <route path> (public/protected)
- Server fn: <src/lib/x.functions.ts> — <mô tả>
- Server route (nếu có): <src/routes/api/public/...> — verify <cách>
- DB: <bảng>, RLS policy scoped <auth.uid()>
- Auth: <requireSupabaseAuth | public>
- SEO: <head() cần metadata gì>

Không dùng: Supabase Edge Function, module-scope process.env, loader query DB trực tiếp.
```

---

## Tham chiếu

- TanStack Start knowledge: `tanstack-server-functions`, `tanstack-server-routes`, `tanstack-supabase-integration`, `tanstack-execution-model`.
- Lovable docs: https://docs.lovable.dev/
- Supabase project: `fnyonwdojxkchbrqrcpu`.
