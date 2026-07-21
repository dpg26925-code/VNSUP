import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Building2, FileCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/my-companies")({
  head: () => ({ meta: [{ title: "Nhà máy của tôi | FactoryHub" }, { name: "robots", content: "noindex" }] }),
  component: MyCompanies,
});

type Claim = { id: string; company_id: string; status: string | null; created_at: string };
type Company = { id: string; slug: string; name: string; province: string | null; industry: string | null; verified: boolean; featured: boolean };
type Submission = Company & { status: string | null; rejection_reason: string | null; created_at: string };

function MyCompanies() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const email = userRes.user?.email;
      if (!uid) { setLoading(false); return; }

      const [subRes, claimRes] = await Promise.all([
        supabase.from("companies")
          .select("id,slug,name,province,industry,verified,featured,status,rejection_reason,created_at")
          .eq("submitted_by", uid)
          .order("created_at", { ascending: false }),
        email
          ? supabase.from("company_claims")
              .select("id,company_id,status,created_at")
              .eq("requester_email", email)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Claim[] }),
      ]);

      setSubmissions((subRes.data ?? []) as Submission[]);
      const list = (claimRes.data ?? []) as Claim[];
      setClaims(list);
      const ids = list.map((c) => c.company_id).filter(Boolean);
      if (ids.length) {
        const { data: co } = await supabase.from("companies")
          .select("id,slug,name,province,industry,verified,featured")
          .in("id", ids);
        const map: Record<string, Company> = {};
        for (const c of (co ?? []) as Company[]) map[c.id] = c;
        setCompanies(map);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Doanh nghiệp của tôi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Hồ sơ bạn đã gửi và các yêu cầu xác thực đã claim.</p>
          </div>
          <Link to="/dashboard/submit-company" className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Gửi doanh nghiệp mới
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Doanh nghiệp đã gửi</h2>
          {loading ? (
            <div className="mt-3 text-sm text-muted-foreground">Đang tải…</div>
          ) : submissions.length === 0 ? (
            <div className="mt-3 rounded-lg border bg-card p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Bạn chưa gửi doanh nghiệp nào.</p>
              <Link to="/dashboard/submit-company" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">Gửi doanh nghiệp đầu tiên →</Link>
            </div>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {submissions.map((s) => (
                <li key={s.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{s.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {s.industry ?? ""}{s.province ? ` · ${s.province}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  {s.status === "rejected" && s.rejection_reason && (
                    <p className="mt-2 rounded bg-destructive/5 p-2 text-[11px] text-destructive">Lý do: {s.rejection_reason}</p>
                  )}
                  {s.status === "approved" && (
                    <Link to="/company/$slug" params={{ slug: s.slug }} className="mt-3 inline-block text-xs font-semibold text-brand hover:underline">
                      Xem hồ sơ công khai →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Yêu cầu xác thực (claim)</h2>
          {loading ? null : claims.length === 0 ? (
            <div className="mt-3 rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu claim nào.
            </div>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {claims.map((cl) => {
                const c = companies[cl.company_id];
                return (
                  <li key={cl.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{c?.name ?? "Nhà máy"}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {c?.industry ?? ""}{c?.province ? ` · ${c.province}` : ""}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                        <FileCheck className="h-3 w-3" /> {cl.status ?? "pending"}
                      </span>
                    </div>
                    {c && (
                      <Link to="/company/$slug" params={{ slug: c.slug }} className="mt-3 inline-block text-xs font-semibold text-brand hover:underline">
                        Xem hồ sơ →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "pending") return <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">Chờ duyệt</span>;
  if (status === "rejected") return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">Từ chối</span>;
  return <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">Đã duyệt</span>;
}
