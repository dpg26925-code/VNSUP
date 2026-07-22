import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";
import { SectionHeader } from "@/components/primitives";
import { SkeletonList, EmptyState, ErrorState } from "@/components/skeleton-card";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  head: () => ({ meta: [{ title: "Leads | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: LeadsPage,
});

type Lead = {
  id: string; name: string | null; email: string | null; phone: string | null;
  company_id: string | null; message: string | null; created_at: string; source: string | null;
};

function LeadsPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi<{ data: Lead[]; count: number }>("/leads?limit=200");
        setRows(r.data ?? []); setCount(r.count ?? 0);
      } catch (e) { setErr((e as Error).message); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6">
      <SectionHeader title="Leads" description={`${count} yêu cầu báo giá`} />

      {err ? (
        <ErrorState description={err} />
      ) : loading ? (
        <SkeletonList rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="Chưa có lead nào"
          description="Yêu cầu báo giá gửi qua hồ sơ nhà máy sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Người gửi</th><th className="p-3">Liên hệ</th>
                <th className="p-3">Nội dung</th><th className="p-3">Nguồn</th><th className="p-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-border align-top last:border-0 hover:bg-accent/40">
                  <td className="p-3 font-medium">{l.name ?? "—"}</td>
                  <td className="p-3 text-xs">
                    {l.email && <div>{l.email}</div>}
                    {l.phone && <div className="text-muted-foreground">{l.phone}</div>}
                  </td>
                  <td className="p-3 max-w-md text-xs">{l.message ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{l.source ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
