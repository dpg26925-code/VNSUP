import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES, provinceBySlug } from "@/lib/factory";
import { Building2, MapPin, BadgeCheck } from "lucide-react";
import { Container } from "@/components/primitives";

const provinceCompaniesQO = (provinceName: string) => queryOptions({
  queryKey: ["companies-list", provinceName],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,logo_url,featured,verified,status")
      .eq("status", "approved")
      .eq("province", provinceName)
      .order("featured", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/companies/$province")({
  loader: ({ context, params }) => {
    const p = provinceBySlug(params.province);
    if (!p) return null;
    return context.queryClient.ensureQueryData(provinceCompaniesQO(p.name));
  },
  head: ({ params }) => {
    const p = provinceBySlug(params.province);
    const title = `Doanh nghiệp sản xuất tại ${p?.name || params.province} | VNSupplier`;
    return {
      meta: [
        { title },
        { name: "description", content: `Danh sách các nhà máy và công ty sản xuất tại ${p?.name || params.province}. Tìm kiếm đối tác sản xuất uy tín.` },
      ],
    };
  },
  component: ProvinceCompaniesPage,
});

function ProvinceCompaniesPage() {
  const { province: slug } = useParams({ from: "/companies/$province" });
  const p = provinceBySlug(slug);
  const { data: rows } = useSuspenseQuery(provinceCompaniesQO(p?.name || ""));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/companies" className="hover:text-foreground">Doanh nghiệp</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{p?.name || slug}</span>
          </nav>

          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Doanh nghiệp tại {p?.name || slug}</h1>
            <div className="text-sm text-muted-foreground">{rows.length} kết quả</div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="Chưa có dữ liệu" description={`Chúng tôi chưa có dữ liệu doanh nghiệp tại ${p?.name || slug}.`} />
              </div>
            ) : (
              rows.map((c: any) => (
                <Link
                  key={c.id}
                  to="/company/$slug"
                  params={{ slug: c.slug }}
                  className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="h-full w-full object-contain p-4 transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 font-bold group-hover:text-brand">{c.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.province}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5">{c.industry}</span>
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
