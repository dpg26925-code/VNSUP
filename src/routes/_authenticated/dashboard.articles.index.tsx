import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";
import { Pencil, Plus, Trash2, Send, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/articles/")({
  head: () => ({ meta: [{ title: "Bài viết | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: ArticlesListPage,
});

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  status: string;
  author_id: string | null;
  published_at: string | null;
  updated_at: string;
};

function ArticlesListPage() {
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete All State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const LIMIT = 20;

  async function load() {
    setLoading(true);
    setErr(null);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("limit", String(LIMIT));
      params.set("offset", String(page * LIMIT));
      const res = await adminApi<{ data: Article[]; count: number }>(`/articles?${params}`);
      setRows(res.data ?? []);
      setCount(res.count ?? 0);
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [status, page]);

  async function del(a: Article) {
    if (!confirm(`Xóa bài "${a.title}"?`)) return;
    try {
      await adminApi(`/articles/${a.id}`, { method: "DELETE" });
      toast.success(`Đã xóa bài "${a.title}"`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function batchDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xóa ${selectedIds.size} bài viết đã chọn?`)) return;
    try {
      await adminApi("/articles/batch-delete", {
        method: "POST",
        json: { ids: Array.from(selectedIds) },
      });
      toast.success(`Đã xóa ${selectedIds.size} bài viết thành công.`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDeleteAll() {
    if (confirmKeyword.trim().toUpperCase() !== "XOA") {
      toast.error("Vui lòng nhập chính xác chữ 'XOA' để xác nhận.");
      return;
    }

    setIsDeletingAll(true);
    try {
      const res = await adminApi<{ success: boolean; message: string; count: number }>("/articles/delete-all", {
        method: "POST",
      });
      toast.success(res.message || "Đã xóa toàn bộ bài viết thành công.");
      setShowDeleteAllModal(false);
      setConfirmKeyword("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsDeletingAll(false);
    }
  }

  async function publish(a: Article) {
    try {
      await adminApi(`/articles/${a.id}/publish`, { method: "POST", json: { publish: true } });
      toast.success(`Đã xuất bản bài "${a.title}"`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length && rows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Bài viết & Tin tức</h1>
          <p className="text-sm text-muted-foreground">{count} bài viết trên hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <button
              onClick={() => {
                setConfirmKeyword("");
                setShowDeleteAllModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-white transition shadow-2xs"
            >
              <Trash2 className="h-4 w-4" /> Xóa tất cả bài viết
            </button>
          )}
          <Link
            to="/dashboard/articles/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
          >
            <Plus className="h-4 w-4" /> Tạo bài mới
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { v: "", label: "Tất cả" },
          { v: "draft", label: "Bản nháp" },
          { v: "pending", label: "Chờ duyệt" },
          { v: "published", label: "Đã xuất bản" },
          { v: "archived", label: "Lưu trữ" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => {
              setPage(0);
              setStatus(t.v);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              status === t.v
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
          className="ml-auto flex gap-2 w-full sm:w-auto"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề…"
            className="w-full sm:w-64 rounded-lg border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-secondary font-medium">Tìm</button>
        </form>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {err}
        </div>
      )}

      {/* Batch Delete Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-top-1">
          <span>
            Đã chọn <b>{selectedIds.size}</b> / {rows.length} bài viết
          </span>
          <button
            onClick={batchDelete}
            className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-2xs"
          >
            <Trash2 className="h-4 w-4" /> Xóa các bài đã chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="p-3">Tiêu đề</th>
                <th className="p-3">Chuyên mục</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Cập nhật</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Đang tải danh sách bài viết…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Không có bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-accent/40 transition-colors ${
                      selectedIds.has(a.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="p-3">
                      <Link
                        to="/dashboard/articles/$id/edit"
                        params={{ id: a.id }}
                        className="font-medium hover:text-primary transition"
                      >
                        {a.title}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">/{a.slug}</div>
                    </td>
                    <td className="p-3 text-xs">{a.category ?? "—"}</td>
                    <td className="p-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(a.updated_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {a.status !== "published" && (
                        <button
                          title="Xuất bản ngay"
                          onClick={() => publish(a)}
                          className="mr-1 rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        to="/dashboard/articles/$id/edit"
                        params={{ id: a.id }}
                        title="Chỉnh sửa"
                        className="mr-1 inline-flex rounded-lg p-1.5 hover:bg-secondary"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                      <button
                        title="Xóa bài viết"
                        onClick={() => del(a)}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {count > LIMIT && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {page + 1} / {Math.ceil(count / LIMIT)} (Tổng {count} bài)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50 hover:bg-secondary transition"
            >
              ← Trang trước
            </button>
            <button
              disabled={(page + 1) * LIMIT >= count}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50 hover:bg-secondary transition"
            >
              Trang sau →
            </button>
          </div>
        </div>
      )}

      {/* Safety Modal: Xóa tất cả bài viết */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-destructive">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Xác nhận xóa TẤT CẢ bài viết?</h3>
                  <p className="text-xs text-destructive font-semibold">Hành động này KHÔNG THỂ khôi phục</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs leading-relaxed text-foreground">
              Toàn bộ <b>{count}</b> bài viết và tin tức trong hệ thống sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Để xác nhận, vui lòng nhập <span className="font-bold text-destructive">XOA</span> vào ô bên dưới:
              </label>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Nhập chữ XOA..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20 font-mono uppercase"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={confirmKeyword.trim().toUpperCase() !== "XOA" || isDeletingAll}
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-destructive/90 disabled:opacity-40 transition"
              >
                <Trash2 className="h-4 w-4" />
                {isDeletingAll ? "Đang xóa dữ liệu…" : `Xác nhận xóa hết (${count})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    pending: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-secondary"}`}>
      {status}
    </span>
  );
}
