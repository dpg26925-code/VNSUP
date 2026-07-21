import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArticleForm, type ArticleFormValues } from "@/components/article-form";
import { adminApi } from "@/lib/admin-client";
import { Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/articles/$id/edit")({
  head: () => ({ meta: [{ title: "Sửa bài | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticlePage,
});

type Article = ArticleFormValues & { id: string; status: string; published_at: string | null };

function EditArticlePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi<{ data: Article }>(`/articles/${id}`);
        setArticle(res.data);
      } catch (e) { setErr((e as Error).message); }
    })();
  }, [id]);

  async function publish() {
    try {
      const res = await adminApi<{ data: Article }>(`/articles/${id}/publish`, { method: "POST", json: { publish: true } });
      setArticle((a) => a ? { ...a, ...res.data } : a);
      setMsg("Đã publish.");
    } catch (e) { alert((e as Error).message); }
  }
  async function del() {
    if (!confirm("Xóa bài này?")) return;
    try { await adminApi(`/articles/${id}`, { method: "DELETE" }); navigate({ to: "/dashboard/articles" }); }
    catch (e) { alert((e as Error).message); }
  }

  if (err) return <div className="p-6"><div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div></div>;
  if (!article) return <div className="p-6 text-sm text-muted-foreground">Đang tải…</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sửa bài</h1>
          <p className="text-sm text-muted-foreground">
            Trạng thái: <b>{article.status}</b>
            {article.published_at && ` · Publish lúc ${new Date(article.published_at).toLocaleString("vi-VN")}`}
          </p>
        </div>
        <div className="flex gap-2">
          {article.status !== "published" && (
            <button onClick={publish} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <Send className="h-4 w-4" /> Publish
            </button>
          )}
          <button onClick={del} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" /> Xóa
          </button>
        </div>
      </div>

      {msg && <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}

      <ArticleForm
        initial={article}
        onSubmit={async (values) => {
          const res = await adminApi<{ data: Article }>(`/articles/${id}`, { method: "PATCH", json: values });
          setArticle(res.data);
          setMsg("Đã lưu.");
        }}
      />
    </div>
  );
}
