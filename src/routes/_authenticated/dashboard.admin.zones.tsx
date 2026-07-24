import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ZoneKind, ZoneRow } from "@/lib/zones";
import { PROVINCES } from "@/lib/factory";

export const Route = createFileRoute("/_authenticated/dashboard/admin/zones")({
  head: () => ({ meta: [{ title: "KCN & CCN | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminZonesPage,
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

type ZoneForm = Partial<ZoneRow> & { name: string; kind: ZoneKind };
const empty: ZoneForm = {
  kind: "kcn",
  name: "",
  slug: "",
  province: "",
  district: "",
  address: "",
  developer: "",
  established_year: null,
  area_ha: null,
  occupancy_percent: null,
  land_price_usd_m2_year: null,
  industries: [],
  banner_url: "",
  ai_summary: "",
  description: "",
  highlights: [],
  contact_phone: "",
  contact_email: "",
  website_url: "",
  latitude: null,
  longitude: null,
  faqs: [],
  status: "draft",
  is_featured: false,
};

function AdminZonesPage() {
  const [rows, setRows] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<"" | ZoneKind>("");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "approved">("");
  const [selected, setSelected] = useState<ZoneForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("industrial_zones").select("*").order("updated_at", { ascending: false }).limit(200);
    if (kindFilter) q = q.eq("kind", kindFilter);
    if (statusFilter) q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) setErr(error.message);
    setRows((data ?? []) as ZoneRow[]);
    setLoading(false);
  }, [kindFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setSelected({ ...empty }); setSlugTouched(false); setErr(null); };
  const startEdit = (r: ZoneRow) => {
    setSelected({
      ...r,
      industries: r.industries ?? [],
      highlights: r.highlights ?? [],
      faqs: Array.isArray(r.faqs) ? r.faqs : [],
    } as ZoneForm);
    setSlugTouched(true);
    setErr(null);
  };

  const save = async () => {
    if (!selected) return;
    if (!selected.name?.trim()) { setErr("Tên là bắt buộc"); return; }
    setSaving(true); setErr(null);
    try {
      const payload = {
        kind: selected.kind,
        name: selected.name.trim(),
        slug: selected.slug?.trim() || undefined,
        province: selected.province || null,
        district: selected.district || null,
        address: selected.address || null,
        developer: selected.developer || null,
        established_year: selected.established_year ?? null,
        area_ha: selected.area_ha ?? null,
        occupancy_percent: selected.occupancy_percent ?? null,
        land_price_usd_m2_year: selected.land_price_usd_m2_year ?? null,
        industries: selected.industries ?? [],
        highlights: selected.highlights ?? [],
        banner_url: selected.banner_url || null,
        ai_summary: selected.ai_summary || null,
        description: selected.description || null,
        contact_phone: selected.contact_phone || null,
        contact_email: selected.contact_email || null,
        website_url: selected.website_url || null,
        latitude: selected.latitude ?? null,
        longitude: selected.longitude ?? null,
        faqs: (selected.faqs as unknown) ?? [],
        status: selected.status ?? "draft",
        is_featured: !!selected.is_featured,
      };
      if (selected.id) {
        const { error } = await supabase.from("industrial_zones").update(payload).eq("id", selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("industrial_zones").insert(payload as never);
        if (error) throw error;
      }
      setSelected(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Xoá KCN/CCN này?")) return;
    const { error } = await supabase.from("industrial_zones").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await load();
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("industrial_zones").update({ status: "approved" }).eq("id", id);
    if (error) { alert(error.message); return; }
    await load();
  };

  const setField = <K extends keyof ZoneForm>(k: K, v: ZoneForm[K]) => setSelected((s) => s ? { ...s, [k]: v } : s);
  const arrField = (k: "industries" | "highlights") => (selected?.[k] as string[] | undefined ?? []).join(", ");
  const setArrField = (k: "industries" | "highlights", v: string) =>
    setField(k, v.split(",").map((s) => s.trim()).filter(Boolean) as never);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">KCN & CCN</h1>
          <p className="text-sm text-muted-foreground">Quản lý Khu / Cụm Công Nghiệp, duyệt hiển thị công khai.</p>
        </div>
        <button onClick={startNew} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">+ Thêm mới</button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "" | ZoneKind)} className="rounded-md border border-border bg-background px-2 py-1 text-sm">
          <option value="">Tất cả loại</option>
          <option value="kcn">KCN</option>
          <option value="ccn">CCN</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "draft" | "approved")} className="rounded-md border border-border bg-background px-2 py-1 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="approved">Đã duyệt</option>
        </select>
      </div>

      {err && <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Tên</th>
              <th className="px-3 py-2 text-left">Loại</th>
              <th className="px-3 py-2 text-left">Tỉnh</th>
              <th className="px-3 py-2 text-left">DT (ha)</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Đang tải…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chưa có dữ liệu.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">/{r.kind === "kcn" ? "khu-cong-nghiep" : "cum-cong-nghiep"}/{r.slug}</div>
                </td>
                <td className="px-3 py-2 uppercase">{r.kind}</td>
                <td className="px-3 py-2">{r.province ?? "—"}</td>
                <td className="px-3 py-2">{r.area_ha ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.status === "approved" ? "bg-green-500/15 text-green-500" : "bg-amber-500/15 text-amber-500"}`}>
                    {r.status === "approved" ? "Đã duyệt" : "Nháp"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {r.status === "draft" && <button onClick={() => approve(r.id)} className="mr-2 text-xs text-brand hover:underline">Duyệt</button>}
                  <button onClick={() => startEdit(r)} className="mr-2 text-xs hover:underline">Sửa</button>
                  <button onClick={() => remove(r.id)} className="text-xs text-destructive hover:underline">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selected.id ? "Sửa" : "Thêm"} {selected.kind === "kcn" ? "KCN" : "CCN"}</h2>
              <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Loại">
                <select value={selected.kind} onChange={(e) => setField("kind", e.target.value as ZoneKind)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm">
                  <option value="kcn">KCN — Khu Công Nghiệp</option>
                  <option value="ccn">CCN — Cụm Công Nghiệp</option>
                </select>
              </Field>
              <Field label="Tên *">
                <input value={selected.name} onChange={(e) => {
                  const v = e.target.value;
                  setField("name", v);
                  if (!slugTouched) setField("slug", slugify(v));
                }} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" />
              </Field>
              <Field label="Slug">
                <input value={selected.slug ?? ""} onChange={(e) => { setSlugTouched(true); setField("slug", e.target.value); }} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" placeholder="tu-dong-neu-de-trong" />
              </Field>
              <Field label="Tỉnh/thành">
                <select value={selected.province ?? ""} onChange={(e) => setField("province", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm">
                  <option value="">—</option>
                  {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Huyện/quận"><input value={selected.district ?? ""} onChange={(e) => setField("district", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Địa chỉ"><input value={selected.address ?? ""} onChange={(e) => setField("address", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Chủ đầu tư"><input value={selected.developer ?? ""} onChange={(e) => setField("developer", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Năm hoạt động"><input type="number" value={selected.established_year ?? ""} onChange={(e) => setField("established_year", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Diện tích (ha)"><input type="number" step="0.1" value={selected.area_ha ?? ""} onChange={(e) => setField("area_ha", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Lấp đầy (%)"><input type="number" value={selected.occupancy_percent ?? ""} onChange={(e) => setField("occupancy_percent", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Giá thuê (USD/m²)"><input type="number" step="0.1" value={selected.land_price_usd_m2_year ?? ""} onChange={(e) => setField("land_price_usd_m2_year", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Banner URL"><input value={selected.banner_url ?? ""} onChange={(e) => setField("banner_url", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" placeholder="https://..." /></Field>
              <Field label="Ngành ưu tiên (phân cách bằng dấu phẩy)"><input value={arrField("industries")} onChange={(e) => setArrField("industries", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Điểm nổi bật (phân cách bằng dấu phẩy)"><input value={arrField("highlights")} onChange={(e) => setArrField("highlights", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Điện thoại"><input value={selected.contact_phone ?? ""} onChange={(e) => setField("contact_phone", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Email"><input value={selected.contact_email ?? ""} onChange={(e) => setField("contact_email", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Website"><input value={selected.website_url ?? ""} onChange={(e) => setField("website_url", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Vĩ độ (lat)"><input type="number" step="0.000001" value={selected.latitude ?? ""} onChange={(e) => setField("latitude", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Kinh độ (lng)"><input type="number" step="0.000001" value={selected.longitude ?? ""} onChange={(e) => setField("longitude", e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" /></Field>
              <Field label="Trạng thái">
                <select value={selected.status ?? "draft"} onChange={(e) => setField("status", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm">
                  <option value="draft">Nháp</option>
                  <option value="approved">Đã duyệt</option>
                </select>
              </Field>
              <Field label="Nổi bật">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!selected.is_featured} onChange={(e) => setField("is_featured", e.target.checked)} />
                  Đánh dấu nổi bật
                </label>
              </Field>
            </div>

            <div className="mt-3 grid gap-3">
              <Field label="Tóm tắt ngắn (AI summary — dùng cho meta description)">
                <textarea rows={2} value={selected.ai_summary ?? ""} onChange={(e) => setField("ai_summary", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" />
              </Field>
              <Field label="Mô tả chi tiết">
                <textarea rows={6} value={selected.description ?? ""} onChange={(e) => setField("description", e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm" />
              </Field>
              <Field label="FAQs (JSON: [{&quot;q&quot;:&quot;…&quot;,&quot;a&quot;:&quot;…&quot;}])">
                <textarea
                  rows={4}
                  defaultValue={JSON.stringify(selected.faqs ?? [], null, 2)}
                  onBlur={(e) => {
                    try {
                      const v = JSON.parse(e.target.value || "[]");
                      setField("faqs", v);
                      setErr(null);
                    } catch { setErr("FAQs không phải JSON hợp lệ"); }
                  }}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                />
              </Field>
            </div>

            {err && <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">Huỷ</button>
              <button onClick={save} disabled={saving} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50">
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
