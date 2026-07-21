import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EMPLOYEE_RANGES, INDUSTRIES, PROVINCES } from "@/lib/factory";
import { Building2, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/submit-company")({
  head: () => ({
    meta: [
      { title: "Gửi doanh nghiệp | FactoryHub" },
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
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  capabilities: z.string().max(500).optional().or(z.literal("")),
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
    stock_exchange: "", stock_ticker: "",
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
    const { error } = await supabase.from("companies").insert({
      name: d.name,
      slug: d.slug,
      province: d.province || null,
      industry: d.industry || null,
      sub_industry: d.sub_industry || null,
      employee_range: d.employee_range || null,
      founded_year: d.founded_year ?? null,
      website: d.website || null,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      description: d.description || null,
      capabilities: caps,
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
      <SiteHeader />
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
      <SiteFooter />
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
