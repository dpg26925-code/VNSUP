import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight, Building2, Cpu, Factory, Package, Scissors, Wrench, Zap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { INDUSTRIES, PROVINCES, SITE_URL, abs } from "@/lib/factory";

const HOME_TITLE = "VNSupplier — Danh bạ nhà máy & nhà cung cấp Việt Nam bằng AI";
const HOME_DESC = "vnsupplier.cloud: tìm 2,400+ nhà máy Việt Nam theo năng lực sản xuất, ngành, tỉnh. CNC, ép nhựa, SMT PCBA, kim loại, bao bì, cao su, dệt may — có tóm tắt AI cho mỗi hồ sơ.";
const HOME_URL = abs("/");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:url", content: HOME_URL },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "VNSupplier",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/search?q={query}`,
            "query-input": "required name=query",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

const INDUSTRY_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
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
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
            vnsupplier.cloud — Mạng lưới nhà cung cấp đã xác thực
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl">
            Tìm nhà cung cấp<br className="hidden md:block" /> sản xuất Việt Nam <span className="text-brand">bằng AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            VNSupplier kết nối buyer với nhà máy đã xác thực trong 24 giờ. Hồ sơ năng lực chi tiết, tóm tắt AI, liên hệ trực tiếp không qua trung gian.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q: q || undefined } as any }); }}
            className="mx-auto mt-10 flex max-w-xl items-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition focus-within:ring-2 focus-within:ring-brand/25"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm nhà máy CNC, ép nhựa, SMT…"
                className="w-full bg-transparent py-2.5 text-base outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:-translate-y-px hover:bg-brand/90">
              <Search className="h-4 w-4" strokeWidth={2.25} />
              Tìm ngay
            </button>
          </form>
          <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Gợi ý:</span>
            {["CNC chính xác", "Ép nhựa", "SMT PCBA", "Cắt laser"].map((k) => (
              <button key={k} onClick={() => { setQ(k); navigate({ to: "/search", search: { q: k } as any }); }} className="rounded-full border border-border bg-card px-2.5 py-0.5 hover:border-brand hover:text-brand">{k}</button>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-3">
            {[
              { l: "Nhà máy", v: stats.companies || 20, suffix: "+" },
              { l: "Ngành", v: stats.industries, suffix: "" },
              { l: "Tỉnh/TP", v: stats.provinces, suffix: "" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="text-2xl font-bold text-foreground">{s.v}{s.suffix}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-brand">Ngành sản xuất</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Khám phá theo lĩnh vực</h2>
          </div>
          <Link to="/search" className="hidden text-sm font-semibold text-muted-foreground hover:text-brand sm:inline-flex sm:items-center sm:gap-1">
            Xem tất cả <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {INDUSTRIES.map((i) => {
            const Icon = INDUSTRY_ICON[i.slug] ?? Factory;
            return (
              <Link key={i.slug} to="/industry/$slug" params={{ slug: i.slug }}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition hover:border-brand/50 hover:shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-foreground transition group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="text-sm font-semibold">{i.name}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-brand">Nhà máy tiêu biểu</div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Đối tác được chọn lọc</h2>
              <p className="mt-1 text-sm text-muted-foreground">Được xác thực và cập nhật gần đây.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CompanyCard key={c.slug} {...c} />)}
          </div>
        </section>
      )}

      {/* Provinces */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Khu vực</div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Tỉnh thành trọng điểm</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {PROVINCES.filter((p) => [
            "tp-hcm","ha-noi","binh-duong","dong-nai","hai-phong",
            "bac-ninh","da-nang","long-an","hung-yen","quang-ninh",
          ].includes(p.slug)).map((p) => (
            <Link key={p.slug} to="/province/$slug" params={{ slug: p.slug }}
              className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-4 transition hover:border-brand/50 hover:shadow-sm">
              <span className="font-medium">{p.name}</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-brand" strokeWidth={2} />
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/search" className="text-sm font-medium text-brand hover:underline">Xem tất cả tỉnh thành →</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
