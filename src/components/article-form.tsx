import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";

export type ArticleFormValues = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  tags: string[];
  cover_image: string | null;
  og_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: "draft" | "pending" | "published" | "archived";
};

type Category = { id: string; name: string; slug: string };

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export function ArticleForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<ArticleFormValues>;
  onSubmit: (values: ArticleFormValues) => Promise<void>;
}) {
  const [v, setV] = useState<ArticleFormValues>({
    title: "", slug: "", excerpt: "", content: "", category: null, tags: [],
    cover_image: "", og_image: "", meta_title: "", meta_description: "", status: "draft",
    ...(initial ?? {}),
  } as ArticleFormValues);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi<{ data: Category[] }>("/categories").then((r) => setCats(r.data ?? [])).catch(() => {});
  }, []);

  function set<K extends keyof ArticleFormValues>(k: K, val: ArticleFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const payload: ArticleFormValues = {
        ...v,
        slug: v.slug || slugify(v.title),
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        meta_title: v.meta_title || v.title || null,
        meta_description: v.meta_description || v.excerpt || null,
      };
      await onSubmit(payload);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
      <F label="Tiêu đề *" full>
        <input required className="input" value={v.title}
          onChange={(e) => { const t = e.target.value; setV((p) => ({ ...p, title: t, slug: p.slug || slugify(t) })); }} />
      </F>
      <F label="Slug *" hint="a-z, 0-9, dấu -">
        <input required className="input" value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
      </F>
      <F label="Chuyên mục">
        <select className="input" value={v.category ?? ""} onChange={(e) => set("category", e.target.value || null)}>
          <option value="">— Không —</option>
          {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </F>
      <F label="Tóm tắt" full>
        <textarea rows={2} className="input" value={v.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
      </F>
      <F label="Nội dung (Markdown/HTML)" full>
        <textarea rows={14} className="input font-mono text-sm" value={v.content} onChange={(e) => set("content", e.target.value)} />
      </F>
      <F label="Tags (cách nhau bằng dấu phẩy)" full>
        <input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="cnc, đồng nai, sản xuất" />
      </F>
      <F label="Cover image URL">
        <input className="input" value={v.cover_image ?? ""} onChange={(e) => set("cover_image", e.target.value)} />
      </F>
      <F label="OG image URL">
        <input className="input" value={v.og_image ?? ""} onChange={(e) => set("og_image", e.target.value)} />
      </F>
      <F label="Meta title" hint="mặc định lấy từ tiêu đề">
        <input className="input" value={v.meta_title ?? ""} onChange={(e) => set("meta_title", e.target.value)} />
      </F>
      <F label="Meta description" hint="mặc định lấy từ tóm tắt">
        <input className="input" value={v.meta_description ?? ""} onChange={(e) => set("meta_description", e.target.value)} />
      </F>
      <F label="Trạng thái">
        <select className="input" value={v.status} onChange={(e) => set("status", e.target.value as ArticleFormValues["status"])}>
          <option value="draft">Draft</option>
          <option value="pending">Chờ duyệt</option>
          <option value="published">Publish (cần quyền publisher+)</option>
          <option value="archived">Lưu trữ</option>
        </select>
      </F>

      {err && <div className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <div className="md:col-span-2 flex justify-end gap-2">
        <button type="submit" disabled={busy}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
    </form>
  );
}

function F({ label, children, full, hint }: { label: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
