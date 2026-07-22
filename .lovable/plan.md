# Kế hoạch Launch-Ready VNSupplier

Triển khai theo đúng thứ tự P0 → P1 → P2 → P3, mỗi batch commit riêng để bạn review từng bước. Nhiều phần trong prompt đã có sẵn từ các lượt trước; kế hoạch dưới chỉ liệt kê phần **thực sự còn thiếu / cần sửa**.

---

## Batch P0 — Critical fixes (làm trước tiên)

1. **Fix 3 slug 404**
   - Chuẩn hóa lại trong DB (`companies.slug`) sang dạng ASCII-only, không dấu:
     - `cong-ty-tnhh-nhua-duy-tan-binh-duong` (bỏ dấu `ì`)
     - `co-khi-chinh-xac-duy-khanh`
     - `co-khi-toan-cau-dong-nai`
   - Kiểm tra function `factoryhub_slugify` đã strip dấu Việt đúng; nếu không, chạy `UPDATE` một lần cho toàn bộ hàng có slug chứa ký tự non-ASCII.

2. **Auth page**
   - Đã đúng title `Đăng nhập | VNSupplier`. Xác nhận `/auth` không bao giờ render dashboard (component chỉ trả form) — chỉ cần verify, không sửa.

3. **Remove Lovable branding**
   - Không có widget "Edit with Lovable" trong code — đây là badge Lovable inject ở preview. Trên published site với custom domain sẽ tự tắt qua `publish_settings--set_badge_visibility`. Hành động: gọi tool tắt badge (không cần code).

---

## Batch P1 — Company profile sections còn thiếu

Đa số section (Quick Info, Products, Certifications, Gallery + lightbox, Video, Reviews, FAQ + JSON-LD, News, Export markets, Related=6) đã implement ở các lượt trước. Sẽ:

- Đọc lại `src/routes/company.$slug.tsx` để xác nhận thứ tự section đúng như prompt.
- Bổ sung state trống ("Chưa cập nhật" / empty state) ở các section còn thiếu.
- Đảm bảo Products card đủ tags MOQ / Lead time / Price + nút "Tải catalogue" nếu `catalogue_url` có.
- Certifications: badge "Đã xác thực" khi `verification_status = 'verified'`.
- Kiểm tra grid responsive (3 desktop / 2 mobile cho Products & Gallery, 4 desktop / scroll mobile cho Certifications).

---

## Batch P2 — Homepage & Search UX

- **Homepage stats bar**: hiển thị số nhà máy, ngành, tỉnh, verified — pull realtime từ Supabase (count queries), có skeleton.
- **Search UI**: filter chips ngành/tỉnh có thể xoá, sort theo verified/rating/newest, pagination hoặc infinite scroll.
- Tokens/spacing theo memory design system — không hardcode màu.

---

## Batch P3 — SEO nâng cao

- JSON-LD `Organization` (đã có) + `WebSite` với `SearchAction` ở root.
- Breadcrumb JSON-LD trên `/industry/*`, `/province/*`, `/company/*`.
- `sitemap.xml` bổ sung `lastmod` từ `updated_at`, split nếu > 5k URL.
- OG image động cho company (fallback logo → placeholder VNSupplier).
- `robots.txt` allow all, disallow `/dashboard`, `/admin`.

---

## Batch Launch checks

- Chạy lại `supabase--linter` — fix hết ERROR/WARN.
- Xác minh Google OAuth flow end-to-end trên `vnsupplier.cloud`.
- Verify payOS webhook URL trỏ đúng `https://vnsupplier.cloud/api/public/webhooks/payos`.
- Kiểm tra 404/500 boundary trên tất cả route có loader.
- Confirm dark mode toggle hoạt động và persist.

---

## Kỹ thuật (chi tiết cho dev)

- **Slug fix**: `UPDATE public.companies SET slug = public.factoryhub_slugify(name) WHERE slug ~ '[^a-z0-9-]'` — kèm de-dup nếu trùng.
- **Stats**: server fn `getSiteStats` dùng `count: 'exact', head: true` cho `companies` (all / verified), distinct `industry`, distinct `province`.
- **Breadcrumb**: helper `buildBreadcrumbJsonLd(items)` gọi trong `head()` của các route.
- **Sitemap lastmod**: query `updated_at` max theo cluster, format ISO 8601.

---

## Không nằm trong scope (đã có sẵn)

- Auth Email/Google, reset password
- Dashboard buyer/owner
- payOS integration + plans
- Claim flow
- 34 tỉnh 2025
- Dark mode
- Footer VNSupplier + social

Duyệt kế hoạch để mình bắt đầu **Batch P0** ngay.
