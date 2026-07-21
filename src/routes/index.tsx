import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ArrowRight, Building2, Cpu, Factory, Package, Scissors, Wrench, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { INDUSTRIES, PROVINCES } from "@/lib/factory";

const HOME_TITLE = "FactoryHub Vietnam — Tìm nhà máy sản xuất bằng AI";
const HOME_DESC = "Danh bạ 2,400+ nhà máy Việt Nam. Tìm theo năng lực sản xuất, ngành, tỉnh. Có tóm tắt AI cho mỗi hồ sơ.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FactoryHub Vietnam",
          url: "/",
          potentialAction: {
            "@type": "SearchAction",
            target: "/search?q={query}",
            "query-input": "required name=query",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

const INDUSTRY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  nhua: Factory, cnc: Wrench, "dien-tu": Cpu, "kim-loai": Zap, "bao-bi": Package, "cao-su": Building2, "det-may": Scissors,
};

function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<CompanyCardProps[]>([]);
  const [stats, setStats] = useState({ companies: 0, industries: INDUSTRIES.length, provinces: PROVINCES.length });

  useEffect(() => {
    supabase
      .from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured")
      .eq("featured", true)
      .limit(6)
      .then(({ data }) => setFeatured((data ?? []) as CompanyCardProps[]));
    supabase.from("companies").select("id", { count: "exact", head: true })
      .then(({ count }) => setStats((s) => ({ ...s, companies: count ?? 0 })));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Tìm nhà máy sản xuất Việt Nam <span className="text-primary">bằng AI</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Hồ sơ nhà máy chi tiết • Năng lực rõ ràng • Tìm kiếm theo khả năng sản xuất
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q: q || undefined } as any }); }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-lg border bg-card p-2 shadow-sm"
            >
              <Search className="ml-2 h-5 w-5 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm nhà máy CNC, ép nhựa, SMT…"
                className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tìm</button>
            </form>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { l: "Nhà máy", v: stats.companies || "20+" },
                { l: "Ngành", v: stats.industries },
                { l: "Tỉnh/TP", v: stats.provinces },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border bg-card px-4 py-3">
                  <div className="text-2xl font-bold text-primary">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-bold md:text-2xl">Ngành sản xuất</h2>
          <Link to="/search" className="text-sm text-primary hover:underline">Xem tất cả →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {INDUSTRIES.map((i) => {
            const Icon = INDUSTRY_ICON[i.slug] ?? Factory;
            return (
              <Link key={i.slug} to="/industry/$slug" params={{ slug: i.slug }}
                className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition hover:border-primary hover:shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{i.name}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">Nhà máy nổi bật</h2>
              <p className="text-sm text-muted-foreground">Được xác thực và cập nhật gần đây.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CompanyCard key={c.slug} {...c} />)}
          </div>
        </section>
      )}

      {/* Provinces */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold md:text-2xl">Khu vực trọng điểm</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {PROVINCES.map((p) => (
            <Link key={p.slug} to="/province/$slug" params={{ slug: p.slug }}
              className="flex items-center justify-between rounded-lg border bg-card p-4 hover:border-primary hover:shadow-sm">
              <span className="font-medium">{p.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
