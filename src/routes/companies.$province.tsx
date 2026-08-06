import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES, provinceBySlug } from "@/lib/factory";
import { Building2, MapPin, BadgeCheck, Star } from "lucide-react";
import { Container } from "@/components/primitives";
import { CompanyCard } from "@/components/company-card";

const provinceCompaniesQO = (provinceName: string) => queryOptions({
  queryKey: ["companies-list", provinceName],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="Chưa có dữ liệu" description={`Chúng tôi chưa có dữ liệu doanh nghiệp tại ${p?.name || slug}.`} />
              </div>
            ) : (
              rows.map((c: any) => <CompanyCard key={c.slug} {...c} />)
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
