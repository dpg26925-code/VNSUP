import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Thống kê | FactoryHub Admin" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

type Summary = {
  companies: { total: number; pending: number };
  articles: { total: number; published: number; draft: number };
  leads: { total: number };
  generated_at: string;
};

function AnalyticsPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    adminApi<{ data: Summary }>("/analytics/summary").then((r) => setS(r.data)).catch((e) => setErr((e as Error).message));
  }, []);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Thống kê</h1>
      {err && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
      {!s ? <div className="text-sm text-muted-foreground">Đang tải…</div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Doanh nghiệp" rows={[["Tổng", s.companies.total], ["Chờ duyệt", s.companies.pending]]} />
            <Card title="Bài viết" rows={[["Tổng", s.articles.total], ["Đã publish", s.articles.published], ["Draft", s.articles.draft]]} />
            <Card title="Leads" rows={[["Tổng", s.leads.total]]} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Cập nhật: {new Date(s.generated_at).toLocaleString("vi-VN")}</p>
        </>
      )}
    </div>
  );
}

function Card({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, val]) => (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-2xl font-bold">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
