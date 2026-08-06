import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRIES, PROVINCES } from "@/lib/factory";
import { Building2, Check, XCircle, Search, Filter, ChevronLeft, ChevronRight, Clock, CheckCircle2, XOctagon, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/companies")({
  head: () => ({
    meta: [
      { title: "Doanh nghiệp mới | VNSupplier Admin" },
      { name: "description", content: "Quản lý doanh nghiệp gửi lên VNSupplier: duyệt, từ chối, lọc theo trạng thái, ngành, tỉnh." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/admin/companies" }],
  }),
  component: AdminCompaniesPage,
});

type Status = "pending" | "approved" | "rejected";
type Row = {
  id: string; name: string; slug: string;
  industry: string | null; province: string | null;
  status: Status | null; verified: boolean; featured: boolean;
  submitted_by: string | null; created_at: string; rejection_reason: string | null;
};

const PAGE_SIZE = 20;

function AdminCompaniesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<Status | "all">("pending");
  const [industry, setIndustry] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);

  const [rejectFor, setRejectFor] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Debounce search
  useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [status, industry, province, qDebounced]);

  const loadStats = async () => {
    const { data } = await supabase.from("companies").select("status");
    const list = (data ?? []) as { status: string | null }[];
    setStats({
      pending: list.filter((r) => r.status === "pending").length,
      approved: list.filter((r) => r.status === "approved").length,
      rejected: list.filter((r) => r.status === "rejected").length,
      total: list.length,
    });
  };

  const load = async () => {
    setLoading(true);
    let qb = supabase.from("companies")
      .select("id,name,slug,industry,province,status,verified,featured,submitted_by,created_at,rejection_reason", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status !== "all") qb = qb.eq("status", status);
    if (industry) qb = qb.eq("industry", industry);
    if (province) qb = qb.eq("province", province);
    if (qDebounced) qb = qb.ilike("name", `%${qDebounced}%`);
    const from = (page - 1) * PAGE_SIZE;
    qb = qb.range(from, from + PAGE_SIZE - 1);
    const { data, count } = await qb;
    setRows((data ?? []) as Row[]);
    setCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, industry, province, qDebounced, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const approve = async (id: string) => {
    await supabase.from("companies").update({ 
      status: "approved", 
      rejection_reason: null,
      verified: true // Auto-verify on admin approval if coming from pending
    }).eq("id", id);
    load(); loadStats();
  };
  const doReject = async () => {
    if (!rejectFor) return;
    await supabase.from("companies").update({ 
      status: "rejected", 
      rejection_reason: rejectReason.trim() || null,
      verified: false,
      featured: false
    }).eq("id", rejectFor.id);
    setRejectFor(null); setRejectReason("");
    load(); loadStats();
  };

  const activeFilters = useMemo(() => [industry, province, qDebounced].filter(Boolean).length, [industry, province, qDebounced]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Breadcrumb */}
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span className="mx-1.5">/</span>
        <span>Quản trị</span>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">Doanh nghiệp</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Building2 className="h-6 w-6 text-primary" /> Doanh nghiệp mới
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Duyệt và quản lý hồ sơ doanh nghiệp gửi lên VNSupplier.</p>
        </div>
        <div className="text-xs text-muted-foreground">{count.toLocaleString("vi-VN")} kết quả</div>
      </header>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} tone="brand" active={status === "pending"} onClick={() => setStatus("pending")} />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} tone="success" active={status === "approved"} onClick={() => setStatus("approved")} />
        <StatCard icon={XOctagon} label="Từ chối" value={stats.rejected} tone="destructive" active={status === "rejected"} onClick={() => setStatus("rejected")} />
        <StatCard icon={Building2} label="Tổng cộng" value={stats.total} tone="muted" active={status === "all"} onClick={() => setStatus("all")} />
      </section>

      {/* Filters */}
      <section className="mt-5 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-muted-foreground" /> Bộ lọc
          {activeFilters > 0 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{activeFilters}</span>}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên doanh nghiệp…"
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Tất cả ngành</option>
            {INDUSTRIES.map((i) => <option key={i.slug} value={i.name}>{i.name}</option>)}
          </select>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Tất cả tỉnh/TP</option>
            {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        {activeFilters > 0 && (
          <button onClick={() => { setIndustry(""); setProvince(""); setQ(""); }} className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground">
            Xóa bộ lọc
          </button>
        )}
      </section>

      {/* Table */}
      <section className="mt-5 overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Tên doanh nghiệp</th>
                <th className="p-3 text-left">Ngành</th>
                <th className="p-3 text-left">Tỉnh/TP</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Huy hiệu</th>
                <th className="p-3 text-left">Gửi lúc</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="p-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground"><Building2 className="h-5 w-5" /></div>
                  <div className="mt-3 text-sm font-semibold">Không có doanh nghiệp nào</div>
                  <div className="mt-1 text-xs text-muted-foreground">Không có kết quả khớp với bộ lọc hiện tại.</div>
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b transition hover:bg-muted/30 last:border-0">
                  <td className="p-3">
                    <Link to="/company/$slug" params={{ slug: r.slug }} className="font-medium hover:text-primary hover:underline">{r.name}</Link>
                    <div className="text-[11px] text-muted-foreground">/{r.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.industry ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.province ?? "—"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {r.verified && <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">Verified</span>}
                      {r.featured && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">Featured</span>}
                      {!r.verified && !r.featured && <span className="text-[11px] text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to="/company/$slug" params={{ slug: r.slug }} target="_blank" title="Xem trang công khai" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => approve(r.id)} title="Duyệt & Xác thực" className="rounded p-1.5 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                          <button onClick={() => { setRejectFor(r); setRejectReason(""); }} title="Từ chối" className="rounded p-1.5 text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></button>
                        </>
                      )}
                      {r.status === "rejected" && (
                        <button onClick={() => approve(r.id)} title="Khôi phục & duyệt" className="rounded p-1.5 text-success hover:bg-success/10"><Check className="h-4 w-4" /></button>
                      )}
                      {r.status === "approved" && (
                        <>
                          <button 
                            onClick={async () => {
                              await supabase.from("companies").update({ featured: !r.featured }).eq("id", r.id);
                              load();
                            }} 
                            title={r.featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"} 
                            className={`rounded p-1.5 ${r.featured ? 'text-brand' : 'text-muted-foreground'} hover:bg-brand/10`}
                          >
                            <Building2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setRejectFor(r); setRejectReason(""); }} title="Gỡ niêm yết (Từ chối)" className="rounded p-1.5 text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && count > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <div className="text-muted-foreground">Trang {page} / {totalPages} · {count.toLocaleString("vi-VN")} hồ sơ</div>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border px-2 py-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border px-2 py-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>

      {/* Reject modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setRejectFor(null)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Từ chối hồ sơ</h3>
            <p className="mt-1 text-sm text-muted-foreground">{rejectFor.name}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lý do từ chối</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} placeholder="VD: Thiếu GPKD, thông tin liên hệ không chính xác…"
              className="mt-2 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectFor(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Hủy</button>
              <button onClick={doReject} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90">Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number;
  tone: "brand" | "success" | "destructive" | "muted"; active?: boolean; onClick?: () => void;
}) {
  const toneMap = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-secondary text-foreground",
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

function StatusBadge({ status }: { status: Status | null }) {
  if (status === "pending") return <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand"><Clock className="h-3 w-3" /> Chờ duyệt</span>;
  if (status === "approved") return <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3 w-3" /> Đã duyệt</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive"><XOctagon className="h-3 w-3" /> Từ chối</span>;
  return <span className="text-[11px] text-muted-foreground">—</span>;
}
