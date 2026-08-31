import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyCompanyDetails,
  updateCompanyProfile,
  syncCompanyProducts,
  syncCompanyContacts,
  syncCompanyCertifications,
  syncCompanyGallery,
} from "@/lib/company-management.functions";
import { PROVINCES, EMPLOYEE_RANGES } from "@/lib/factory";
import { useIndustryOptions } from "@/lib/pickers";
import {
  Building2,
  Package,
  Phone,
  Award,
  Image as ImageIcon,
  Inbox,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  MapPin,
  Globe,
  FileText,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/manage-company/$id")({
  head: () => ({ meta: [{ title: "Quản lý Hồ sơ Doanh nghiệp | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: ManageCompanyPage,
});

const REVENUE_RANGES = ["< 1 tỷ", "1-10 tỷ", "10-50 tỷ", "50-200 tỷ", "200 tỷ - 1000 tỷ", "> 1000 tỷ"];
const COMPANY_TYPES = ["TNHH", "Cổ phần", "Cổ phần niêm yết", "Doanh nghiệp tư nhân", "FDI", "Nhà nước", "Hợp tác xã"];

function ManageCompanyPage() {
  const { id: companyId } = useParams({ from: "/_authenticated/dashboard/manage-company/$id" });
  const industries = useIndustryOptions();

  const fetchDetails = useServerFn(getMyCompanyDetails);
  const saveProfileFn = useServerFn(updateCompanyProfile);
  const saveProductsFn = useServerFn(syncCompanyProducts);
  const saveContactsFn = useServerFn(syncCompanyContacts);
  const saveCertsFn = useServerFn(syncCompanyCertifications);
  const saveGalleryFn = useServerFn(syncCompanyGallery);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "products" | "contacts" | "certs" | "gallery" | "leads">("info");

  // State data
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  // Action status
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDetails({ data: { companyId } });
      setCompany(data.company);
      setProducts(data.products || []);
      setContacts(data.contacts || []);
      setCertifications(data.certifications || []);
      setGallery(data.gallery || []);
      setLeads(data.leads || []);
    } catch (err: any) {
      setError(err?.message || "Không thể tải dữ liệu doanh nghiệp.");
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  // Save Tab 1: Profile Info
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveProfileFn({
        data: {
          companyId,
          patch: {
            name: company.name,
            slug: company.slug,
            tax_code: company.tax_code,
            business_registration_number: company.business_registration_number,
            legal_representative: company.legal_representative,
            founded_year: company.founded_year ? Number(company.founded_year) : null,
            employee_range: company.employee_range,
            revenue_range: company.revenue_range,
            company_type: company.company_type,
            industry: company.industry,
            sub_industry: company.sub_industry,
            province: company.province,
            district: company.district,
            address: company.address,
            website: company.website,
            phone: company.phone,
            email: company.email,
            description: company.description,
            ai_summary: company.ai_summary,
            logo_url: company.logo_url,
            cover_url: company.cover_url,
            video_url: company.video_url,
          },
        },
      });
      showSuccess("Đã lưu thông tin chung thành công!");
    } catch (err: any) {
      setError(err?.message || "Lỗi lưu thông tin.");
    } finally {
      setSaving(false);
    }
  }

  // Save Tab 2: Products
  async function handleSaveProducts() {
    setSaving(true);
    setError(null);
    try {
      await saveProductsFn({
        data: {
          companyId,
          products: products.map((p, idx) => ({
            name: p.name,
            category: p.category || null,
            description: p.description || null,
            moq: p.moq || null,
            lead_time: p.lead_time || null,
            price_range: p.price_range || null,
            catalog_url: p.catalog_url || null,
            image_url: p.image_url || null,
            sort_order: idx,
          })),
        },
      });
      showSuccess(`Đã lưu ${products.length} sản phẩm thành công!`);
    } catch (err: any) {
      setError(err?.message || "Lỗi lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  // Save Tab 3: Contacts
  async function handleSaveContacts() {
    setSaving(true);
    setError(null);
    try {
      await saveContactsFn({
        data: {
          companyId,
          contacts: contacts.map((c) => ({
            contact_type: c.contact_type,
            value: c.value,
            label: c.label || null,
            verified: !!c.verified,
          })),
        },
      });
      showSuccess(`Đã lưu ${contacts.length} kênh liên hệ thành công!`);
    } catch (err: any) {
      setError(err?.message || "Lỗi lưu liên hệ.");
    } finally {
      setSaving(false);
    }
  }

  // Save Tab 4: Certifications
  async function handleSaveCerts() {
    setSaving(true);
    setError(null);
    try {
      await saveCertsFn({
        data: {
          companyId,
          certifications: certifications.map((c, idx) => ({
            name: c.name,
            issuer: c.issuer || null,
            certificate_url: c.certificate_url || null,
            issued_at: c.issued_at || null,
            expires_at: c.expires_at || null,
            verification_status: c.verification_status || "pending",
            sort_order: idx,
          })),
        },
      });
      showSuccess(`Đã lưu ${certifications.length} chứng chỉ thành công!`);
    } catch (err: any) {
      setError(err?.message || "Lỗi lưu chứng chỉ.");
    } finally {
      setSaving(false);
    }
  }

  // Save Tab 5: Gallery
  async function handleSaveGallery() {
    setSaving(true);
    setError(null);
    try {
      await saveGalleryFn({
        data: {
          companyId,
          gallery: gallery.map((g, idx) => ({
            image_url: g.image_url,
            caption: g.caption || null,
            sort_order: idx,
          })),
        },
      });
      showSuccess(`Đã lưu ${gallery.length} ảnh thư viện thành công!`);
    } catch (err: any) {
      setError(err?.message || "Lỗi lưu thư viện ảnh.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ nhà máy…</p>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-2 font-bold text-destructive">Không thể mở trang quản lý</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Link
            to="/dashboard/my-companies"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            ← Quay lại danh sách doanh nghiệp
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1";

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header bar */}
      <div className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <Link to="/dashboard/my-companies" className="hover:underline">Nhà máy của tôi</Link>
              <span>/</span>
              <span className="truncate font-medium text-foreground">{company.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {company.name}
              </h1>
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/company/$slug"
              params={{ slug: company.slug }}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-xs font-semibold hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Xem hồ sơ công khai
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex space-x-1 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "info"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" /> Thông tin chung
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "products"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-4 w-4" /> Sản phẩm ({products.length})
            </button>

            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "contacts"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-4 w-4" /> Liên hệ ({contacts.length})
            </button>

            <button
              onClick={() => setActiveTab("certs")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "certs"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="h-4 w-4" /> Chứng chỉ ({certifications.length})
            </button>

            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "gallery"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4" /> Thư viện ảnh ({gallery.length})
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "leads"
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox className="h-4 w-4" /> Yêu cầu báo giá ({leads.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Notifications */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
        {/* TAB 1: THÔNG TIN CHUNG */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">1. Thông tin cơ bản & Pháp lý</h2>
              <p className="mt-1 text-xs text-muted-foreground">Thông tin chính xuất hiện trên hồ sơ năng lực công khai của nhà máy.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Tên doanh nghiệp / Nhà máy *</label>
                  <input
                    required
                    value={company.name || ""}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Slug URL * (Đường dẫn tĩnh)</label>
                  <input
                    required
                    value={company.slug || ""}
                    onChange={(e) => setCompany({ ...company, slug: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Mã số thuế (MST)</label>
                  <input
                    value={company.tax_code || ""}
                    onChange={(e) => setCompany({ ...company, tax_code: e.target.value })}
                    placeholder="VD: 0312345678"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Người đại diện pháp luật</label>
                  <input
                    value={company.legal_representative || ""}
                    onChange={(e) => setCompany({ ...company, legal_representative: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Ngành nghề chính</label>
                  <select
                    value={company.industry || ""}
                    onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Chọn ngành --</option>
                    {industries.map((ind) => (
                      <option key={ind.slug} value={ind.name}>{ind.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Ngành phụ / Lĩnh vực chi tiết</label>
                  <input
                    value={company.sub_industry || ""}
                    onChange={(e) => setCompany({ ...company, sub_industry: e.target.value })}
                    placeholder="VD: Gia công ép nhựa, Đúc khuôn chính xác"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Năm thành lập</label>
                  <input
                    type="number"
                    value={company.founded_year || ""}
                    onChange={(e) => setCompany({ ...company, founded_year: e.target.value })}
                    placeholder="VD: 2012"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Quy mô lao động</label>
                  <select
                    value={company.employee_range || ""}
                    onChange={(e) => setCompany({ ...company, employee_range: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Chọn quy mô nhân sự --</option>
                    {EMPLOYEE_RANGES.map((r) => (
                      <option key={r} value={r}>{r} nhân sự</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Khoảng doanh thu hàng năm</label>
                  <select
                    value={company.revenue_range || ""}
                    onChange={(e) => setCompany({ ...company, revenue_range: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Chọn khoảng doanh thu --</option>
                    {REVENUE_RANGES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Loại hình doanh nghiệp</label>
                  <select
                    value={company.company_type || ""}
                    onChange={(e) => setCompany({ ...company, company_type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Chọn loại hình --</option>
                    {COMPANY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">2. Địa chỉ & Thông tin liên lạc</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Tỉnh / Thành phố</label>
                  <select
                    value={company.province || ""}
                    onChange={(e) => setCompany({ ...company, province: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Chọn tỉnh thành --</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Quận / Huyện</label>
                  <input
                    value={company.district || ""}
                    onChange={(e) => setCompany({ ...company, district: e.target.value })}
                    placeholder="VD: Dĩ An, Biên Hòa, Bình Chánh"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold">Địa chỉ chi tiết (Nhà xưởng / Văn phòng)</label>
                  <input
                    value={company.address || ""}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    placeholder="VD: Lô A2, Đường số 3, KCN Tân Tạo, Q. Bình Tân, TP.HCM"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Số điện thoại Hotline</label>
                  <input
                    value={company.phone || ""}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    placeholder="VD: 0901 234 567"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Email nhận báo giá (RFQ)</label>
                  <input
                    type="email"
                    value={company.email || ""}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    placeholder="VD: sales@congty.com"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold">Website chính thức</label>
                  <input
                    value={company.website || ""}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    placeholder="https://congty.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">3. Giới thiệu & Media (Logo / Ảnh / Video)</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Tóm tắt ngắn (AI Summary / Slogan)</label>
                  <textarea
                    rows={2}
                    value={company.ai_summary || ""}
                    onChange={(e) => setCompany({ ...company, ai_summary: e.target.value })}
                    placeholder="Tóm tắt năng lực cốt lõi trong 2-3 câu..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Mô tả chi tiết năng lực nhà máy</label>
                  <textarea
                    rows={5}
                    value={company.description || ""}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                    placeholder="Giới thiệu quy trình sản xuất, máy móc thiết bị, sản lượng tháng..."
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Logo URL</label>
                    <input
                      value={company.logo_url || ""}
                      onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                      placeholder="https://.../logo.png"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">Ảnh bìa Cover URL</label>
                    <input
                      value={company.cover_url || ""}
                      onChange={(e) => setCompany({ ...company, cover_url: e.target.value })}
                      placeholder="https://.../banner.jpg"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">Video giới thiệu (YouTube URL)</label>
                    <input
                      value={company.video_url || ""}
                      onChange={(e) => setCompany({ ...company, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi thông tin chung"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SẢN PHẨM & DỊCH VỤ */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Danh mục Sản phẩm & Dịch vụ</h2>
                <p className="text-xs text-muted-foreground">Thêm các sản phẩm chủ lực, số lượng đặt tối thiểu (MOQ), lead time và catalogue.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProducts([
                    {
                      name: "",
                      category: "",
                      moq: "",
                      lead_time: "",
                      price_range: "",
                      catalog_url: "",
                      image_url: "",
                      description: "",
                    },
                    ...products,
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" /> Thêm sản phẩm mới
              </button>
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 text-sm font-semibold">Chưa có sản phẩm nào</h3>
                <p className="mt-1 text-xs text-muted-foreground">Thêm danh mục sản phẩm để khách hàng dễ dàng tìm kiếm và gửi yêu cầu báo giá.</p>
                <button
                  type="button"
                  onClick={() =>
                    setProducts([
                      { name: "Sản phẩm mẫu", category: "Gia công", moq: "500 pcs", lead_time: "15-20 ngày" },
                    ])
                  }
                  className="mt-4 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Tạo sản phẩm đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((p, idx) => (
                  <div key={idx} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="font-semibold text-sm text-foreground">Sản phẩm #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                        className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold">Tên sản phẩm / Dịch vụ *</label>
                        <input
                          required
                          value={p.name || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].name = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="VD: Áo Blouse Y Tế Kháng Khuẩn"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold">Nhóm / Danh mục</label>
                        <input
                          value={p.category || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].category = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="VD: May mặc bảo hộ"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold">MOQ (Số lượng đặt tối thiểu)</label>
                        <input
                          value={p.moq || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].moq = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="VD: 500 cái"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold">Lead Time (Thời gian giao hàng)</label>
                        <input
                          value={p.lead_time || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].lead_time = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="VD: 15-30 ngày"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold">Khoảng giá tham khảo</label>
                        <input
                          value={p.price_range || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].price_range = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="VD: 50.000 - 90.000 đ/cái"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold">Ảnh sản phẩm (URL)</label>
                        <input
                          value={p.image_url || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].image_url = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="https://.../san-pham.jpg"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold">Catalogue PDF / Link Drive</label>
                        <input
                          value={p.catalog_url || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].catalog_url = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="https://.../catalogue.pdf"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-semibold">Mô tả / Thông số kỹ thuật</label>
                        <textarea
                          rows={2}
                          value={p.description || ""}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].description = e.target.value;
                            setProducts(updated);
                          }}
                          placeholder="Quy cách đóng gói, tiêu chuẩn chất lượng, chất liệu..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProducts}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : `Lưu tất cả (${products.length}) sản phẩm`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIÊN HỆ & HOTLINE */}
        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Kênh Liên hệ & Hotline</h2>
                <p className="text-xs text-muted-foreground">Các đầu mối liên hệ của phòng kinh doanh, xuất nhập khẩu hoặc kỹ thuật.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setContacts([
                    ...contacts,
                    { contact_type: "phone", value: "", label: "Hotline Kinh Doanh", verified: true },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" /> Thêm kênh liên hệ
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((c, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
                  <div className="w-36">
                    <select
                      value={c.contact_type || "phone"}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].contact_type = e.target.value;
                        setContacts(updated);
                      }}
                      className={inputClass}
                    >
                      <option value="phone">📞 Điện thoại/Hotline</option>
                      <option value="email">✉️ Email báo giá</option>
                      <option value="zalo">💬 Zalo OA / Hotline</option>
                      <option value="address">📍 Địa chỉ chi nhánh</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <input
                      required
                      value={c.value || ""}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].value = e.target.value;
                        setContacts(updated);
                      }}
                      placeholder="Giá trị liên hệ (VD: 0901 234 567 hoặc sales@domain.com)"
                      className={inputClass}
                    />
                  </div>

                  <div className="w-48">
                    <input
                      value={c.label || ""}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].label = e.target.value;
                        setContacts(updated);
                      }}
                      placeholder="Nhãn (VD: P. Kinh doanh)"
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveContacts}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : `Lưu (${contacts.length}) liên hệ`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHỨNG CHỈ & TIÊU CHUẨN */}
        {activeTab === "certs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Chứng chỉ Quốc tế & Kiểm định (ISO, CE, FDA, SGS...)</h2>
                <p className="text-xs text-muted-foreground">Tải lên các chứng chỉ năng lực để nhận huy hiệu xác thực và tăng độ tin cậy với Buyer.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCertifications([
                    ...certifications,
                    { name: "", issuer: "", certificate_url: "", issued_at: "", expires_at: "", verification_status: "pending" },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" /> Thêm chứng chỉ
              </button>
            </div>

            <div className="space-y-4">
              {certifications.map((c, idx) => (
                <div key={idx} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold text-sm">Chứng chỉ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                      className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Tên chứng chỉ *</label>
                      <input
                        required
                        value={c.name || ""}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].name = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="VD: ISO 9001:2015, FDA, CE"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold">Tổ chức cấp</label>
                      <input
                        value={c.issuer || ""}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].issuer = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="VD: BSI, SGS, TUV"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold">File scan / URL Chứng chỉ</label>
                      <input
                        value={c.certificate_url || ""}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].certificate_url = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="https://.../certificate.pdf"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold">Ngày cấp</label>
                      <input
                        type="date"
                        value={c.issued_at ? c.issued_at.split("T")[0] : ""}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].issued_at = e.target.value;
                          setCertifications(updated);
                        }}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold">Ngày hết hạn</label>
                      <input
                        type="date"
                        value={c.expires_at ? c.expires_at.split("T")[0] : ""}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].expires_at = e.target.value;
                          setCertifications(updated);
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveCerts}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : `Lưu (${certifications.length}) chứng chỉ`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THƯ VIỆN ẢNH NHÀ XƯỞNG */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Thư viện Ảnh Nhà Xưởng & Máy Móc</h2>
                <p className="text-xs text-muted-foreground">Hình ảnh thực tế về chuyền may, máy CNC, khuôn đúc, kho bãi.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setGallery([
                    ...gallery,
                    { image_url: "", caption: "" },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" /> Thêm ảnh
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {gallery.map((g, idx) => (
                <div key={idx} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-semibold text-muted-foreground">Ảnh #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Xóa
                    </button>
                  </div>

                  {g.image_url && (
                    <div className="mb-2 h-40 overflow-hidden rounded-md bg-muted">
                      <img src={g.image_url} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      required
                      value={g.image_url || ""}
                      onChange={(e) => {
                        const updated = [...gallery];
                        updated[idx].image_url = e.target.value;
                        setGallery(updated);
                      }}
                      placeholder="URL ảnh (https://.../xuong.jpg)"
                      className={inputClass}
                    />

                    <input
                      value={g.caption || ""}
                      onChange={(e) => {
                        const updated = [...gallery];
                        updated[idx].caption = e.target.value;
                        setGallery(updated);
                      }}
                      placeholder="Chú thích (VD: Dây chuyền dập kim loại CNC 500 tấn)"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveGallery}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : `Lưu (${gallery.length}) ảnh`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: YÊU CẦU BÁO GIÁ (LEADS) */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Hộp thư Yêu cầu báo giá (RFQ Inbox)</h2>
              <p className="text-xs text-muted-foreground">Tất cả yêu cầu gửi trực tiếp đến nhà máy {company.name}.</p>
            </div>

            {leads.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 text-sm font-semibold">Chưa có yêu cầu báo giá nào</h3>
                <p className="mt-1 text-xs text-muted-foreground">Khi người mua gửi yêu cầu từ trang hồ sơ, thông tin liên hệ và đơn hàng sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((l) => (
                  <div key={l.id} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-brand/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-base font-bold text-foreground">{l.name}</div>
                        <div className="text-xs font-medium text-brand">{l.company}</div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(l.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {l.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-foreground" />
                          <a href={`mailto:${l.email}`} className="text-foreground hover:underline font-medium">{l.email}</a>
                        </div>
                      )}
                      {l.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-foreground" />
                          <a href={`tel:${l.phone}`} className="text-foreground hover:underline font-medium">{l.phone}</a>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                      {l.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
