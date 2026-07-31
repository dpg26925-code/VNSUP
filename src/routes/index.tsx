import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpRight, Building2, Cpu, Factory, Package, Scissors, Wrench, Zap, Sparkles, FileSearch, Send, ChevronLeft, ChevronRight } from "lucide-react";
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
    links: [
      { rel: "canonical", href: HOME_URL },
      { rel: "alternate", hrefLang: "vi", href: HOME_URL },
      { rel: "alternate", hrefLang: "x-default", href: HOME_URL },
    ],
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
  const [stats, setStats] = useState({ companies: 0, industries: INDUSTRIES.length, provinces: PROVINCES.length, rating: 0 });

  useEffect(() => {
    supabase
      .from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("featured", true)
      .limit(6)
      .then(({ data }) => setFeatured((data ?? []) as CompanyCardProps[]));
    supabase.from("companies").select("id", { count: "exact", head: true })
      .then(({ count }) => setStats((s) => ({ ...s, companies: count ?? 0 })));
    supabase.from("company_reviews").select("rating").eq("status", "published").limit(1000)
      .then(({ data }) => {
        const rows = data ?? [];
        if (rows.length === 0) return;
        const avg = rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rows.length;
        setStats((s) => ({ ...s, rating: Math.round(avg * 10) / 10 }));
      });
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
          <FeaturedCarousel items={featured} />
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Quy trình</div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">VNSupplier hoạt động thế nào</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: Search, t: "1. Tìm kiếm", d: "Tìm nhà máy theo ngành, tỉnh thành, quy mô và năng lực sản xuất." },
            { Icon: FileSearch, t: "2. Xem hồ sơ", d: "So sánh năng lực, chứng nhận, sản phẩm và đánh giá thực tế." },
            { Icon: Send, t: "3. Yêu cầu báo giá", d: "Gửi RFQ trực tiếp tới nhà máy, không qua trung gian." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="mt-4 font-semibold">{t}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold tracking-tight">Bạn là nhà máy?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Đăng hồ sơ năng lực miễn phí, nhận yêu cầu báo giá từ buyer trong nước và quốc tế.</p>
            <Link to="/auth" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:-translate-y-px hover:bg-brand/90">
              Đăng nhà máy <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold tracking-tight">Cần tìm nhà cung cấp?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Tìm kiếm bằng AI, xem hồ sơ đã xác thực và gửi RFQ chỉ trong vài phút.</p>
            <Link to="/search" className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-brand hover:text-brand">
              Tìm nhà cung cấp <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

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

function FeaturedCarousel({ items }: { items: CompanyCardProps[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    const target = ((next % items.length) + items.length) % items.length;
    setIdx(target);
    track.scrollTo({ left: target * (card.offsetWidth + 20), behavior: "smooth" });
  }

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => goTo(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, items.length]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((c) => (
          <div key={c.slug} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
            <CompanyCard {...c} />
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button type="button" aria-label="Trước" onClick={() => goTo(idx - 1)} className="rounded-full border border-border p-1.5 hover:border-brand hover:text-brand">
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          {items.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              aria-label={`Tới thẻ ${i + 1}`}
              onClick={() => goTo(i)}
              className={"h-1.5 rounded-full transition-all " + (i === idx ? "w-6 bg-brand" : "w-1.5 bg-border")}
            />
          ))}
          <button type="button" aria-label="Sau" onClick={() => goTo(idx + 1)} className="rounded-full border border-border p-1.5 hover:border-brand hover:text-brand">
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
