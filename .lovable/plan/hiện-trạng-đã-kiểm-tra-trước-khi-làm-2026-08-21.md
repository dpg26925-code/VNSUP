## Hiện trạng đã kiểm tra (trước khi làm)

- **RFQ form**: đã là form React `onSubmit` (không phải `method="GET"`), có validate tên/email/mô tả, ghi vào bảng `leads`. Không cần đổi sang `/api/rfq`. Sẽ chỉ siết validate theo spec (mô tả ≥ 20 ký tự, tên công ty bắt buộc, giữ dữ liệu khi lỗi).
- **3 slug 404**: `cong-ty-tnhh-nhua-duy-tan-binh-duong`, `co-khi-chinh-xac-duy-khanh`, `co-khi-toan-cau-dong-nai` **không tồn tại trong database** (DB hiện chỉ có 4 doanh nghiệp: DC Blouse, Màng BOPP Tú Phương, Phân bón Bình Điền Cửu Long, Nhựa Long Thành). Không thể trả 200 nếu không có dữ liệu — cần bạn xác nhận: tạo hồ sơ mới cho 3 công ty này, hay bỏ qua?
- **Badge "Edit with Lovable"**: chỉ ẩn được với gói Pro trở lên — tài khoản hiện tại bị từ chối. Cần nâng gói.
- Một số phần P1 đã có sẵn: gallery + lightbox, FAQ JSON-LD, reviews + AggregateRating, certifications/gallery/faqs (dạng JSONB trên `companies`), KCN/CCN.

## P0
1. Siết validate RFQ: mô tả tối thiểu 20 ký tự, tên công ty bắt buộc, thông báo lỗi rõ ràng, giữ nguyên dữ liệu khi lỗi, xoá form khi thành công.
2. Slug 404: thêm bảng ánh xạ redirect slug cũ → slug mới và xử lý trong route `/company/$slug` (301 tới slug hiện hành, `notFound()` nếu thật sự không có).

## P1 — Hồ sơ doanh nghiệp đầy đủ
Migration:
- `companies`: thêm `tax_code` (unique), `business_registration_number`, `legal_representative`.
- Bảng mới: `certifications`, `company_gallery`, `company_videos`, `company_faqs`, `company_export_markets` (bảng `products`, `company_reviews`, `articles` đã có; sẽ bổ sung cột `moq`, `lead_time`, `price_range`, `catalog_url`, `sort_order` cho `products`).
- Mỗi bảng: GRANT cho `anon` (đọc công khai) + `authenticated`/`service_role`, bật RLS, policy: ai cũng đọc được của công ty đã duyệt; chủ hồ sơ + admin ghi.

Giao diện:
- Trang `/company/$slug`: Quick Info (mã số thuế + link tra cứu Tổng cục Thuế, người đại diện, năm thành lập, quy mô), Sản phẩm (MOQ/lead time/giá), Chứng chỉ, Thư viện ảnh, Video, FAQ, Tin tức, Thị trường xuất khẩu, Liên hệ, RFQ. Mỗi mục có empty state, không hiện mục rỗng ra ngoài.
- Admin/Submit form: CRUD cho từng mục ở trên, dùng lại `media-upload` cho ảnh/tài liệu.

## P2 — UX/UI (theo design system đã lưu)
- Bổ sung token còn thiếu vào `src/styles.css`, chuẩn hoá primitives (Card, Button, Badge, Skeleton, EmptyState) trong `src/components/primitives.tsx`.
- Rà soát và loại bỏ mọi class màu hardcode; animation CSS ≤ 200ms; kiểm tra responsive mobile-first cho Home, Search, Profile, Pricing, Auth, 404.

## P3 — SEO
- Meta description riêng cho từng route còn thiếu; JSON-LD Organization ở home, LocalBusiness + Breadcrumb + FAQPage ở profile.
- `sitemap-companies.xml` lấy toàn bộ công ty `approved` (hiện dùng `updated_at` thật, sẽ kiểm tra lại lastmod).
- Rà soát `robots.txt`.

## Kỹ thuật
- Toàn bộ đọc/ghi qua Supabase client trình duyệt + `createServerFn` (không dùng Edge Function).
- Media tiếp tục dùng bucket riêng `vnsupplier` với signed URL.

## Cần bạn xác nhận
1. 3 slug 404: tạo hồ sơ doanh nghiệp mới hay bỏ qua?
2. Có muốn tôi làm tuần tự P0+P1 trước (lượt này) rồi P2+P3 lượt sau không? Toàn bộ trong một lượt sẽ rất dài.
