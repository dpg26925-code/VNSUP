import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/admin-client";
import {
  Building2,
  FileText,
  Inbox,
  Plus,
  Send,
  Bookmark,
  MessageSquare,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Tổng quan Doanh nghiệp | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: OverviewPage,
});

type Summary = {
  companies: { total: number; pending: number };
  articles: { total: number; published: number; draft: number };
  leads: { total: number };
};
type Article = { id: string; title: string; slug: string; status: string; updated_at: string };

type CompanyItem = {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  industry: string | null;
  status: string | null;
  verified: boolean;
  logo_url: string | null;
};

type LeadItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  created_at: string;
  company_id: string;
  companies?: { name: string; slug: string } | null;
};

function OverviewPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Article[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Business state
  const [myCompanies, setMyCompanies] = useState<CompanyItem[]>([]);
  const [inboundLeads, setInboundLeads] = useState<LeadItem[]>([]);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setChecked(true);
        return;
      }
      setUserEmail(user.email ?? "");
      setUserName((user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Quý doanh nghiệp");

      let highest: string | null = null;
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (rows ?? []).map((r) => r.role as string);
      const rank = { admin: 3, publisher: 2, editor: 1 } as Record<string, number>;
      highest = roles.reduce<string | null>((b, r) => ((rank[r] ?? 0) > (rank[b ?? ""] ?? 0) ? r : b), null);
      setRole(highest);

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
        // Fetch non-admin enterprise data
        try {
          const [subRes, claimRes] = await Promise.all([
            supabase
              .from("companies")
              .select("id, name, slug, province, industry, status, verified, logo_url")
              .eq("submitted_by", user.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("company_claims")
              .select("id, company_id, status")
              .eq("user_id", user.id),
          ]);

          const submitted = (subRes.data ?? []) as CompanyItem[];
          const claims = claimRes.data ?? [];
          const approvedClaimCompanyIds = claims.filter((c) => c.status === "approved").map((c) => c.company_id);
          const pendingClaims = claims.filter((c) => c.status === "pending").length;
          setPendingClaimsCount(pendingClaims);

          let allCompanies = [...submitted];
          if (approvedClaimCompanyIds.length > 0) {
            const { data: claimedCos } = await supabase
              .from("companies")
              .select("id, name, slug, province, industry, status, verified, logo_url")
              .in("id", approvedClaimCompanyIds);
            
            const existingIds = new Set(submitted.map((c) => c.id));
            for (const c of (claimedCos ?? []) as CompanyItem[]) {
              if (!existingIds.has(c.id)) {
                allCompanies.push(c);
              }
            }
          }
          setMyCompanies(allCompanies);

          // Fetch inbound RFQ leads
          const allCompanyIds = allCompanies.map((c) => c.id);
          if (allCompanyIds.length > 0) {
            const { data: leadsData } = await supabase
              .from("leads")
              .select("id, name, email, phone, company, message, created_at, company_id, companies(name, slug)")
              .in("company_id", allCompanyIds)
              .order("created_at", { ascending: false })
              .limit(10);
            setInboundLeads((leadsData ?? []) as unknown as LeadItem[]);
          }
        } catch (fetchErr: any) {
          setErr(fetchErr?.message || "Lỗi tải dữ liệu bảng điều khiển.");
        }
      }
      setChecked(true);
    })();
  }, []);

  const hasAdminRole = role === "admin" || role === "publisher" || role === "editor";

  if (!hasAdminRole) {
    return (
      <div className="min-h-screen bg-muted/20 pb-16">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Welcome Banner */}
          <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-card via-card to-brand/5 p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
                  <Sparkles className="h-3.5 w-3.5" /> Doanh nghiệp B2B & Quản trị Nhà máy
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Xin chào, {userName}!
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bảng điều khiển quản lý thông tin nhà máy, tiếp nhận yêu cầu báo giá (RFQ) và tối ưu độ hiển thị trên VNSupplier.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/dashboard/submit-company"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand/90 transition"
                >
                  <Plus className="h-4 w-4" /> Đăng ký nhà máy mới
                </Link>
                <Link
                  to="/dashboard/claim"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
                >
                  <ShieldQuestion className="h-4 w-4 text-brand" /> Xác thực nhà máy (Claim)
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              to="/dashboard/my-companies"
              className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-brand/40"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nhà máy quản lý
                </div>
                <div className="mt-1 text-3xl font-extrabold text-foreground">
                  {myCompanies.length}
                </div>
                <div className="mt-1 text-xs text-brand font-medium">
                  Xem danh sách nhà máy →
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Building2 className="h-6 w-6" />
              </div>
            </Link>

            <Link
              to="/dashboard/leads"
              className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-brand/40"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Leads / RFQ Báo giá
                </div>
                <div className="mt-1 text-3xl font-extrabold text-foreground">
                  {inboundLeads.length}
                </div>
                <div className="mt-1 text-xs text-brand font-medium">
                  Mở hộp thư Báo giá →
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Inbox className="h-6 w-6" />
              </div>
            </Link>

            <Link
              to="/dashboard/claim"
              className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-brand/40"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Yêu cầu Xác thực (Claim)
                </div>
                <div className="mt-1 text-3xl font-extrabold text-foreground">
                  {pendingClaimsCount}
                </div>
                <div className="mt-1 text-xs text-brand font-medium">
                  {pendingClaimsCount > 0 ? "Đang chờ Admin duyệt" : "Xác thực thêm nhà máy"}
                </div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickShortcut
              to="/dashboard/my-companies"
              icon={Building2}
              title="Nhà máy của tôi"
              desc="Chỉnh sửa thông số, sản phẩm, năng lực sản xuất"
            />
            <QuickShortcut
              to="/dashboard/leads"
              icon={Inbox}
              title="Hộp thư Báo giá (RFQ)"
              desc="Xem và liên hệ trực tiếp với khách mua B2B"
            />
            <QuickShortcut
              to="/dashboard/submit-company"
              icon={Send}
              title="Đăng ký nhà máy"
              desc="Đưa nhà máy mới lên danh bạ công nghiệp số 1 VN"
            />
            <QuickShortcut
              to="/search"
              icon={Search}
              title="Tìm đối tác & Nhà máy"
              desc="Tìm kiếm công nghệ CNC, ép nhựa, dập kim loại…"
            />
          </div>

          {/* 2-column detailed section: Recent Inbound RFQs & Managed Companies */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Left: Recent Inbound RFQs */}
            <section className="rounded-2xl border bg-card p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                    <MessageSquare className="h-4 w-4 text-brand" /> Yêu cầu Báo giá mới nhận
                  </h2>
                  <p className="text-xs text-muted-foreground">Khách hàng gửi nhu cầu trực tiếp đến nhà máy của bạn</p>
                </div>
                <Link to="/dashboard/leads" className="text-xs font-bold text-brand hover:underline">
                  Xem tất cả ({inboundLeads.length}) →
                </Link>
              </div>

              {!checked ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Đang tải dữ liệu…</p>
              ) : inboundLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Chưa có yêu cầu báo giá mới</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Khi khách mua gửi yêu cầu qua trang chi tiết nhà máy của bạn, liên hệ sẽ hiển thị ngay tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inboundLeads.slice(0, 4).map((l) => (
                    <div key={l.id} className="rounded-xl border bg-background/60 p-4 transition hover:border-brand/30">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground">{l.name || "Khách mua"}</div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {l.company ? `${l.company} · ` : ""}{l.email}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-foreground/80 leading-relaxed bg-muted/40 p-2 rounded-lg">
                        "{l.message}"
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          Gửi tới: <span className="font-semibold text-foreground">{l.companies?.name || "Nhà máy"}</span>
                        </span>
                        <Link
                          to="/dashboard/leads"
                          className="font-semibold text-brand hover:underline"
                        >
                          Chi tiết & Phản hồi →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right: Managed Companies Overview */}
            <section className="rounded-2xl border bg-card p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Building2 className="h-4 w-4 text-brand" /> Nhà máy đang quản lý ({myCompanies.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">Hồ sơ năng lực trực tuyến trên VNSupplier</p>
                </div>
                <Link to="/dashboard/my-companies" className="text-xs font-bold text-brand hover:underline">
                  Quản lý tất cả →
                </Link>
              </div>

              {!checked ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Đang tải dữ liệu…</p>
              ) : myCompanies.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Bạn chưa có hồ sơ nhà máy nào</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đăng ký hoặc xác thực nhà máy của bạn để bắt đầu tiếp cận khách mua B2B.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Link
                      to="/dashboard/submit-company"
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand/90"
                    >
                      Đăng ký ngay
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCompanies.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border bg-background/60 p-4 transition hover:border-brand/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {c.logo_url ? (
                          <img
                            src={c.logo_url}
                            alt={c.name}
                            className="h-10 w-10 shrink-0 rounded-lg border object-contain p-1 bg-white"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-sm text-foreground">{c.name}</h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.industry || "Công nghiệp"}{c.province ? ` · ${c.province}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/dashboard/manage-company/$id"
                          params={{ id: c.id }}
                          className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition"
                        >
                          Chỉnh sửa
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">Bảng điều khiển VNSupplier Admin.</p>
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

function QuickShortcut({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-brand/40 hover:shadow-sm"
    >
      <div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-bold text-sm text-foreground group-hover:text-brand transition">
          {title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
        <span>Truy cập</span>
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

