import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArticleForm } from "@/components/article-form";
import { adminApi } from "@/lib/admin-client";

export const Route = createFileRoute("/_authenticated/dashboard/articles/new")({
  head: () => ({ meta: [{ title: "Tạo bài mới | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: NewArticlePage,
});

function NewArticlePage() {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Tạo bài mới</h1>
      <ArticleForm
        onSubmit={async (values) => {
          const res = await adminApi<{ data: { id: string } }>("/articles", { method: "POST", json: values });
          navigate({ to: "/dashboard/articles/$id/edit", params: { id: res.data.id } });
        }}
      />
    </div>
  );
}
