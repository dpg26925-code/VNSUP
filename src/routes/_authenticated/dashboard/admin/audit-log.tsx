import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/admin/audit-log")({
  head: () => ({ meta: [{ title: "Nhật ký | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditLogPage,
});

type Row = {
  id: string; admin_user_id: string | null; action: string;
  target_type: string | null; target_id: string | null; target_slug: string | null;
  changes: Record<string, unknown>; ip: string | null; user_agent: string | null; created_at: string;
};

function AuditLogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("admin_audit_log")
        .select("*").order("created_at", { ascending: false }).limit(200);
      if (error) setErr(error.message);
      setRows((data ?? []) as Row[]); setLoading(false);
    })();
  }, []);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Nhật ký thao tác</h1>
      <p className="mb-3 text-xs text-muted-foreground">Chỉ admin xem được. Hiển thị 200 mục gần nhất.</p>
      {err && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Thời gian</th><th className="p-3">Hành động</th><th className="p-3">Đối tượng</th><th className="p-3">Người dùng</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Đang tải…</td></tr> :
             rows.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Chưa có nhật ký.</td></tr> :
             rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40 align-top">
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                <td className="p-3 font-mono text-xs">{r.action}</td>
                <td className="p-3 text-xs">
                  <div>{r.target_type ?? "—"}</div>
                  {r.target_slug && <div className="text-muted-foreground">{r.target_slug}</div>}
                </td>
                <td className="p-3 font-mono text-[11px] text-muted-foreground">{r.admin_user_id?.slice(0, 8) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
