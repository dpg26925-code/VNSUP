import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES, provinceBySlug } from "@/lib/factory";
import { Building2, MapPin, Ruler, BadgeCheck } from "lucide-react";
import { Container, CardGrid, SectionHeader } from "@/components/primitives";

const provinceZonesQO = (provinceName: string) => queryOptions({
  queryKey: ["industrial-zones-list", provinceName],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("industrial_zones")
      .select("id,slug,kind,name,province,area_ha,occupancy_percent,developer,industries,banner_url,is_featured")
      .eq("status", "approved")
      .eq("province", provinceName)
      .order("is_featured", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/kcn-ccn/$province")({
  loader: ({ context, params }) => {
    const p = provinceBySlug(params.province);
    if (!p) return null;
    return context.queryClient.ensureQueryData(provinceZonesQO(p.name));
  },
  head: ({ params }) => {
    const p = provinceBySlug(params.province);
    const title = `Khu công nghiệp tại ${p?.name || params.province} | VNSupplier`;
    const url = `https://vnsupplier.cloud/kcn-ccn/${params.province}`;
    return {
      meta: [
        { title },
        { name: "description", content: `Tra cứu danh sách các khu công nghiệp (KCN) và cụm công nghiệp (CCN) tại ${p?.name || params.province}.` },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
    };
  },
  component: ProvinceZonesPage,
});

function ProvinceZonesPage() {
  const { province: slug } = useParams({ from: "/kcn-ccn/$province" });
  const p = provinceBySlug(slug);
  const { data: rows } = useSuspenseQuery(provinceZonesQO(p?.name || ""));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container>
          <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <span className="text-border">/</span>
            <Link to="/kcn-ccn" className="hover:text-brand transition-colors">KCN/CCN</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{p?.name || slug}</span>
          </nav>

          <SectionHeader
            title={`KCN & CCN tại ${p?.name || slug}`}
            description={`Thông tin chi tiết về các khu công nghiệp và cụm công nghiệp đang hoạt động tại ${p?.name || slug}.`}
            actions={
              <div className="flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-bold text-brand ring-1 ring-brand/10">
                {rows.length} Khu vực
              </div>
            }
          />

          <div className="mt-10">
            {rows.length === 0 ? (
              <EmptyState 
                title="Chưa có dữ liệu" 
                description={`Chúng tôi đang cập nhật thêm dữ liệu KCN/CCN tại ${p?.name || slug}.`} 
              />
            ) : (
              <CardGrid gap="6">
                {rows.map((z: any) => (
                  <Link
                    key={z.id}
                    to={z.kind === "ccn" ? "/cum-cong-nghiep/$slug" : "/khu-cong-nghiep/$slug"}
                    params={{ slug: z.slug }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {z.banner_url ? (
                        <img src={z.banner_url} alt={z.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="line-clamp-2 font-bold group-hover:text-brand">{z.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {z.province}</span>
                        {z.area_ha && <span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" strokeWidth={1.5} /> {z.area_ha} ha</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </CardGrid>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
