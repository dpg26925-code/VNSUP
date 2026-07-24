## Mục tiêu

Mỗi Khu Công Nghiệp (KCN) và Cụm Công Nghiệp (CCN) có landing page riêng, tối ưu SEO (title/description riêng, canonical, OG, JSON-LD `Place`+`BreadcrumbList`, sitemap, breadcrumb), có trang danh sách lọc theo tỉnh và tích hợp vào Admin.

## Kiến trúc route

```text
/khu-cong-nghiep                     → danh sách KCN (lọc theo tỉnh)
/khu-cong-nghiep/$slug               → landing page 1 KCN
/cum-cong-nghiep                     → danh sách CCN
/cum-cong-nghiep/$slug               → landing page 1 CCN
```

Dùng chung 1 bảng `industrial_zones` với cột `kind ∈ {kcn, ccn}` — 2 nhóm route đọc cùng nguồn, khác bộ lọc. Slug unique toàn bảng để không đụng nhau.

Bỏ 2 chuyên mục "Khu Công Nghiệp" / "Cụm Công Nghiệp" khỏi bảng `categories` (đã thêm ở lần trước) vì giờ đã có bảng chuyên biệt — tránh trùng khái niệm.

## Database (migration)

Bảng `public.industrial_zones`:
- `kind` (enum `zone_kind`: `kcn`, `ccn`)
- `name`, `slug` (unique), `province` (dùng list 34 tỉnh trong `src/lib/factory.ts`)
- `address`, `district`, `developer` (chủ đầu tư), `established_year`
- `area_ha` numeric (diện tích ha), `occupancy_percent` int, `land_price_usd_m2_year` numeric
- `industries` text[] (ngành ưu tiên)
- `logo_url`, `banner_url`, `gallery_url[]`
- `description` (long form), `ai_summary` (short), `highlights` text[]
- `contact_phone`, `contact_email`, `website_url`
- `latitude`, `longitude`
- `faqs` jsonb (mảng `{q,a}`)
- `status` (`draft`|`approved`), `is_featured` bool
- `meta_title`, `meta_description`, `canonical_url` — tự sinh bởi trigger `industrial_zones_autofill_seo` (tương tự `companies_autofill_seo`)
- `created_at`, `updated_at`

RLS + GRANT:
- `SELECT TO anon, authenticated` với `status='approved'`
- `INSERT/UPDATE/DELETE TO authenticated` gate qua `has_role(auth.uid(),'admin')`
- `GRANT ALL … TO service_role`
- Trigger `update_updated_at_column`

Xoá 2 dòng chuyên mục `khu-cong-nghiep`, `cum-cong-nghiep` khỏi `categories`.

## Routes + SEO

Mỗi route detail (`/khu-cong-nghiep/$slug`, `/cum-cong-nghiep/$slug`) có:
- `loader` gọi server fn `getZoneBySlug({slug, kind})` — filter `status='approved'`, throw `notFound()` nếu miss
- `head({loaderData})` trả:
  - `title`: `{name} — KCN tại {province} | VNSupplier` (≤ 60 ký tự)
  - `description`: `meta_description` từ DB (≤ 160)
  - `og:title`, `og:description`, `og:type=article`, `og:url` self-ref
  - `og:image`/`twitter:image` = `banner_url` (absolute URL từ `getRequestOrigin` nếu là relative)
  - `link canonical` self-ref
- `scripts` JSON-LD: `Place` (name, address, geo, url, image) + `BreadcrumbList` (Trang chủ → Danh sách KCN → Tên KCN) + `FAQPage` (nếu có faqs)
- `notFoundComponent`, `errorComponent`

Trang danh sách `/khu-cong-nghiep`, `/cum-cong-nghiep`:
- Grid card + filter theo tỉnh (dùng `PROVINCES` từ `src/lib/factory.ts`)
- `head()` riêng cho từng trang; JSON-LD `CollectionPage` + `BreadcrumbList`

UI:
- Hero: banner + tên + tỉnh + chip highlights
- Quick Info Cards: diện tích, tỷ lệ lấp đầy, chủ đầu tư, năm hoạt động, giá thuê
- Section: Ngành nghề ưu tiên (chips)
- Section: Vị trí + bản đồ (embed OSM iframe từ lat/lng, không cần API key)
- Section: Mô tả dài
- Section: FAQs (accordion)
- Section: Liên hệ (phone/email/website)
- CTA: "Yêu cầu tư vấn" → tái dùng form `LeadForm` sẵn có, gắn `source='zone:{slug}'`
- Dùng primitives VStack/HStack/Container, tokens Astryx, skeleton states

## Sitemap

Cập nhật `src/routes/sitemap[.]xml.ts`: thêm entries `/khu-cong-nghiep`, `/cum-cong-nghiep`, và mỗi zone `approved` (đọc `slug, updated_at, kind`). Không set `<lastmod>` từ build time — chỉ dùng `updated_at` thật.

## Admin

Thêm mục sidebar "KCN & CCN" → route `/dashboard/admin/zones` (list, filter kind + status), và `/dashboard/admin/zones/$id/edit` (form CRUD đủ trường + upload ảnh banner/gallery). Auto-slug từ Tên (dùng lại `slugify` đã có). Nút Duyệt/Từ chối cho draft. Ghi `admin_audit_log`.

## Data seed

Seed 6-8 KCN nổi bật để trang có nội dung ngay:
- KCN VSIP Bắc Ninh, KCN Yên Phong, KCN Amata Biên Hoà (thuộc Đồng Nai), KCN Tân Thuận (TP.HCM), KCN Deep C Hải Phòng, KCN Long Hậu, KCN Bàu Bàng (nay TP.HCM), KCN Quang Minh (Hà Nội).
Và 2-3 CCN mẫu. Mỗi bản ghi đủ `banner_url`, `meta_*`, `faqs`, `highlights`, `industries` để SEO không trống.

## Kiểm chứng

- Build pass.
- Truy cập `/khu-cong-nghiep/vsip-bac-ninh`: kiểm tra `<title>`, `<meta description>`, canonical, JSON-LD hợp lệ (Place + Breadcrumb + FAQ).
- `/sitemap.xml` chứa các URL mới.
- Admin tạo mới 1 KCN → duyệt → xuất hiện trên danh sách và sitemap.

## Ngoài phạm vi (đề xuất sau)

- Upload ảnh vào Supabase Storage (hiện dùng URL ngoài).
- Liên kết công ty ↔ KCN (bảng nối `company_zones`) để hiển thị "Doanh nghiệp trong KCN".
- Bản đồ tương tác Leaflet thay iframe OSM.

Bạn duyệt là mình chạy migration + code trong lượt tiếp theo.
