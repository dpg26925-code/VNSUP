import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck2, Check, XCircle, Clock, CheckCircle2, XOctagon, Eye, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/claims")({
  head: () => ({
    meta: [
      { title: "Yêu cầu Claim | FactoryHub Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminClaimsPage,
});

type Status = "pending" | "approved" | "rejected";
type Row = {
  id: string;
  company_id: string;
  user_id: string | null;
  requester_email: string;
  requester_name: string | null;
  note: string | null;
  status: Status;
  created_at: string;
  reviewed_at: string | null;
  companies?: { id: string; name: string; slug: string; submitted_by: string | null } | null;
};

function AdminClaimsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | "all">("pending");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const loadStats = async () => {
    const { data } = await supabase.from("company_claims").select("status");
    const list = (data ?? []) as { status: string }[];
    setStats({
      pending: list.filter((r) => r.status === "pending").length,
      approved: list.filter((r) => r.status === "approved").length,
      rejected: list.filter((r) => r.status === "rejected").length,
    });
  };

  const load = async () => {
    setLoading(true);
    let qb = supabase
      .from("company_claims")
      .select("id,company_id,user_id,requester_email,requester_name,note,status,created_at,reviewed_at,companies(id,name,slug,submitted_by)")
      .order("created_at", { ascending: false });
    if (status !== "all") qb = qb.eq("status", status);
    const { data } = await qb;
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const approve = async (r: Row) => {
    if (!r.user_id) {
      alert("Yêu cầu này không gắn với tài khoản người dùng. Không thể tự động cấp quyền sở hữu.");
      return;
    }
    if (r.companies?.submitted_by && r.companies.submitted_by !== r.user_id) {
      if (!confirm("Doanh nghiệp này đã có chủ sở hữu khác. Duyệt sẽ thay chủ sở hữu. Tiếp tục?")) return;
    }
    const { error } = await supabase.from("company_claims").update({ status: "approved" }).eq("id", r.id);
    if (error) { alert(error.message); return; }
    load(); loadStats();
  };

  const reject = async (r: Row) => {
    const { error } = await supabase.from("company_claims").update({ status: "rejected" }).eq("id", r.id);
    if (error) { alert(error.message); return; }
    load(); loadStats();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span className="mx-1.5">/</span>
        <span>Quản trị</span>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">Yêu cầu Claim</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <FileCheck2 className="h-6 w-6 text-primary" /> Yêu cầu xác thực quyền sở hữu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Duyệt yêu cầu người dùng claim trang doanh nghiệp do admin tạo sẵn.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} tone="brand" active={status === "pending"} onClick={() => setStatus("pending")} />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} tone="success" active={status === "approved"} onClick={() => setStatus("approved")} />
        <StatCard icon={XOctagon} label="Từ chối" value={stats.rejected} tone="destructive" active={status === "rejected"} onClick={() => setStatus("rejected")} />
      </section>

      <section className="mt-5 overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Doanh nghiệp</th>
                <th className="p-3 text-left">Người yêu cầu</th>
                <th className="p-3 text-left">Ghi chú</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Gửi lúc</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">Đang tải…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground"><FileCheck2 className="h-5 w-5" /></div>
                  <div className="mt-3 text-sm font-semibold">Không có yêu cầu nào</div>
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b transition hover:bg-muted/30 last:border-0 align-top">
                  <td className="p-3">
                    {r.companies ? (
                      <>
                        <Link to="/company/$slug" params={{ slug: r.companies.slug }} className="font-medium hover:text-primary hover:underline">{r.companies.name}</Link>
                        <div className="text-[11px] text-muted-foreground">/{r.companies.slug}</div>
                        {r.companies.submitted_by && r.companies.submitted_by !== r.user_id && (
                          <div className="mt-1 text-[10px] font-semibold uppercase text-amber-600">Đã có chủ sở hữu khác</div>
                        )}
                      </>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.requester_name ?? "—"}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Mail className="h-3 w-3" /> {r.requester_email}
                    </div>
                    {!r.user_id && <div className="mt-1 text-[10px] font-semibold uppercase text-amber-600">Không gắn tài khoản</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs">
                    <div className="line-clamp-3 whitespace-pre-line">{r.note || "—"}</div>
                  </td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.companies && (
                        <Link to="/company/$slug" params={{ slug: r.companies.slug }} target="_blank" title="Xem trang" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => approve(r)} title="Duyệt" className="rounded p-1.5 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                          <button onClick={() => reject(r)} title="Từ chối" className="rounded p-1.5 text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number;
  tone: "brand" | "success" | "destructive"; active?: boolean; onClick?: () => void;
}) {
  const toneMap = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary/40 ${active ? "border-primary ring-2 ring-primary/20" : ""}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneMap[tone]}`}><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-2xl font-bold leading-tight">{value.toLocaleString("vi-VN")}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "pending") return <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand"><Clock className="h-3 w-3" /> Chờ duyệt</span>;
  if (status === "approved") return <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3 w-3" /> Đã duyệt</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive"><XOctagon className="h-3 w-3" /> Từ chối</span>;
}
