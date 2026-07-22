import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

import { EMPLOYEE_RANGES, INDUSTRIES, PROVINCES } from "@/lib/factory";
import { Building2, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/submit-company")({
  head: () => ({
    meta: [
      { title: "Gửi doanh nghiệp | VNSupplier" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmitCompanyPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự").max(200),
  slug: z
    .string()
    .trim()
    .min(2, "Slug tối thiểu 2 ký tự")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu -"),
  province: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  sub_industry: z.string().max(120).optional().nullable(),
  employee_range: z.string().optional().nullable(),
  founded_year: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : Number(v))),
  website: z.string().url("URL không hợp lệ").max(255).optional().or(z.literal("")),
  logo_url: z.string().url("URL logo không hợp lệ").max(500).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  capabilities: z.string().max(500).optional().or(z.literal("")),
  revenue_range: z.string().optional().or(z.literal("")),
  company_type: z.string().optional().or(z.literal("")),
  cover_url: z.string().url("URL banner không hợp lệ").max(500).optional().or(z.literal("")),
  video_url: z.string().url("URL video không hợp lệ").max(500).optional().or(z.literal("")),
  certifications: z.string().max(2000).optional().or(z.literal("")),
  gallery_urls: z.string().max(3000).optional().or(z.literal("")),
  faqs: z.string().max(5000).optional().or(z.literal("")),
  export_markets: z.string().max(500).optional().or(z.literal("")),
  stock_exchange: z.enum(["", "HOSE", "HNX", "UPCOM", "Khác"]).optional(),
  stock_ticker: z
    .string()
    .trim()
    .max(10)
    .regex(/^[A-Z0-9]{2,10}$/, "Mã chứng khoán 2–10 ký tự, chỉ chữ IN HOA và số")
    .optional()
    .or(z.literal("")),
}).refine((v) => !v.stock_ticker || !!v.stock_exchange, {
  message: "Vui lòng chọn sàn niêm yết",
  path: ["stock_exchange"],
});


function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function SubmitCompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({
    name: "", slug: "", province: "", industry: "", sub_industry: "",
    employee_range: "", founded_year: "", website: "", phone: "", email: "",
    address: "", description: "", capabilities: "",
    revenue_range: "", company_type: "", cover_url: "", video_url: "",
    certifications: "", gallery_urls: "", faqs: "",
    stock_exchange: "", stock_ticker: "", logo_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);

  const set = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === "name" && !f.slug ? { slug: slugify(v) } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const iss of parsed.error.issues) errs[iss.path.join(".")] = iss.message;
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setSubmitting(false); return; }

    const d = parsed.data;
    const caps = (d.capabilities || "").split(",").map((s) => s.trim()).filter(Boolean);
    const gallery = (d.gallery_urls || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const certs = (d.certifications || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const [name, issuer, year] = line.split("|").map((s) => s.trim());
      return { name, ...(issuer ? { issuer } : {}), ...(year ? { year } : {}) };
    });
    const faqs = (d.faqs || "").split(/\n\n+/).map((block) => {
      const [q, ...a] = block.split("\n");
      return { q: (q ?? "").trim(), a: a.join("\n").trim() };
    }).filter((f) => f.q && f.a);
    const { error } = await supabase.from("companies").insert({
      name: d.name,
      slug: d.slug,
      province: d.province || null,
      industry: d.industry || null,
      sub_industry: d.sub_industry || null,
      employee_range: d.employee_range || null,
      founded_year: d.founded_year ?? null,
      revenue_range: d.revenue_range || null,
      company_type: d.company_type || null,
      website: d.website || null,
      logo_url: d.logo_url || null,
      cover_url: d.cover_url || null,
      video_url: d.video_url || null,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      description: d.description || null,
      capabilities: caps,
      certifications: certs,
      gallery_urls: gallery,
      faqs: faqs,
      stock_exchange: d.stock_exchange || null,
      stock_ticker: d.stock_ticker ? d.stock_ticker.toUpperCase() : null,
      verified: false,
      featured: false,
      source: "user",
      status: "pending",
      submitted_by: uid,
    });

    setSubmitting(false);
    if (error) {
      setErrors({ _root: error.message.includes("companies_slug") ? "Slug đã tồn tại, vui lòng chọn slug khác." : error.message });
      return;
    }
    setOk(true);
    setTimeout(() => navigate({ to: "/dashboard/my-companies" }), 1200);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gửi doanh nghiệp của bạn</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hồ sơ sẽ ở trạng thái <b>Chờ duyệt</b> và hiển thị công khai sau khi Admin phê duyệt.
            </p>
          </div>
        </div>

        {ok ? (
          <div className="rounded-lg border bg-success/5 p-6 text-center">
            <p className="text-sm">Đã gửi thành công. Đang chuyển đến trang quản lý…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
            <F label="Tên doanh nghiệp *" err={errors.name}>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </F>
            <F label="Slug (URL) *" err={errors.slug} hint="chỉ chữ thường, số, dấu -">
              <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
            </F>
            <F label="Tỉnh / TP">
              <select className="input" value={form.province} onChange={(e) => set("province", e.target.value)}>
                <option value="">— Chọn —</option>
                {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
              </select>
            </F>
            <F label="Ngành">
              <select className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                <option value="">— Chọn —</option>
                {INDUSTRIES.map((i) => <option key={i.slug} value={i.name}>{i.name}</option>)}
              </select>
            </F>
            <F label="Ngành phụ">
              <input className="input" value={form.sub_industry} onChange={(e) => set("sub_industry", e.target.value)} />
            </F>
            <F label="Quy mô nhân sự">
              <select className="input" value={form.employee_range} onChange={(e) => set("employee_range", e.target.value)}>
                <option value="">— Chọn —</option>
                {EMPLOYEE_RANGES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </F>
            <F label="Năm thành lập">
              <input type="number" className="input" value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)} />
            </F>
            <F label="Website" err={errors.website}>
              <input className="input" placeholder="https://..." value={form.website} onChange={(e) => set("website", e.target.value)} />
            </F>
            <F label="Logo URL" err={errors.logo_url} full hint="Dán URL ảnh logo (PNG/JPG/SVG). Nên vuông, nền trong suốt.">
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo preview" className="h-12 w-12 rounded-md border bg-background object-contain p-1" />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-md border bg-muted text-[10px] text-muted-foreground">Logo</div>
                )}
                <input className="input" placeholder="https://.../logo.png" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
              </div>
            </F>
            <F label="Điện thoại">
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </F>
            <F label="Email" err={errors.email}>
              <input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </F>
            <F label="Địa chỉ" full>
              <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </F>
            <F label="Mô tả" full err={errors.description}>
              <textarea rows={4} className="input" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </F>
            <F label="Năng lực (cách nhau bằng dấu phẩy)" full hint="VD: CNC 5-trục, Ép phun, ISO 9001">
              <input className="input" value={form.capabilities} onChange={(e) => set("capabilities", e.target.value)} />
            </F>
            <F label="Doanh thu năm">
              <select className="input" value={form.revenue_range} onChange={(e) => set("revenue_range", e.target.value)}>
                <option value="">— Chọn —</option>
                {["< 1 tỷ","1-10 tỷ","10-50 tỷ","50-200 tỷ","200 tỷ - 1000 tỷ","> 1000 tỷ"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </F>
            <F label="Loại hình doanh nghiệp">
              <select className="input" value={form.company_type} onChange={(e) => set("company_type", e.target.value)}>
                <option value="">— Chọn —</option>
                {["TNHH","Cổ phần","Cổ phần niêm yết","Doanh nghiệp tư nhân","FDI","Nhà nước","Hợp tác xã"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </F>
            <F label="Banner/Cover URL" full err={errors.cover_url} hint="Ảnh banner nằm ngang, khuyến nghị 1600×400px">
              <input className="input" placeholder="https://.../banner.jpg" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </F>
            <F label="Video giới thiệu (YouTube/Vimeo)" full err={errors.video_url}>
              <input className="input" placeholder="https://youtube.com/watch?v=..." value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
            </F>
            <F label="Chứng nhận" full hint="Mỗi dòng: Tên chứng nhận | Đơn vị cấp | Năm. VD: ISO 9001:2015 | BSI | 2023">
              <textarea rows={3} className="input" value={form.certifications} onChange={(e) => set("certifications", e.target.value)} />
            </F>
            <F label="Thư viện ảnh nhà máy" full hint="Mỗi dòng 1 URL ảnh">
              <textarea rows={3} className="input" value={form.gallery_urls} onChange={(e) => set("gallery_urls", e.target.value)} placeholder="https://.../factory-1.jpg" />
            </F>
            <F label="Câu hỏi thường gặp (FAQ)" full hint="Câu hỏi ở dòng đầu, trả lời ở dòng sau; cách nhau bằng 1 dòng trống">
              <textarea rows={5} className="input" value={form.faqs} onChange={(e) => set("faqs", e.target.value)} placeholder={"MOQ tối thiểu là bao nhiêu?\nMOQ 500-1000 sản phẩm tuỳ loại.\n\nThời gian sản xuất trung bình?\nKhoảng 15-30 ngày làm việc."} />
            </F>

            <F label="Sàn niêm yết" err={errors.stock_exchange} hint="Bỏ trống nếu chưa niêm yết">
              <select className="input" value={form.stock_exchange} onChange={(e) => set("stock_exchange", e.target.value)}>
                <option value="">— Chưa niêm yết —</option>
                <option value="HOSE">HOSE</option>
                <option value="HNX">HNX</option>
                <option value="UPCOM">UPCOM</option>
                <option value="Khác">Khác</option>
              </select>
            </F>
            <F label="Mã chứng khoán" err={errors.stock_ticker} hint="VD: VNM, HPG, FPT">
              <input className="input" style={{ textTransform: "uppercase" }} maxLength={10} value={form.stock_ticker} onChange={(e) => set("stock_ticker", e.target.value.toUpperCase())} />
            </F>

            {errors._root && (
              <div className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {errors._root}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Đang gửi…" : "Gửi để duyệt"}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.5rem;padding:.55rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--color-brand)}`}</style>
    </div>
  );
}

function F({ label, children, full, err, hint }: { label: string; children: React.ReactNode; full?: boolean; err?: string; hint?: string }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && !err && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {err && <p className="mt-1 text-[11px] text-destructive">{err}</p>}
    </div>
  );
}
