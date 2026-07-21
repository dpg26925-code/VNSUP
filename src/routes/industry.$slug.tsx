import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { INDUSTRIES, industryBySlug } from "@/lib/factory";

export const Route = createFileRoute("/industry/$slug")({
  loader: ({ params }) => {
    const i = industryBySlug(params.slug);
    if (!i) throw notFound();
    return i;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy ngành" }, { name: "robots", content: "noindex" }] };
    const title = `Top nhà máy ${loaderData.name} tại Việt Nam | FactoryHub`;
    const desc = `Danh sách nhà máy ${loaderData.name} uy tín, có địa chỉ, năng lực sản xuất và tóm tắt AI. ${loaderData.desc}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: IndustryPage,
});

function IndustryPage() {
  const i = Route.useLoaderData();
  const [rows, setRows] = useState<CompanyCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured")
      .eq("industry", i.name)
      .order("featured", { ascending: false })
      .order("verified", { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as CompanyCardProps[]); setLoading(false); });
  }, [i.name]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link> <span className="mx-1">/</span>
          <span className="text-foreground">Ngành {i.name}</span>
        </nav>
        <h1 className="text-2xl font-bold md:text-3xl">Nhà máy {i.name} tại Việt Nam</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{i.desc}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {INDUSTRIES.filter((x) => x.slug !== i.slug).map((x) => (
            <Link key={x.slug} to="/industry/$slug" params={{ slug: x.slug }} className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary">{x.name}</Link>
          ))}
        </div>

        <div className="mt-6">
          {loading ? <div className="text-sm text-muted-foreground">Đang tải…</div> :
            rows.length === 0 ? <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">Chưa có nhà máy trong ngành này.</div> :
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
