import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EMPLOYEE_RANGES, INDUSTRIES, PROVINCES } from "@/lib/factory";
import { Check, Pencil, Plus, Trash2, X, XCircle } from "lucide-react";

type Row = {
  id: string; slug: string; name: string; province: string | null; industry: string | null;
  sub_industry: string | null; employee_range: string | null; founded_year: number | null;
  website: string | null; phone: string | null; email: string | null; address: string | null;
  logo_url: string | null;
  description: string | null; ai_summary: string | null; capabilities: unknown;
  verified: boolean; featured: boolean;
  stock_exchange: string | null; stock_ticker: string | null;
  status: string | null; submitted_by: string | null; rejection_reason: string | null;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Quản lý | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!r) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Row> | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"pending" | "all" | "rejected">("pending");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("updated_at", { ascending: false });
    setRows((data ?? []) as Row[]); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit || !edit.name || !edit.slug) return;
    const payload: any = {
      name: edit.name, slug: edit.slug, province: edit.province ?? null, industry: edit.industry ?? null,
      sub_industry: edit.sub_industry ?? null, employee_range: edit.employee_range ?? null,
      founded_year: edit.founded_year ? Number(edit.founded_year) : null,
      website: edit.website || null, phone: edit.phone || null, email: edit.email || null,
      address: edit.address || null, description: edit.description || null, ai_summary: edit.ai_summary || null,
      capabilities: typeof edit.capabilities === "string" ? (edit.capabilities as string).split(",").map((s) => s.trim()).filter(Boolean) : (edit.capabilities ?? []),
      verified: !!edit.verified, featured: !!edit.featured,
      stock_exchange: edit.stock_exchange || null,
      stock_ticker: edit.stock_ticker ? String(edit.stock_ticker).toUpperCase() : null,
      logo_url: edit.logo_url || null,
    };
    if (edit.id) {
      await supabase.from("companies").update(payload).eq("id", edit.id);
    } else {
      await supabase.from("companies").insert({ ...payload, status: "approved", source: "admin" });
    }
    setEdit(null); load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa nhà máy này?")) return;
    await supabase.from("companies").delete().eq("id", id); load();
  }

  async function approve(id: string) {
    await supabase.from("companies").update({ status: "approved", rejection_reason: null }).eq("id", id);
    load();
  }
  async function reject(id: string) {
    const reason = prompt("Lý do từ chối (tuỳ chọn):") ?? "";
    await supabase.from("companies").update({ status: "rejected", rejection_reason: reason || null }).eq("id", id);
    load();
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const filtered = rows
    .filter((r) => tab === "all" ? true : r.status === tab)
    .filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý nhà máy</h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} nhà máy trong hệ thống · <b className="text-brand">{pendingCount} chờ duyệt</b>
            </p>
          </div>
          <button onClick={() => setEdit({ verified: false, featured: false, capabilities: [] })}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Thêm mới
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["pending", "all", "rejected"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md border px-3 py-1.5 text-sm ${tab === t ? "border-brand bg-brand-soft text-brand" : "hover:bg-accent"}`}>
              {t === "pending" ? `Chờ duyệt${pendingCount ? ` (${pendingCount})` : ""}` : t === "rejected" ? "Đã từ chối" : "Tất cả"}
            </button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc slug…"
            className="ml-auto w-full max-w-xs rounded-md border bg-card px-3 py-1.5 text-sm outline-none" />
        </div>

        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Tên</th><th className="p-3">Slug</th><th className="p-3">Tỉnh</th>
                <th className="p-3">Ngành</th><th className="p-3">Trạng thái</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Đang tải…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Không có mục nào.</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
                  <td className="p-3">{r.province}</td>
                  <td className="p-3">{r.industry}</td>
                  <td className="p-3">
                    {r.status === "pending" && <span className="mr-1 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">Chờ duyệt</span>}
                    {r.status === "rejected" && <span className="mr-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">Từ chối</span>}
                    {r.status === "approved" && r.verified && <span className="mr-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success">Verified</span>}
                    {r.status === "approved" && !r.verified && <span className="mr-1 rounded bg-secondary px-1.5 py-0.5 text-[10px]">Đã duyệt</span>}
                    {r.featured && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">Featured</span>}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {r.status === "pending" && (
                      <>
                        <button title="Duyệt" onClick={() => approve(r.id)} className="mr-1 rounded p-1.5 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                        <button title="Từ chối" onClick={() => reject(r.id)} className="mr-1 rounded p-1.5 text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></button>
                      </>
                    )}
                    <button title="Sửa" onClick={() => setEdit(r)} className="mr-1 rounded p-1.5 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                    <button title="Xoá" onClick={() => remove(r.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="mt-8 w-full max-w-2xl rounded-lg border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{edit.id ? "Sửa nhà máy" : "Thêm nhà máy"}</h2>
              <button onClick={() => setEdit(null)} className="rounded p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Tên *"><input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="input" /></Field>
              <Field label="Slug *"><input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="input" /></Field>
              <Field label="Tỉnh/TP">
                <select value={edit.province ?? ""} onChange={(e) => setEdit({ ...edit, province: e.target.value || null })} className="input">
                  <option value="">—</option>
                  {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Ngành">
                <select value={edit.industry ?? ""} onChange={(e) => setEdit({ ...edit, industry: e.target.value || null })} className="input">
                  <option value="">—</option>
                  {INDUSTRIES.map((i) => <option key={i.slug} value={i.name}>{i.name}</option>)}
                </select>
              </Field>
              <Field label="Ngành phụ"><input value={edit.sub_industry ?? ""} onChange={(e) => setEdit({ ...edit, sub_industry: e.target.value })} className="input" /></Field>
              <Field label="Số lao động">
                <select value={edit.employee_range ?? ""} onChange={(e) => setEdit({ ...edit, employee_range: e.target.value || null })} className="input">
                  <option value="">—</option>
                  {EMPLOYEE_RANGES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Năm thành lập"><input type="number" value={edit.founded_year ?? ""} onChange={(e) => setEdit({ ...edit, founded_year: e.target.value ? Number(e.target.value) : null })} className="input" /></Field>
              <Field label="Website"><input value={edit.website ?? ""} onChange={(e) => setEdit({ ...edit, website: e.target.value })} className="input" /></Field>
              <Field label="Logo URL" full>
                <div className="flex items-center gap-3">
                  {edit.logo_url ? (
                    <img src={edit.logo_url} alt="Logo preview" className="h-12 w-12 rounded-md border bg-background object-contain p-1" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-md border bg-muted text-[10px] text-muted-foreground">Logo</div>
                  )}
                  <input value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} className="input" placeholder="https://.../logo.png" />
                </div>
              </Field>
              <Field label="Phone"><input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className="input" /></Field>
              <Field label="Email"><input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className="input" /></Field>
              <Field label="Địa chỉ" full><input value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} className="input" /></Field>
              <Field label="Mô tả" full><textarea rows={3} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="input" /></Field>
              <Field label="AI Summary" full><textarea rows={3} value={edit.ai_summary ?? ""} onChange={(e) => setEdit({ ...edit, ai_summary: e.target.value })} className="input" /></Field>
              <Field label="Năng lực (cách nhau bằng dấu phẩy)" full>
                <input value={Array.isArray(edit.capabilities) ? (edit.capabilities as string[]).join(", ") : String(edit.capabilities ?? "")}
                  onChange={(e) => setEdit({ ...edit, capabilities: e.target.value as any })} className="input" />
              </Field>
              <Field label="Sàn niêm yết">
                <select value={edit.stock_exchange ?? ""} onChange={(e) => setEdit({ ...edit, stock_exchange: e.target.value || null })} className="input">
                  <option value="">— Chưa niêm yết —</option>
                  <option value="HOSE">HOSE</option>
                  <option value="HNX">HNX</option>
                  <option value="UPCOM">UPCOM</option>
                  <option value="Khác">Khác</option>
                </select>
              </Field>
              <Field label="Mã chứng khoán">
                <input value={edit.stock_ticker ?? ""} maxLength={10} style={{ textTransform: "uppercase" }} onChange={(e) => setEdit({ ...edit, stock_ticker: e.target.value.toUpperCase() })} className="input" placeholder="VD: VNM" />
              </Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.verified} onChange={(e) => setEdit({ ...edit, verified: e.target.checked })} /> Đã xác thực</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} /> Nổi bật</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Hủy</button>
              <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Lưu</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.375rem;padding:.5rem .75rem;font-size:.875rem;outline:none}`}</style>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
