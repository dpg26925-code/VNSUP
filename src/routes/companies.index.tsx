import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SkeletonCard, EmptyState } from "@/components/skeleton-card";
import { Container, CardGrid, SectionHeader } from "@/components/primitives";
import { CompanyCard } from "@/components/company-card";
import { PROVINCES, abs } from "@/lib/factory";
import { ZONE_META, type ZoneRow } from "@/lib/zones";
import { cn } from "@/lib/utils";
import { Building2, MapPin, BadgeCheck } from "lucide-react";

const listQO = queryOptions({
  queryKey: ["companies-list", "all-approved"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,logo_url,featured,verified,status,ai_summary,capabilities")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/companies/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listQO),
  head: () => {
    const M = (ZONE_META as any)["companies"];
    const url = abs("/companies");
    return {
      meta: [
        { title: M.listTitle },
        { name: "description", content: M.listDescription },
        { property: "og:title", content: M.listTitle },
        { property: "og:description", content: M.listDescription },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: url.replace(M.path, "/") },
            { "@type": "ListItem", position: 2, name: M.fullLabel, item: url },

          ],
        }),
      }],
    };
  },
  errorComponent: () => <div className="p-6 text-sm text-destructive">Không tải được danh sách.</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Không tìm thấy.</div>,
  component: CompanyListPage,
});

function CompanyListPage() {
  const { data: rows } = useSuspenseQuery(listQO);
  const [province, setProvince] = useState<string>("");
  const filtered = useMemo(() => rows.filter((r) => !province || r.province === province), [rows, province]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container>
          <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">Doanh Nghiệp</span>
          </nav>
          
          <SectionHeader
            title="Danh sách Doanh Nghiệp sản xuất"
            description={ZONE_META["companies"].listDescription}
            actions={
              <div className="flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-bold text-brand ring-1 ring-brand/10">
                {filtered.length} Công ty
              </div>
            }
          />

          <div className="mb-10 flex flex-wrap gap-3 border-b border-border pb-8">
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-brand focus:border-brand focus:ring-1 focus:ring-brand outline-hidden transition-all shadow-xs"
            >
              <option value="">Tất cả tỉnh/thành</option>
              {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
            </select>
            
            <div className="flex flex-wrap gap-2">
              {PROVINCES.slice(0, 6).map(p => (
                <button 
                  key={p.slug}
                  onClick={() => setProvince(p.name)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-full border transition-all",
                    province === p.name 
                      ? "bg-brand border-brand text-brand-foreground shadow-sm" 
                      : "bg-background border-border text-muted-foreground hover:border-brand hover:text-brand"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState 
              title="Chưa có Doanh nghiệp" 
              description="Không có doanh nghiệp nào phù hợp với tiêu chí lọc của bạn." 
            />
          ) : (
            <CardGrid gap="6">
              {filtered.map((c: any) => (
                <CompanyCard key={c.id} {...c} />
              ))}
            </CardGrid>
          )}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

export function _fallback() { return <SkeletonCard />; }
