import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/categories")({
  head: () => ({ meta: [{ title: "Chuyên mục | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

type Category = { id: string; name: string; slug: string; description: string | null; parent_id: string | null; created_at: string };

function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await adminApi<{ data: Category[] }>("/categories"); setRows(r.data ?? []); }
    catch (e) { setErr((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!form.name) return;
    setBusy(true);
    try {
      await adminApi("/categories", { method: "POST", json: { name: form.name, slug: form.slug || undefined, description: form.description || null } });
      setForm({ name: "", slug: "", description: "" }); load();
    } catch (e) { alert((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Chuyên mục</h1>
      {err && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <form onSubmit={create} className="mb-6 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input required placeholder="Tên chuyên mục" className="rounded-md border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Slug (tự động nếu bỏ trống)" className="rounded-md border px-3 py-2 text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input placeholder="Mô tả" className="rounded-md border px-3 py-2 text-sm md:col-span-2 md:row-start-1 md:col-start-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button disabled={busy} className="col-span-full inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          <Plus className="h-4 w-4" /> {busy ? "Đang lưu…" : "Thêm chuyên mục"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Tên</th><th className="p-3">Slug</th><th className="p-3">Mô tả</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Đang tải…</td></tr> :
             rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="p-3 text-xs">{c.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
