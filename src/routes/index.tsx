import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  Building2,
  Cpu,
  Factory,
  Package,
  Scissors,
  Wrench,
  Zap,
  Sparkles,
  FileSearch,
  Send,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  Award,
  Clock,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { INDUSTRIES, PROVINCES, SITE_URL, abs, industryLabel } from "@/lib/factory";

const HOME_TITLE = "VNSupplier — Danh bạ nhà máy & kết nối chuỗi cung ứng sản xuất Việt Nam";
const HOME_DESC =
  "Nền tảng AI tra cứu 2,400+ nhà máy sản xuất Việt Nam: CNC, ép nhựa, điện tử SMT, kim loại tấm, bao bì, cao su, dệt may. Xem hồ sơ năng lực máy móc, chứng chỉ ISO và nhận báo giá trong 24h.";
const HOME_URL = abs("/");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:url", content: HOME_URL },
      { property: "og:image", content: `${SITE_URL}/assets/vnsupplier-logo-light.svg` },
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
  nhua: Factory,
  cnc: Wrench,
  "dien-tu": Cpu,
  "kim-loai": Zap,
  "bao-bi": Package,
  "cao-su": Building2,
  "det-may": Scissors,
};

const TOP_PROVINCES = [
  { name: "Toàn quốc", slug: "all" },
  { name: "Hà Nội", slug: "ha-noi" },
  { name: "TP.HCM", slug: "tp-hcm" },
  { name: "Bình Dương", slug: "binh-duong" },
  { name: "Bắc Ninh", slug: "bac-ninh" },
  { name: "Đồng Nai", slug: "dong-nai" },
  { name: "Hải Phòng", slug: "hai-phong" },
  { name: "Long An", slug: "long-an" },
  { name: "Hải Dương", slug: "hai-duong" },
  { name: "Đà Nẵng", slug: "da-nang" },
];

const TOP_ZONES = [
  { name: "KCN VSIP Bắc Ninh", province: "Bắc Ninh", slug: "kcn-vsip-bac-ninh" },
  { name: "KCN VSIP I & II", province: "Bình Dương", slug: "kcn-vsip-binh-duong" },
  { name: "KCN Tràng Duệ", province: "Hải Phòng", slug: "kcn-trang-due" },
  { name: "KCN Quế Võ", province: "Bắc Ninh", slug: "kcn-que-vo" },
  { name: "KCN Amata", province: "Đồng Nai", slug: "kcn-amata-dong-nai" },
  { name: "Khu Công Nghệ Cao (SHTP)", province: "TP.HCM", slug: "khu-cong-nghe-cao-tp-hcm" },
];

