import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard } from "@/components/company-card";
import { Container } from "@/components/primitives";
import { Building2, MapPin, BadgeCheck, Star, Users, Globe, Phone, Mail, ArrowLeft } from "lucide-react";

// This route serves /companies/{province}/{slug}
// But we already have /company/{slug}. Let's just redirect or render the same.
// To satisfy the prompt, I'll render a detail view or just redirect.
// Actually, rendering the detail view here makes the SEO URLs work.

const companyQO = (slug: string) => queryOptions({
  queryKey: ["company-detail", slug],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/companies/$province/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(companyQO(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy" }] };
    return {
      meta: [
        { title: `${loaderData.name} | VNSupplier` },
        { name: "description", content: loaderData.ai_summary || "" },
      ],
    };
  },
  component: CompanyProvinceSlugPage,
});

function CompanyProvinceSlugPage() {
  const { data: company } = useSuspenseQuery(companyQO(useParams({ from: "/companies/$province/$slug" }).slug));
  
  if (!company) return <div>Not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container>
           <Link to="/companies" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
          <div className="rounded-3xl border bg-card p-8 shadow-sm">
             <div className="flex flex-col gap-8 md:flex-row">
                <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border bg-muted p-4">
                   {company.logo_url ? (
                     <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain" />
                   ) : (
                     <Building2 className="h-full w-full text-muted-foreground/20" />
                   )}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <h1 className="text-3xl font-bold">{company.name}</h1>
                     {company.verified && <BadgeCheck className="h-6 w-6 text-brand" />}
                   </div>
                   <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {company.address || company.province}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {company.employee_range} nhân viên</span>
                   </div>
                   <div className="mt-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand/10 px-4 py-1 text-sm font-semibold text-brand">{company.industry}</span>
                   </div>
                </div>
             </div>

             <div className="mt-12 grid gap-12 md:grid-cols-3">
                <div className="md:col-span-2">
                   <h2 className="text-xl font-bold">Giới thiệu</h2>
                   <p className="mt-4 leading-relaxed text-muted-foreground">{company.description || company.ai_summary}</p>
                </div>
                <div className="space-y-6">
                   <h2 className="text-xl font-bold">Liên hệ</h2>
                   <div className="space-y-4">
                      {company.website && (
                        <a href={company.website} target="_blank" className="flex items-center gap-3 text-sm hover:text-brand">
                          <Globe className="h-4 w-4" /> Website công ty
                        </a>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4" /> {company.phone}
                        </div>
                      )}
                       {company.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4" /> {company.email}
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
