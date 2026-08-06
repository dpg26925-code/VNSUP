import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES, provinceBySlug } from "@/lib/factory";
import { Building2, MapPin, Ruler, BadgeCheck } from "lucide-react";
import { Container } from "@/components/primitives";

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
    return {
      meta: [
        { title },
        { name: "description", content: `Tra cứu danh sách các khu công nghiệp (KCN) và cụm công nghiệp (CCN) tại ${p?.name || params.province}.` },
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
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/kcn-ccn" className="hover:text-foreground">KCN/CCN</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{p?.name || slug}</span>
          </nav>

          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-3xl font-bold">KCN & CCN tại {p?.name || slug}</h1>
            <div className="text-sm text-muted-foreground">{rows.length} kết quả</div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="Chưa có dữ liệu" description={`Chúng tôi chưa có dữ liệu KCN/CCN tại ${p?.name || slug}.`} />
              </div>
            ) : (
              rows.map((z: any) => (
                <Link
                  key={z.id}
                  to={z.kind === "ccn" ? "/cum-cong-nghiep/$slug" : "/khu-cong-nghiep/$slug"}
                  params={{ slug: z.slug }}
                  className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-lg"
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
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {z.province}</span>
                      {z.area_ha && <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> {z.area_ha} ha</span>}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
