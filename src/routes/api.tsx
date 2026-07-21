import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { abs } from "@/lib/factory";

export const Route = createFileRoute("/api")({
  head: () => {
    const url = abs("/api");
    const title = "API cho đối tác | FactoryHub Vietnam";
    const desc = "Tài liệu Admin API v2 của FactoryHub: quản lý bài viết, danh mục, lead và analytics qua REST, xác thực bằng Supabase JWT.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ApiPage,
});

type Row = { method: string; path: string; desc: string; role: string };
const ROWS: Row[] = [
  { method: "GET", path: "/api/public/admin/articles", desc: "Danh sách bài viết (filter status, category, q, limit)", role: "editor+" },
  { method: "POST", path: "/api/public/admin/articles", desc: "Tạo bài viết mới", role: "editor+" },
  { method: "GET", path: "/api/public/admin/articles/:id", desc: "Chi tiết bài viết", role: "editor+" },
  { method: "PATCH", path: "/api/public/admin/articles/:id", desc: "Cập nhật một phần bài viết", role: "editor+" },
  { method: "PUT", path: "/api/public/admin/articles/:id", desc: "Thay thế toàn bộ bài viết", role: "editor+" },
  { method: "DELETE", path: "/api/public/admin/articles/:id", desc: "Xoá bài viết", role: "can_delete" },
  { method: "POST", path: "/api/public/admin/articles/:id/publish", desc: "Publish/unpublish bài viết", role: "can_publish" },
  { method: "GET", path: "/api/public/admin/categories", desc: "Danh mục bài viết", role: "editor+" },
  { method: "GET", path: "/api/public/admin/leads", desc: "Danh sách lead", role: "editor+" },
  { method: "GET", path: "/api/public/admin/analytics/summary", desc: "Số liệu tổng quan", role: "editor+" },
];

function ApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">API cho đối tác</h1>
        <p className="mt-3 text-muted-foreground">
          Admin API v2 cho phép đối tác nội dung (như Hermes) và hệ thống nội bộ quản lý bài viết, danh mục, lead và analytics.
        </p>

        <section className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Base URL</h2>
          <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-sm"><code>https://cheerful-wave-works.lovable.app/api/public/admin</code></pre>
          <h2 className="mt-6 text-lg font-semibold">Xác thực</h2>
          <p className="mt-2 text-sm text-foreground/90">
            Mọi request phải gửi header <code className="rounded bg-muted px-1">Authorization: Bearer &lt;supabase_access_token&gt;</code>. Token lấy từ Supabase Auth của người dùng đã được cấp role tương ứng trong bảng <code className="rounded bg-muted px-1">user_roles</code>.
          </p>
          <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{`curl -H "Authorization: Bearer $TOKEN" \\
  https://cheerful-wave-works.lovable.app/api/public/admin/articles`}</pre>
        </section>

        <section className="mt-8 overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Method</th><th className="p-3">Path</th><th className="p-3">Mô tả</th><th className="p-3">Quyền</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={`${r.method} ${r.path}`} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs font-semibold">{r.method}</td>
                  <td className="p-3 font-mono text-xs">{r.path}</td>
                  <td className="p-3 text-xs text-foreground/90">{r.desc}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-6 text-sm text-muted-foreground">
          Cần cấp quyền hoặc trợ giúp tích hợp? Gửi email{" "}
          <a href="mailto:hello@factoryhub.vn" className="text-primary hover:underline">hello@factoryhub.vn</a>{" "}
          hoặc xem thêm trang <Link to="/about" className="text-primary hover:underline">giới thiệu</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
