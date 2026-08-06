import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SkeletonCard, EmptyState } from "@/components/skeleton-card";
import { Container, CardGrid, SectionHeader } from "@/components/primitives";
import { PROVINCES, abs } from "@/lib/factory";
import { ZONE_META, type ZoneRow } from "@/lib/zones";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Ruler, BadgeCheck } from "lucide-react";

const listQO = queryOptions({
  queryKey: ["industrial-zones-list", "all-approved"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("industrial_zones")
      .select("id,slug,kind,name,province,area_ha,occupancy_percent,developer,industries,banner_url,is_featured,status")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("area_ha", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/kcn-ccn/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listQO),
  head: () => {
    const M = (ZONE_META as any)["zones"];
    const url = abs("/kcn-ccn");
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
  component: KCNListPage,
});

function KCNListPage() {
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
            <span className="text-foreground">Khu Công Nghiệp</span>
          </nav>

          <SectionHeader
            title="Khu Công Nghiệp & Cụm Công Nghiệp"
            description={ZONE_META["zones"].listDescription}
            actions={
              <div className="flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-bold text-brand ring-1 ring-brand/10">
                {filtered.length} Khu vực
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
          </div>

          {filtered.length === 0 ? (
            <EmptyState 
              title="Chưa có KCN/CCN" 
              description="Không có khu công nghiệp nào phù hợp với bộ lọc." 
            />
          ) : (
            <CardGrid gap="6">
              {filtered.map((z) => (
                <Link
                  key={z.id}
                  to={z.kind === "ccn" ? "/cum-cong-nghiep/$slug" : "/khu-cong-nghiep/$slug"}
                  params={{ slug: z.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {z.banner_url ? (
                      <img src={z.banner_url} alt={z.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                         <Building2 className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                    {z.is_featured && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-brand-foreground shadow-sm">
                        <BadgeCheck className="h-3 w-3" /> NỔI BẬT
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-bold leading-tight group-hover:text-brand">{z.name}</h3>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {z.province && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />{z.province}</span>}
                      {z.area_ha && <span className="inline-flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />{z.area_ha} ha</span>}
                    </div>
                    {z.developer && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="truncate">{z.developer}</span>
                      </div>
                    )}
                  </div>
                </Link>
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
