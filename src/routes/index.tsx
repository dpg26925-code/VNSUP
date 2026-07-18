import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Người nổi tiếng — Danh bạ nhân vật Việt & thế giới" },
      {
        name: "description",
        content:
          "Khám phá hồ sơ người nổi tiếng: ca sĩ, diễn viên, vận động viên, doanh nhân. Tiểu sử, thành tích và mạng xã hội cập nhật.",
      },
      { property: "og:title", content: "Người nổi tiếng — Danh bạ nhân vật Việt & thế giới" },
      {
        property: "og:description",
        content:
          "Khám phá hồ sơ người nổi tiếng: ca sĩ, diễn viên, vận động viên, doanh nhân. Tiểu sử, thành tích và mạng xã hội cập nhật.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cheerful-wave-works.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://cheerful-wave-works.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Người nổi tiếng",
          url: "https://cheerful-wave-works.lovable.app/",
          inLanguage: "vi-VN",
          description:
            "Danh bạ nhân vật nổi tiếng Việt Nam và thế giới: ca sĩ, diễn viên, vận động viên, doanh nhân, KOL.",
          potentialAction: {
            "@type": "SearchAction",
            target:
              "https://cheerful-wave-works.lovable.app/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Người nổi tiếng",
          url: "https://cheerful-wave-works.lovable.app/",
        }),
      },
    ],
  }),
  component: Home,
});


const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "singer", label: "Ca sĩ" },
  { value: "actor", label: "Diễn viên" },
  { value: "athlete", label: "VĐV" },
  { value: "entrepreneur", label: "Doanh nhân" },
  { value: "influencer", label: "KOL" },
  { value: "other", label: "Khác" },
];

type Celeb = {
  id: string;
  slug: string;
  name: string;
  stage_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  category: string;
  nationality: string | null;
  featured: boolean;
  views: number;
};

const display = { fontFamily: "var(--font-display)" };

function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const { data: celebs = [], isLoading } = useQuery({
    queryKey: ["celebrities"],
    queryFn: async (): Promise<Celeb[]> => {
      const { data, error } = await supabase
        .from("celebrities")
        .select(
          "id, slug, name, stage_name, avatar_url, cover_url, category, nationality, featured, views"
        )
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("views", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Celeb[];
    },
  });

  const filtered = useMemo(() => {
    return celebs.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.stage_name ?? "").toLowerCase().includes(q) ||
          (c.nationality ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [celebs, category, query]);

  const featuredCount = celebs.filter((c) => c.featured).length;
  const trending = celebs[0];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader onSearch={setQuery} searchValue={query} />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Hero */}
        <section className="grid gap-10 pb-24 pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-24">
          <div className="space-y-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2 border border-primary/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Danh bạ — Hồ sơ mở
            </div>
            <h1
              className="text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl md:text-7xl xl:text-8xl"
              style={display}
            >
              Người nổi tiếng
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1px oklch(0.78 0.13 85)" }}
              >
                Truyền cảm hứng
              </span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Khám phá và kết nối với những gương mặt tiêu biểu — từ nghệ sĩ,
              vận động viên đến doanh nhân, KOL hàng đầu Việt Nam và thế giới.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#library"
                className="inline-flex items-center gap-2 bg-primary px-8 py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-foreground"
              >
                Vào danh bạ
              </a>
              <a
                href="#featured"
                className="inline-flex items-center gap-2 border border-foreground/20 px-8 py-4 text-sm font-bold uppercase tracking-widest text-foreground transition hover:border-primary hover:text-primary"
              >
                Nổi bật
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden border border-primary/20 bg-secondary">
              {trending?.cover_url || trending?.avatar_url ? (
                <img
                  src={trending.cover_url ?? trending.avatar_url ?? ""}
                  alt={trending.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-primary/40">
                  <Users className="h-16 w-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                  #1 Trending
                </p>
                <h3
                  className="mt-2 text-2xl font-bold leading-none text-foreground"
                  style={display}
                >
                  {trending?.stage_name || trending?.name || "Đang cập nhật"}
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-primary p-6 text-primary-foreground">
                <p className="text-4xl font-extrabold sm:text-5xl" style={display}>
                  {celebs.length}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em]">
                  Nhân vật
                </p>
              </div>
              <div className="border border-primary/20 bg-secondary p-6">
                <p
                  className="text-4xl font-extrabold text-foreground sm:text-5xl"
                  style={display}
                >
                  {new Set(celebs.map((c) => c.category)).size || 0}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                  Lĩnh vực
                </p>
              </div>
              <div className="border border-primary/20 bg-secondary p-6">
                <p
                  className="text-4xl font-extrabold text-foreground sm:text-5xl"
                  style={display}
                >
                  {featuredCount}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                  Nổi bật
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Library */}
        <section id="library" className="space-y-10 border-t border-primary/10 pb-24 pt-20">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="space-y-5">
              <h2
                className="text-3xl font-bold uppercase tracking-tight sm:text-4xl"
                style={display}
              >
                Thư viện nhân vật
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((c) => {
                  const active = category === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={
                        "px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition " +
                        (active
                          ? "bg-primary text-primary-foreground"
                          : "border border-foreground/20 text-foreground/60 hover:border-primary hover:text-primary")
                      }
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-sm italic text-foreground/40">
              Đang hiển thị{" "}
              <span className="font-bold not-italic text-primary">
                {filtered.length}
              </span>{" "}
              / {celebs.length} kết quả
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse border border-primary/20 bg-secondary/40"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasAny={celebs.length > 0} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((c) => (
                <CelebCard key={c.id} celeb={c} />
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="border-t border-primary/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-foreground/50 md:flex-row md:px-8">
          <p className="uppercase tracking-[0.25em]" style={display}>
            © Người nổi tiếng — Danh bạ
          </p>
          <p className="italic">Hồ sơ mở · Cập nhật liên tục</p>
        </div>
      </footer>
    </div>
  );
}

function CelebCard({ celeb }: { celeb: Celeb }) {
  const label = CATEGORIES.find((x) => x.value === celeb.category)?.label ?? "Khác";
  return (
    <Link
      to="/celebrities/$slug"
      params={{ slug: celeb.slug }}
      className="group relative block aspect-[3/4] overflow-hidden border border-primary/20 bg-secondary/40 transition hover:border-primary"
    >
      {celeb.cover_url || celeb.avatar_url ? (
        <img
          src={celeb.cover_url ?? celeb.avatar_url ?? ""}
          alt={celeb.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-4xl font-extrabold text-primary/40" style={display}>
          {celeb.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      {celeb.featured && (
        <span className="absolute right-3 top-3 border border-primary/60 bg-background/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
          Nổi bật
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          {label}
          {celeb.nationality ? ` · ${celeb.nationality}` : ""}
        </p>
        <h3
          className="text-xl font-bold leading-tight text-foreground"
          style={display}
        >
          {celeb.stage_name || celeb.name}
        </h3>
      </div>
    </Link>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="col-span-full grid place-items-center border-2 border-dashed border-primary/25 p-14 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-primary/40">
          <Users className="h-8 w-8 text-primary/60" />
        </div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.25em] text-foreground">
          {hasAny ? "Không có kết quả phù hợp" : "Chưa có nhân vật nào"}
        </p>
        {!hasAny && (
          <Link
            to="/admin"
            className="mt-5 inline-flex items-center gap-2 border border-primary px-5 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Vào Quản lý để thêm
          </Link>
        )}
      </div>
    </div>
  );
}
