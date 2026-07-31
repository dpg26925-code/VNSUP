import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save } from "lucide-react";

type FieldDef = { key: string; label: string; type?: "text" | "textarea" | "number" | "date" | "select"; options?: string[]; placeholder?: string };

type SectionDef = {
  table: "products" | "certifications" | "company_gallery" | "company_videos" | "company_faqs" | "company_export_markets";
  title: string;
  fields: FieldDef[];
};

const SECTIONS: SectionDef[] = [
  {
    table: "products",
    title: "Sản phẩm & dịch vụ",
    fields: [
      { key: "name", label: "Tên sản phẩm", placeholder: "Áo blouse y tế" },
      { key: "category", label: "Nhóm" },
      { key: "moq", label: "MOQ", placeholder: "1.000 cái" },
      { key: "lead_time", label: "Lead time", placeholder: "15-30 ngày" },
      { key: "price_range", label: "Khoảng giá", placeholder: "2-5 USD/cái" },
      { key: "image_url", label: "Ảnh (URL)" },
      { key: "catalog_url", label: "Catalogue (URL)" },
      { key: "description", label: "Mô tả", type: "textarea" },
    ],
  },
  {
    table: "certifications",
    title: "Chứng chỉ",
    fields: [
      { key: "name", label: "Tên chứng chỉ", placeholder: "ISO 9001:2015" },
      { key: "issuer", label: "Đơn vị cấp", placeholder: "BSI" },
      { key: "issued_at", label: "Ngày cấp", type: "date" },
      { key: "expires_at", label: "Hết hạn", type: "date" },
      { key: "certificate_url", label: "File chứng chỉ (URL)" },
      { key: "verification_status", label: "Trạng thái", type: "select", options: ["pending", "verified", "rejected"] },
    ],
  },
  {
    table: "company_gallery",
    title: "Thư viện ảnh",
    fields: [
      { key: "image_url", label: "Ảnh (URL)" },
      { key: "caption", label: "Chú thích" },
    ],
  },
  {
    table: "company_videos",
    title: "Video",
    fields: [
      { key: "video_url", label: "Video (YouTube/Vimeo/URL)" },
      { key: "title", label: "Tiêu đề" },
      { key: "thumbnail_url", label: "Ảnh thumbnail (URL)" },
    ],
  },
  {
    table: "company_faqs",
    title: "Câu hỏi thường gặp",
    fields: [
      { key: "question", label: "Câu hỏi" },
      { key: "answer", label: "Trả lời", type: "textarea" },
    ],
  },
  {
    table: "company_export_markets",
    title: "Thị trường xuất khẩu",
    fields: [
      { key: "country", label: "Thị trường", placeholder: "Nhật Bản" },
      { key: "share_percent", label: "Tỷ trọng (%)", type: "number" },
      { key: "note", label: "Ghi chú" },
    ],
  },
];

type AnyRow = Record<string, unknown> & { id?: string };

export function CompanySectionsEditor({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-4">
      {SECTIONS.map((s) => (
        <SectionEditor key={s.table} def={s} companyId={companyId} />
      ))}
    </div>
  );
}

function SectionEditor({ def, companyId }: { def: SectionDef; companyId: string }) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from(def.table).select("*").eq("company_id", companyId).order("sort_order");
    if (error) setErr(error.message);
    setRows((data ?? []) as AnyRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [companyId, def.table]);

  function addDraft() {
    setRows((r) => [...r, { _draft: true, sort_order: r.length }]);
  }

  async function saveRow(idx: number) {
    setErr(null); setBusy(true);
    const row = rows[idx];
    const payload: Record<string, unknown> = { company_id: companyId, sort_order: idx };
    for (const f of def.fields) {
      const v = row[f.key];
      payload[f.key] = v === "" || v === undefined ? null : f.type === "number" ? Number(v) : v;
    }
    const res = row.id
      ? await supabase.from(def.table).update(payload).eq("id", row.id as string)
      : await supabase.from(def.table).insert(payload);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    await load();
  }

  async function removeRow(idx: number) {
    const row = rows[idx];
    if (!row.id) { setRows((r) => r.filter((_, i) => i !== idx)); return; }
    if (!confirm("Xoá mục này?")) return;
    setBusy(true);
    const { error } = await supabase.from(def.table).delete().eq("id", row.id as string);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    await load();
  }

  function setField(idx: number, key: string, value: string) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  }

  return (
    <details className="rounded-lg border bg-card">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">
        <span>{def.title}</span>
        <span className="text-xs font-normal text-muted-foreground">{loading ? "…" : `${rows.length} mục`}</span>
      </summary>
      <div className="space-y-3 border-t p-4">
        {err && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">{err}</div>}
        {rows.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">Chưa có mục nào. Bấm “Thêm” để bắt đầu.</p>
        )}
        {rows.map((row, idx) => (
          <div key={(row.id as string) ?? `draft-${idx}`} className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-2">
            {def.fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea rows={2} value={(row[f.key] as string) ?? ""} placeholder={f.placeholder} onChange={(e) => setField(idx, f.key, e.target.value)} className="input" />
                ) : f.type === "select" ? (
                  <select value={(row[f.key] as string) ?? ""} onChange={(e) => setField(idx, f.key, e.target.value)} className="input">
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={(row[f.key] as string) ?? ""} placeholder={f.placeholder} onChange={(e) => setField(idx, f.key, e.target.value)} className="input" />
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 md:col-span-2">
              <button type="button" disabled={busy} onClick={() => saveRow(idx)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                <Save className="h-3.5 w-3.5" />Lưu mục
              </button>
              <button type="button" disabled={busy} onClick={() => removeRow(idx)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60">
                <Trash2 className="h-3.5 w-3.5" />Xoá
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addDraft} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
          <Plus className="h-3.5 w-3.5" />Thêm {def.title.toLowerCase()}
        </button>
      </div>
    </details>
  );
}
