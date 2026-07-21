import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Building2, FileCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/my-companies")({
  head: () => ({ meta: [{ title: "Nhà máy của tôi | FactoryHub" }, { name: "robots", content: "noindex" }] }),
  component: MyCompanies,
});

type Claim = { id: string; company_id: string; status: string | null; created_at: string };
type Company = { id: string; slug: string; name: string; province: string | null; industry: string | null; verified: boolean; featured: boolean };

function MyCompanies() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const email = userRes.user?.email;
      if (!email) { setLoading(false); return; }
      const { data: cl } = await supabase.from("company_claims")
        .select("id,company_id,status,created_at")
        .eq("requester_email", email)
        .order("created_at", { ascending: false });
      const list = (cl ?? []) as Claim[];
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
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Nhà máy của tôi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Hồ sơ nhà máy bạn đã claim hoặc đang chờ xác thực.</p>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Đăng ký nhà máy
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Đang tải…</div>
          ) : claims.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Bạn chưa claim nhà máy nào. Tìm nhà máy của bạn và gửi yêu cầu xác thực để bắt đầu.</p>
              <Link to="/search" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Tìm nhà máy →</Link>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
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
                      <Link to="/company/$slug" params={{ slug: c.slug }} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
                        Xem hồ sơ →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
