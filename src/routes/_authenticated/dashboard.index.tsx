import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/admin-client";
import { Building2, FileText, Inbox, Plus, Send, Bookmark, MessageSquare, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Tổng quan | FactoryHub Admin" }, { name: "robots", content: "noindex" }] }),
  component: OverviewPage,
});

type Summary = {
  companies: { total: number; pending: number };
  articles: { total: number; published: number; draft: number };
  leads: { total: number };
};
type Article = { id: string; title: string; slug: string; status: string; updated_at: string };

type SavedSearch = { id: string; query: string | null; filters: unknown; created_at: string };
type Lead = { id: string; company_id: string; message: string; created_at: string; companies?: { name: string; slug: string } | null };

function OverviewPage() {
  const [role, setRole] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Article[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      const email = data.user?.email;
      let highest: string | null = null;
      if (uid) {
        const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
        const roles = (rows ?? []).map((r) => r.role as string);
        const rank = { admin: 3, publisher: 2, editor: 1 } as Record<string, number>;
        highest = roles.reduce<string | null>((b, r) => ((rank[r] ?? 0) > (rank[b ?? ""] ?? 0) ? r : b), null);
        setRole(highest);
      }
      const isAdmin = highest === "admin" || highest === "publisher" || highest === "editor";
      if (isAdmin) {
        try {
          const s = await adminApi<{ data: Summary }>("/analytics/summary");
          setSummary(s.data);
          const a = await adminApi<{ data: Article[] }>("/articles?limit=10");
          setRecent(a.data ?? []);
        } catch (e) {
          setErr((e as Error).message);
        }
      } else {
        if (uid) {
          const { data: ss } = await supabase.from("saved_searches").select("id,query,filters,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(6);
          setSavedSearches((ss ?? []) as SavedSearch[]);
        }
        if (email) {
          const { data: ls } = await supabase.from("leads").select("id,company_id,message,created_at,companies(name,slug)").eq("email", email).order("created_at", { ascending: false }).limit(6);
          setMyLeads((ls ?? []) as unknown as Lead[]);
        }
      }
      setChecked(true);
    })();
  }, []);

  const hasAdminRole = role === "admin" || role === "publisher" || role === "editor";

  if (!hasAdminRole) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
        <p className="mt-1 text-muted-foreground">Quản lý tìm kiếm đã lưu, yêu cầu báo giá và hồ sơ doanh nghiệp của bạn.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <QuickLink to="/search" icon={Search} title="Tìm nhà máy" desc="Lọc theo ngành, tỉnh, quy mô." />
          <QuickLink to="/dashboard/submit-company" icon={Send} title="Gửi doanh nghiệp" desc="Đăng ký hồ sơ nhà máy để admin duyệt." />
          <QuickLink to="/dashboard/my-companies" icon={Building2} title="Doanh nghiệp của tôi" desc="Theo dõi trạng thái duyệt & lead inbox." />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><Bookmark className="h-4 w-4" /> Tìm kiếm đã lưu</h2>
              <Link to="/search" className="text-xs font-semibold text-primary hover:underline">Tìm mới →</Link>
            </div>
            {!checked ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : savedSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa lưu tìm kiếm nào. Vào <Link to="/search" className="text-primary hover:underline">trang tìm nhà máy</Link> để lọc và lưu.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {savedSearches.map((s) => (
                  <li key={s.id} className="rounded border p-3">
                    <div className="font-medium">{s.name ?? "Tìm kiếm không tên"}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{JSON.stringify(s.query)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><MessageSquare className="h-4 w-4" /> Yêu cầu báo giá gần đây</h2>
            </div>
            {!checked ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : myLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa gửi yêu cầu báo giá nào.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {myLeads.map((l) => (
                  <li key={l.id} className="rounded border p-3">
                    <div className="flex items-center justify-between gap-2">
                      {l.companies?.slug ? (
                        <Link to="/company/$slug" params={{ slug: l.companies.slug }} className="font-medium hover:text-primary">{l.companies.name}</Link>
                      ) : (
                        <span className="font-medium">Nhà máy</span>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">Bảng điều khiển FactoryHub Admin.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/articles/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tạo bài mới
          </Link>
        </div>
      </div>

      {err && <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tổng bài viết" value={summary?.articles.total ?? "—"} icon={FileText} />
        <Stat label="Đã publish" value={summary?.articles.published ?? "—"} icon={FileText} accent="text-emerald-600" />
        <Stat label="Draft" value={summary?.articles.draft ?? "—"} icon={FileText} accent="text-amber-600" />
        <Stat label="Leads" value={summary?.leads.total ?? "—"} icon={Inbox} />
        <Stat label="Doanh nghiệp" value={summary?.companies.total ?? "—"} icon={Building2} />
        <Stat label="Chờ duyệt DN" value={summary?.companies.pending ?? "—"} icon={Building2} accent="text-orange-600" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bài viết mới nhất</h2>
          <Link to="/dashboard/articles" className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</Link>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Tiêu đề</th><th className="p-3">Trạng thái</th><th className="p-3">Cập nhật</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Chưa có bài viết nào.</td></tr>
              ) : recent.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="p-3">
                    <Link to="/dashboard/articles/$id/edit" params={{ id: a.id }} className="font-medium hover:underline">{a.title}</Link>
                  </td>
                  <td className="p-3"><StatusPill status={a.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
    pending: "bg-blue-100 text-blue-700",
    archived: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-5 hover:border-primary">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 font-semibold">{title}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}
