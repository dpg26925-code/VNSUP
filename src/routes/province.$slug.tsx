import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { PROVINCES, provinceBySlug, abs } from "@/lib/factory";

export const Route = createFileRoute("/province/$slug")({
  loader: ({ params }) => {
    const p = provinceBySlug(params.slug);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy tỉnh" }, { name: "robots", content: "noindex" }] };
    const title = `Công ty sản xuất tại ${loaderData.name} | FactoryHub Vietnam`;
    const desc = `Danh sách nhà máy sản xuất tại ${loaderData.name}: CNC, ép nhựa, điện tử, kim loại, bao bì và nhiều ngành khác.`;
    const url = abs(`/province/${params.slug}`);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: abs("/") },
            { "@type": "ListItem", position: 2, name: loaderData.name, item: url },
          ],
        }),
      }],
    };
  },
  component: ProvincePage,
});


function ProvincePage() {
  const p = Route.useLoaderData();
  const [rows, setRows] = useState<CompanyCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured")
      .eq("province", p.name)
      .order("featured", { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as CompanyCardProps[]); setLoading(false); });
  }, [p.name]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link> <span className="mx-1">/</span>
          <span className="text-foreground">{p.name}</span>
        </nav>
        <h1 className="text-2xl font-bold md:text-3xl">Nhà máy tại {p.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Danh sách các nhà máy sản xuất đang hoạt động tại {p.name}, cập nhật từ FactoryHub.</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {PROVINCES.filter((x) => x.slug !== p.slug).map((x) => (
            <Link key={x.slug} to="/province/$slug" params={{ slug: x.slug }} className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary">{x.name}</Link>
          ))}
        </div>

        <div className="mt-6">
          {loading ? <div className="text-sm text-muted-foreground">Đang tải…</div> :
            rows.length === 0 ? <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">Chưa có nhà máy tại tỉnh này.</div> :
            <>
              <div className="mb-3 text-sm text-muted-foreground">{rows.length} nhà máy</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((c) => <CompanyCard key={c.slug} {...c} />)}
              </div>
            </>}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