function HomePage() {
  const navigate = useNavigate();

  // Search Omnibar states
  const [q, setQ] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  // Data states
  const [featured, setFeatured] = useState<CompanyCardProps[]>([]);
  const [recent, setRecent] = useState<CompanyCardProps[]>([]);
  const [explorerCompanies, setExplorerCompanies] = useState<CompanyCardProps[]>([]);
  const [stats, setStats] = useState({ companies: 2400, industries: INDUSTRIES.length, provinces: PROVINCES.length, rating: 4.9 });

  // Interactive Factory Explorer states
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState(12);
  const [isLoadingExplorer, setIsLoadingExplorer] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial queries for Featured, Recent, Stats
  useEffect(() => {
    // Featured verified partners
    supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("featured", true)
      .limit(12)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFeatured(data as CompanyCardProps[]);
        }
      });

    // Recent active factories
    supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRecent(data as CompanyCardProps[]);
        }
      });

    // Exact count of companies
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        if (count && count > 0) {
          setStats((s) => ({ ...s, companies: count }));
        }
      });

    // Reviews average
    supabase
      .from("company_reviews")
      .select("rating")
      .eq("status", "published")
      .limit(1000)
      .then(({ data }) => {
        const rows = data ?? [];
        if (rows.length > 0) {
          const avg = rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rows.length;
          setStats((s) => ({ ...s, rating: Math.round(avg * 10) / 10 }));
        }
      });
  }, []);

  // Fetch companies for Interactive Explorer based on tab & province
  useEffect(() => {
    setIsLoadingExplorer(true);
    let query = supabase
      .from("companies")
      .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("status", "approved");

    if (activeTab !== "all") {
      query = query.eq("industry", activeTab);
    }

    if (activeProvinceFilter !== "all") {
      const provObj = TOP_PROVINCES.find((p) => p.slug === activeProvinceFilter);
      if (provObj) {
        query = query.eq("province", provObj.name);
      }
    }

    query
      .order("featured", { ascending: false })
      .order("verified", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(displayLimit + 1)
      .then(({ data }) => {
        setIsLoadingExplorer(false);
        const rows = (data ?? []) as CompanyCardProps[];
        if (rows.length > displayLimit) {
          setHasMore(true);
          setExplorerCompanies(rows.slice(0, displayLimit));
        } else {
          setHasMore(false);
          setExplorerCompanies(rows);
        }
      });
  }, [activeTab, activeProvinceFilter, displayLimit]);

  function handleOmniSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/search",
      search: {
        q: q || undefined,
        industry: selectedIndustry || undefined,
        province: selectedProvince || undefined,
      } as any,
    });
  }

  function handleLoadMore() {
    setDisplayLimit((prev) => prev + 12);
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/20 selection:text-brand">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-card via-background to-background px-4 pt-16 pb-20 sm:px-6 md:pt-24 md:pb-28 lg:px-8">
        {/* Decorative Grid Pattern */}
        <div className="bg-grid-pattern absolute inset-0 -z-10 opacity-60" />
        <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />

        <div className="mx-auto max-w-5xl text-center">
          {/* Status Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand shadow-2xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Nền tảng AI kết nối mạng lưới 2,400+ Nhà máy Sản xuất Việt Nam</span>
          </div>

          {/* Main Title */}
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:leading-[1.15]">
            Tìm Nhà Máy & Đối Tác Gia Công <br className="hidden sm:inline" />
            Sản Xuất Việt Nam <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">bằng AI</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Tra cứu hồ sơ năng lực máy móc, chứng chỉ ISO/SGS, vị trí KCN và gửi yêu cầu báo giá (RFQ) trực tiếp tới hàng ngàn nhà máy đã xác thực không qua trung gian.
          </p>

          {/* Smart Omnibar Search Box */}
          <form
            onSubmit={handleOmniSearch}
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border border-border/90 bg-card p-2.5 shadow-xl shadow-slate-900/5 sm:flex-row sm:items-center sm:gap-1.5"
          >
            {/* Keyword Input */}
            <div className="flex flex-1 items-center gap-2 px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2.2} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm CNC chính xác, ép nhựa, SMT, bao bì carton…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-border" />

            {/* Industry Selector */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="rounded-lg bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground outline-none hover:bg-secondary cursor-pointer"
            >
              <option value="">Tất cả ngành nghề</option>
              {INDUSTRIES.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
            </select>

            {/* Province Selector */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="rounded-lg bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground outline-none hover:bg-secondary cursor-pointer"
            >
              <option value="">Toàn quốc</option>
              {TOP_PROVINCES.filter((p) => p.slug !== "all").map((p) => (
                <option key={p.slug} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Submit Button */}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand/90 hover:shadow-lg active:scale-95"
            >
              <Search className="h-4 w-4" strokeWidth={2.5} />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* Quick Keyword Suggestions */}
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Từ khóa thịnh hành:</span>
            {["CNC 5 trục", "Ép nhựa kỹ thuật", "SMT PCBA", "Gia công kim loại tấm", "Phòng sạch ISO", "Khuôn dập"].map((k) => (
              <button
                key={k}
                onClick={() => {
                  setQ(k);
                  navigate({ to: "/search", search: { q: k } as any });
                }}
                className="rounded-lg border border-border/80 bg-card/60 px-2.5 py-1 text-foreground/80 hover:border-brand hover:text-brand transition-colors"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Live Platform Stats */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Nhà máy & Xưởng", value: stats.companies.toLocaleString(), suffix: "+", icon: Factory },
              { label: "Ngành sản xuất", value: stats.industries, suffix: " Ngành", icon: Layers },
              { label: "Tỉnh thành", value: stats.provinces, suffix: " Tỉnh/TP", icon: MapPin },
              { label: "Đánh giá uy tín", value: stats.rating > 0 ? stats.rating : 4.9, suffix: "/5.0 ⭐", icon: Award },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-xs transition-all hover:border-brand/40 shadow-xs"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                    <Icon className="h-3.5 w-3.5 text-brand" />
                    <span>{s.label}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground">
                    {s.value}
                    <span className="text-xs font-bold text-brand ml-0.5">{s.suffix}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Badges Bar */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Hồ sơ xác thực
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand" /> Phản hồi RFQ trong 24h
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-sky-500" /> Chuẩn ISO & Đạt tiêu chuẩn xuất khẩu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-amber-500" /> Miễn phí kết nối Buyer
            </span>
          </div>
        </div>
      </section>

      {/* MAIN FEATURE: Interactive Factory Explorer on Homepage */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
              <Factory className="h-4 w-4" />
              <span>Danh bạ sản xuất Việt Nam</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Khám Phá Nhà Máy & Doanh Nghiệp Sản Xuất
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lọc theo ngành nghề gia công hoặc khu vực tỉnh thành để tìm đối tác sản xuất nhanh chóng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/companies"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-brand hover:text-brand shadow-xs"
            >
              <span>Xem tất cả danh bạ</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Industry Filter Tabs */}
        <div className="mt-6 flex overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-2">
          <button
            onClick={() => {
              setActiveTab("all");
              setDisplayLimit(12);
            }}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-brand text-white shadow-sm ring-2 ring-brand/30"
                : "border border-border bg-card text-foreground/80 hover:bg-secondary hover:text-foreground"
            }`}
          >
            Tất cả ngành nghề ({stats.companies})
          </button>
          {INDUSTRIES.map((ind) => {
            const Icon = INDUSTRY_ICON[ind.slug] ?? Factory;
            const isActive = activeTab === ind.slug;
            return (
              <button
                key={ind.slug}
                onClick={() => {
                  setActiveTab(ind.slug);
                  setDisplayLimit(12);
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-brand text-white shadow-sm ring-2 ring-brand/30"
                    : "border border-border bg-card text-foreground/80 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{ind.name}</span>
              </button>
            );
          })}
        </div>

        {/* Province Quick Filter Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/50 p-2.5">
          <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground px-2">
            <MapPin className="h-3.5 w-3.5 text-brand" /> Khu vực:
          </span>
          {TOP_PROVINCES.map((prov) => {
            const isSelected = activeProvinceFilter === prov.slug;
            return (
              <button
                key={prov.slug}
                onClick={() => {
                  setActiveProvinceFilter(prov.slug);
                  setDisplayLimit(12);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {prov.name}
              </button>
            );
          })}
        </div>

        {/* Company Card Grid */}
        <div className="mt-8">
          {isLoadingExplorer ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card/60 p-5" />
              ))}
            </div>
          ) : explorerCompanies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Factory className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">Không tìm thấy nhà máy nào phù hợp</h3>
              <p className="mt-1 text-sm text-muted-foreground">Thử đổi ngành nghề hoặc khu vực tìm kiếm khác.</p>
              <button
                onClick={() => {
                  setActiveTab("all");
                  setActiveProvinceFilter("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand/90"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {explorerCompanies.map((c) => (
                  <CompanyCard key={c.slug} {...c} />
                ))}
              </div>

              {/* Load More Button & View All Links */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3 text-sm font-bold text-foreground shadow-xs transition-all hover:border-brand hover:text-brand active:scale-95"
                  >
                    <span>Xem thêm nhà máy (+12)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <Link
                  to="/companies"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-secondary px-8 py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <span>Mở toàn bộ danh bạ</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Verified Partners Showcase */}
      {featured.length > 0 && (
        <section className="border-y border-border/80 bg-card/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Đối tác được xác minh hồ sơ</span>
                </div>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                  Nhà Máy Tiêu Biểu & Đối Tác Chiến Lược
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Các doanh nghiệp sản xuất đã xác minh năng lực máy móc, chứng chỉ và kiểm toán thực tế.
                </p>
              </div>
              <Link
                to="/search"
                className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
              >
                Xem tất cả đối tác <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <FeaturedCarousel items={featured} />
          </div>
        </section>
      )}

      {/* Explore by Manufacturing Industry Cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand">Ngành công nghiệp trọng điểm</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Khám Phá Theo Lĩnh Vực Sản Xuất
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tra cứu nhà máy theo chuyên ngành kỹ thuật và giải pháp gia công.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {INDUSTRIES.map((ind) => {
            const Icon = INDUSTRY_ICON[ind.slug] ?? Factory;
            return (
              <Link
                key={ind.slug}
                to="/industry/$slug"
                params={{ slug: ind.slug }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-brand/50 hover:shadow-md"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                    {ind.name}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{ind.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Industrial Parks & Zones Section */}
      <section className="border-t border-border/80 bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand">Hạ tầng công nghiệp</div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                Khu Công Nghiệp & Cụm Công Nghiệp Trọng Điểm
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tra cứu nhà máy theo từng cụm KCN lớn tại các vùng kinh tế động lực.
              </p>
            </div>
            <Link
              to="/kcn-ccn"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              Xem tất cả KCN/CCN <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOP_ZONES.map((zone) => (
              <Link
                key={zone.slug}
                to="/kcn-ccn"
                className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-brand/50 hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                      {zone.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{zone.province}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / 3-Step Sourcing Workflow */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand">Quy trình kết nối</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Tìm Nhà Cung Cấp Chuẩn Xác Trong 3 Bước
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Quy trình tinh gọn giúp doanh nghiệp tiết kiệm đến 70% thời gian tìm kiếm và thẩm định nhà cung cấp.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              Icon: Search,
              t: "1. Tìm kiếm & Lọc năng lực",
              d: "Tìm theo ngành nghề gia công, loại máy móc (CNC, ép nhựa, SMT), quy mô công nhân và vị trí KCN.",
            },
            {
              step: "02",
              Icon: FileSearch,
              t: "2. Thẩm định hồ sơ & Chứng nhận",
              d: "Xem chi tiết danh sách thiết bị, hình ảnh thực tế xưởng sản xuất, chứng nhận ISO/FDA và đánh giá.",
            },
            {
              step: "03",
              Icon: Send,
              t: "3. Nhận báo giá RFQ trực tiếp",
              d: "Gửi yêu cầu báo giá (RFQ) trực tiếp tới ban giám đốc nhà máy, nhận phản hồi và kết nối trong 24h.",
            },
          ].map(({ step, Icon, t, d }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-brand/40"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <span className="text-3xl font-black text-muted-foreground/30">{step}</span>
              </div>
              <div className="mt-4 text-base font-bold text-foreground">{t}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dual CTA Banner for Buyers & Manufacturers */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Manufacturer Card */}
          <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 via-card to-card p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand">
              <Factory className="h-3.5 w-3.5" /> Dành cho Nhà máy
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Bạn là Nhà máy sản xuất tại Việt Nam?
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Đăng ký hồ sơ năng lực miễn phí để tiếp cận hàng ngàn buyer doanh nghiệp trong và ngoài nước đang tìm kiếm đối tác gia công mỗi ngày.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand/90 hover:shadow-lg"
            >
              <span>Đăng ký hồ sơ nhà máy</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Buyer Card */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/40 via-card to-card p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
              <Briefcase className="h-3.5 w-3.5" /> Dành cho Buyer & Doanh nghiệp
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Cần tìm nguồn cung & đối tác gia công?
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Sử dụng công cụ tìm kiếm AI thông minh để kết nối trực tiếp với các nhà máy đạt tiêu chuẩn, nhận báo giá nhanh chóng và bảo mật.
            </p>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-xs font-bold text-foreground transition-all hover:border-brand hover:text-brand"
            >
              <span>Tìm kiếm nhà cung cấp</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Provinces Directory Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/70">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand">Khu vực địa lý</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Tỉnh Thành Sản Xuất Trọng Điểm
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mạng lưới nhà máy phủ khắp 34 tỉnh thành và vùng kinh tế trọng điểm cả nước.
            </p>
          </div>
          <Link
            to="/companies"
            className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
          >
            Xem tất cả 34 tỉnh thành <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {PROVINCES.filter((p) =>
            [
              "tp-hcm",
              "ha-noi",
              "binh-duong",
              "dong-nai",
              "hai-phong",
              "bac-ninh",
              "da-nang",
              "long-an",
              "hung-yen",
              "quang-ninh",
            ].includes(p.slug)
          ).map((p) => (
            <Link
              key={p.slug}
              to="/province/$slug"
              params={{ slug: p.slug }}
              className="group flex items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-3.5 transition-all hover:border-brand/50 hover:shadow-2xs"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-brand transition-colors">
                {p.name}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:text-brand group-hover:translate-x-0.5" />
            </Link>
          ))}
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
    const t = setInterval(() => goTo(idx + 1), 6000);
    return () => clearInterval(t);
  }, [idx, items.length]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-0"
      >
        {items.map((c) => (
          <div key={c.slug} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
            <CompanyCard {...c} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Trước"
            onClick={() => goTo(idx - 1)}
            className="rounded-full border border-border bg-card p-2 text-foreground hover:border-brand hover:text-brand transition-colors shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {items.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              aria-label={`Tới thẻ ${i + 1}`}
              onClick={() => goTo(i)}
              className={"h-2 rounded-full transition-all " + (i === idx ? "w-8 bg-brand" : "w-2 bg-border")}
            />
          ))}
          <button
            type="button"
            aria-label="Sau"
            onClick={() => goTo(idx + 1)}
            className="rounded-full border border-border bg-card p-2 text-foreground hover:border-brand hover:text-brand transition-colors shadow-2xs"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
