import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";
import { Pencil, Plus, Trash2, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/articles/")({
  head: () => ({ meta: [{ title: "Bài viết | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: ArticlesListPage,
});

type Article = {
  id: string; title: string; slug: string; excerpt: string | null; category: string | null;
  status: string; author_id: string | null; published_at: string | null; updated_at: string;
};

function ArticlesListPage() {
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const LIMIT = 20;

  async function load() {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("limit", String(LIMIT));
      params.set("offset", String(page * LIMIT));
      const res = await adminApi<{ data: Article[]; count: number }>(`/articles?${params}`);
      setRows(res.data ?? []); setCount(res.count ?? 0);
    } catch (e) { setErr((e as Error).message); }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, page]);

  async function del(a: Article) {
    if (!confirm(`Xóa bài "${a.title}"?`)) return;
    try { await adminApi(`/articles/${a.id}`, { method: "DELETE" }); load(); }
    catch (e) { alert((e as Error).message); }
  }
  async function publish(a: Article) {
    try { await adminApi(`/articles/${a.id}/publish`, { method: "POST", json: { publish: true } }); load(); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài viết</h1>
          <p className="text-sm text-muted-foreground">{count} bài trong hệ thống</p>
        </div>
        <Link to="/dashboard/articles/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Tạo bài mới
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { v: "", label: "Tất cả" },
          { v: "draft", label: "Draft" },
          { v: "pending", label: "Chờ duyệt" },
          { v: "published", label: "Đã publish" },
          { v: "archived", label: "Lưu trữ" },
        ].map((t) => (
          <button key={t.v} onClick={() => { setPage(0); setStatus(t.v); }}
            className={`rounded-md border px-3 py-1.5 text-sm ${status === t.v ? "border-primary bg-primary/5 text-primary" : "hover:bg-accent"}`}>
            {t.label}
          </button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); load(); }} className="ml-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tiêu đề…"
            className="w-64 rounded-md border bg-card px-3 py-1.5 text-sm outline-none" />
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Tìm</button>
        </form>
      </div>

      {err && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Tiêu đề</th><th className="p-3">Chuyên mục</th>
              <th className="p-3">Trạng thái</th><th className="p-3">Cập nhật</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Đang tải…</td></tr> :
             rows.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Không có bài nào.</td></tr> :
             rows.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-accent/40">
                <td className="p-3">
                  <Link to="/dashboard/articles/$id/edit" params={{ id: a.id }} className="font-medium hover:underline">{a.title}</Link>
                  <div className="text-[11px] text-muted-foreground">/{a.slug}</div>
                </td>
                <td className="p-3 text-xs">{a.category ?? "—"}</td>
                <td className="p-3"><StatusPill status={a.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {a.status !== "published" && (
                    <button title="Publish" onClick={() => publish(a)} className="mr-1 rounded p-1.5 text-emerald-600 hover:bg-emerald-50">
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  <Link to="/dashboard/articles/$id/edit" params={{ id: a.id }} title="Sửa" className="mr-1 inline-flex rounded p-1.5 hover:bg-accent">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button title="Xóa" onClick={() => del(a)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count > LIMIT && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trang {page + 1} / {Math.ceil(count / LIMIT)}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-md border px-3 py-1.5 disabled:opacity-50">← Trước</button>
            <button disabled={(page + 1) * LIMIT >= count} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-50">Sau →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
    pending: "bg-blue-100 text-blue-700",
    archived: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}
