import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmptyState } from "@/components/skeleton-card";
import { PROVINCES, provinceBySlug } from "@/lib/factory";
import { Building2, MapPin, BadgeCheck, Star } from "lucide-react";
import { Container, CardGrid, SectionHeader } from "@/components/primitives";
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
    const url = `https://vnsupplier.cloud/companies/${params.province}`;
    return {
      meta: [
        { title },
        { name: "description", content: `Danh sách các nhà máy và công ty sản xuất tại ${p?.name || params.province}. Tìm kiếm đối tác sản xuất uy tín.` },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
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
          <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <span className="text-border">/</span>
            <Link to="/companies" className="hover:text-brand transition-colors">Doanh nghiệp</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{p?.name || slug}</span>
          </nav>

          <SectionHeader
            title={`Doanh nghiệp tại ${p?.name || slug}`}
            description={`Danh sách các nhà máy và công ty sản xuất uy tín tọa lạc tại khu vực ${p?.name || slug}.`}
            actions={
              <div className="flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-bold text-brand ring-1 ring-brand/10">
                {rows.length} Doanh nghiệp
              </div>
            }
          />

          <div className="mt-10">
            {rows.length === 0 ? (
              <EmptyState 
                title="Chưa có dữ liệu" 
                description={`Chúng tôi đang cập nhật thêm dữ liệu doanh nghiệp tại ${p?.name || slug}.`} 
              />
            ) : (
              <CardGrid gap="6">
                {rows.map((c: any) => <CompanyCard key={c.slug} {...c} />)}
              </CardGrid>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
