import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES } from "@/lib/factory";
import { ZONE_META, zoneAbs, type ZoneRow } from "@/lib/zones";
import { Building2, MapPin, Ruler, BadgeCheck } from "lucide-react";

const listQO = queryOptions({
  queryKey: ["industrial-zones-list", "ccn"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("industrial_zones")
      .select("id,slug,name,province,area_ha,occupancy_percent,developer,industries,banner_url,is_featured")
      .eq("kind", "ccn")

      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("area_ha", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Pick<ZoneRow, "id" | "slug" | "name" | "province" | "area_ha" | "occupancy_percent" | "developer" | "industries" | "banner_url" | "is_featured">[];
  },
});

export const Route = createFileRoute("/cum-cong-nghiep/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listQO),
  head: () => {
    const url = zoneAbs(KIND);
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
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://vnsupplier.cloud/" },
            { "@type": "ListItem", position: 2, name: M.fullLabel, item: url },
          ],
        }),
      }],
    };
  },
  errorComponent: () => <div className="p-6 text-sm text-destructive">Không tải được danh sách.</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Không tìm thấy.</div>,
  component: CCNListPage,
});

function CCNListPage() {
  const { data: rows } = useSuspenseQuery(listQO);
  const [province, setProvince] = useState<string>("");
  const filtered = useMemo(() => rows.filter((r) => !province || r.province === province), [rows, province]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">Cụm Công Nghiệp</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Danh sách Cụm Công Nghiệp tại Việt Nam</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{M.listDescription}</p>
          </div>
          <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{filtered.length} CCN</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tất cả tỉnh/thành</option>
            {PROVINCES.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="Chưa có CCN" description="Không có CCN nào phù hợp bộ lọc." />
            </div>
          ) : filtered.map((z) => (
            <Link
              key={z.id}
              to="/cum-cong-nghiep/$slug"
              params={{ slug: z.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {z.banner_url ? (
                  <img src={z.banner_url} alt={z.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : null}
                {z.is_featured && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                    <BadgeCheck className="h-3 w-3" /> Nổi bật
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-brand">{z.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {z.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{z.province}</span>}
                  {z.area_ha && <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" />{z.area_ha} ha</span>}
                  {typeof z.occupancy_percent === "number" && <span>Lấp đầy {z.occupancy_percent}%</span>}
                </div>
                {z.developer && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Building2 className="h-3 w-3" />{z.developer}
                  </div>
                )}
                {Array.isArray(z.industries) && z.industries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {z.industries.slice(0, 3).map((i) => (
                      <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground">{i}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
