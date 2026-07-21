import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";

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
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">{count} yêu cầu báo giá</p>
      </div>
      {err && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Người gửi</th><th className="p-3">Liên hệ</th>
              <th className="p-3">Nội dung</th><th className="p-3">Nguồn</th><th className="p-3">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Đang tải…</td></tr> :
             rows.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có lead nào.</td></tr> :
             rows.map((l) => (
              <tr key={l.id} className="border-b last:border-0 hover:bg-accent/40 align-top">
                <td className="p-3 font-medium">{l.name ?? "—"}</td>
                <td className="p-3 text-xs">
                  {l.email && <div>{l.email}</div>}
                  {l.phone && <div className="text-muted-foreground">{l.phone}</div>}
                </td>
                <td className="p-3 text-xs max-w-md">{l.message ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{l.source ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
