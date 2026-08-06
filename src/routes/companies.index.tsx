import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { SkeletonCard, EmptyState } from "@/components/skeleton-card";
import { PROVINCES } from "@/lib/factory";
import { ZONE_META, zoneAbs, type ZoneRow } from "@/lib/zones";
import { Building2, MapPin, Ruler, BadgeCheck } from "lucide-react";

const listQO = queryOptions({
  queryKey: ["companies-list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,logo_url,featured,verified,status")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/companies/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listQO),
  head: () => {
    const M = ZONE_META["companies" as any] as any;
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
      <main className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">Doanh Nghiệp</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Danh sách Doanh Nghiệp tại Việt Nam</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{ZONE_META["companies"].listDescription}</p>
          </div>
          <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{filtered.length} Công ty</div>
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
              <EmptyState title="Chưa có Công ty" description="Không có Công ty nào phù hợp bộ lọc." />
            </div>
          ) : filtered.map((c: any) => (
            <Link
              key={c.id}
              to="/company/$slug"
              params={{ slug: c.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} loading="lazy" className="h-full w-full object-contain p-4 transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary/20">
                    <Building2 className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                {c.featured && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                    <BadgeCheck className="h-3 w-3" /> Nổi bật
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-brand">{c.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {c.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.province}</span>}
                  {c.industry && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground">{c.industry}</span>}
                  {c.employee_range && <span>Quy mô: {c.employee_range}</span>}
                </div>
                {c.verified && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3 w-3" /> Đã xác thực
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

export function _fallback() { return <SkeletonCard />; }
