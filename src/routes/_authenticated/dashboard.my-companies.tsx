import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FileCheck, Plus, Settings, ExternalLink, CheckCircle2, Clock, XCircle, Package, Phone, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/my-companies")({
  head: () => ({ meta: [{ title: "Nhà máy của tôi | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: MyCompanies,
});

type Claim = { id: string; company_id: string; status: string | null; created_at: string };
type Company = {
  id: string;
  slug: string;
  name: string;
  province: string | null;
  industry: string | null;
  verified: boolean;
  featured: boolean;
  logo_url: string | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string;
};

function MyCompanies() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [submissions, setSubmissions] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const email = userRes.user?.email;
      if (!uid) { setLoading(false); return; }

      const [subRes, claimRes] = await Promise.all([
        supabase.from("companies")
          .select("id,slug,name,province,industry,verified,featured,status,rejection_reason,created_at,logo_url")
          .eq("submitted_by", uid)
          .order("created_at", { ascending: false }),
        supabase.from("company_claims")
          .select("id,company_id,status,created_at")
          .or(`user_id.eq.${uid}${email ? `,requester_email.eq.${email}` : ""}`)
          .order("created_at", { ascending: false }),
      ]);

      setSubmissions((subRes.data ?? []) as Company[]);
      const list = (claimRes.data ?? []) as Claim[];
      setClaims(list);
      const ids = list.map((c) => c.company_id).filter(Boolean);
      if (ids.length) {
        const { data: co } = await supabase.from("companies")
          .select("id,slug,name,province,industry,verified,featured,status,rejection_reason,created_at,logo_url")
          .in("id", ids);
        const map: Record<string, Company> = {};
        for (const c of (co ?? []) as Company[]) map[c.id] = c;
        setCompanies(map);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Doanh nghiệp của tôi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý hồ sơ nhà máy, chỉnh sửa thông số năng lực, cập nhật danh mục sản phẩm và theo dõi yêu cầu báo giá.
            </p>
          </div>
          <Link
            to="/dashboard/submit-company"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" /> Đăng ký thêm nhà máy mới
          </Link>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Hồ sơ nhà máy đã đăng ký ({submissions.length})
            </h2>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-muted-foreground">Đang tải danh sách nhà máy…</div>
          ) : submissions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed bg-card p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">Bạn chưa có hồ sơ nhà máy nào</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Đăng ký hồ sơ để đưa nhà máy của bạn lên danh bạ công nghiệp số 1 Việt Nam và tiếp cận hàng nghìn khách mua B2B.
              </p>
              <Link
                to="/dashboard/submit-company"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" /> Đăng ký doanh nghiệp đầu tiên →
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition hover:border-brand/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="h-12 w-12 shrink-0 rounded-lg border object-contain p-1 bg-white"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-foreground text-base">{s.name}</h3>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.industry ?? "Chưa phân ngành"}{s.province ? ` · ${s.province}` : ""}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    {s.status === "rejected" && s.rejection_reason && (
                      <p className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                        Lý do từ chối: {s.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                    <Link
                      to="/dashboard/manage-company/$id"
                      params={{ id: s.id }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
                    >
                      <Settings className="h-3.5 w-3.5" /> Quản lý & Chỉnh sửa
                    </Link>

                    <Link
                      to="/company/$slug"
                      params={{ slug: s.slug }}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border bg-background px-3 py-2 text-xs font-semibold hover:bg-accent text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Xem công khai
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Claimed Companies */}
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Hồ sơ đã gửi yêu cầu xác thực / Claim ({claims.length})
          </h2>

          {loading ? null : claims.length === 0 ? (
            <div className="mt-4 rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Bạn chưa có yêu cầu claim hồ sơ nào.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {claims.map((cl) => {
                const c = companies[cl.company_id];
                const isApproved = cl.status === "approved";
                return (
                  <div key={cl.id} className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-foreground">{c?.name ?? "Nhà máy"}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {c?.industry ?? ""}{c?.province ? ` · ${c.province}` : ""}
                          </p>
                        </div>
                        <ClaimStatusBadge status={cl.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ngày yêu cầu: {new Date(cl.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                      {isApproved && c ? (
                        <Link
                          to="/dashboard/manage-company/$id"
                          params={{ id: c.id }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
                        >
                          <Settings className="h-3.5 w-3.5" /> Quản lý hồ sơ
                        </Link>
                      ) : null}

                      {c && (
                        <Link
                          to="/company/$slug"
                          params={{ slug: c.slug }}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Xem hồ sơ
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
        <Clock className="h-3 w-3" /> Chờ duyệt
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
        <XCircle className="h-3 w-3" /> Bị từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Đã duyệt
    </span>
  );
}

function ClaimStatusBadge({ status }: { status: string | null }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Đã xác thực
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
        <XCircle className="h-3 w-3" /> Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
      <FileCheck className="h-3 w-3" /> Đang xét duyệt
    </span>
  );
}
