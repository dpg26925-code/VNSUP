import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { SkeletonCard, EmptyState } from "@/components/skeleton-card";
import { INDUSTRIES, industryBySlug, abs } from "@/lib/factory";

export const Route = createFileRoute("/industry/$slug")({
  loader: ({ params }) => {
    const i = industryBySlug(params.slug);
    if (!i) throw notFound();
    return i;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy ngành" }, { name: "robots", content: "noindex" }] };
    const title = `Top nhà máy ${loaderData.name} tại Việt Nam | VNSupplier`;
    const desc = `Danh sách nhà máy ${loaderData.name} uy tín, có địa chỉ, năng lực sản xuất và tóm tắt AI. ${loaderData.desc}`;
    const url = abs(`/industry/${params.slug}`);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "vi", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: abs("/") },
            { "@type": "ListItem", position: 2, name: `Ngành ${loaderData.name}`, item: url },
          ],
        }),
      }],
    };
  },
  component: IndustryPage,
});


function IndustryPage() {
  const i = Route.useLoaderData();
  const [rows, setRows] = useState<CompanyCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"featured" | "name" | "province">("featured");

  useEffect(() => {
    setLoading(true);
    let qb = supabase.from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("industry", i.name);
    if (sort === "featured") qb = qb.order("featured", { ascending: false }).order("verified", { ascending: false });
    else if (sort === "name") qb = qb.order("name", { ascending: true });
    else qb = qb.order("province", { ascending: true });
    qb.then(({ data }) => { setRows((data ?? []) as CompanyCardProps[]); setLoading(false); });
  }, [i.name, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link> <span className="mx-1">/</span>
          <span className="text-foreground">Ngành {i.name}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Nhà máy {i.name} tại Việt Nam</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{i.desc}</p>
          </div>
          {!loading && <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{rows.length} nhà máy</div>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {INDUSTRIES.filter((x) => x.slug !== i.slug).map((x) => (
            <Link key={x.slug} to="/industry/$slug" params={{ slug: x.slug }} className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary">{x.name}</Link>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, k) => <SkeletonCard key={k} />)}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="Chưa có nhà máy trong ngành này" description="Chúng tôi đang cập nhật thêm hồ sơ. Bạn có thể xem ngành khác hoặc gửi yêu cầu tìm nhà máy." />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>{rows.length} nhà máy</span>
                <div className="flex items-center gap-2 text-xs">
                  <label>Sắp xếp:</label>
                  <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border bg-card px-2 py-1">
                    <option value="featured">Nổi bật</option>
                    <option value="name">Tên A→Z</option>
                    <option value="province">Tỉnh/TP</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((c) => <CompanyCard key={c.slug} {...c} />)}
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
