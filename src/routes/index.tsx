import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Sparkles, Star, TrendingUp, Users } from "lucide-react";
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
      { name: "twitter:card", content: "summary_large_image" },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute -right-32 top-32 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14">
          <div className="rounded-3xl border border-white/10 bg-card/50 p-6 shadow-2xl backdrop-blur-sm sm:p-10">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Danh bạ — hồ sơ mở, cập nhật liên tục
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                  Người nổi tiếng — Khám phá <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
                    nhân vật truyền cảm hứng
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Tiểu sử, thành tích và hành trình của các gương mặt nổi bật —
                  gọn gàng, đẹp mắt, dễ tìm.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#library"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
                  >
                    <Users className="h-4 w-4" /> Vào danh bạ
                  </a>
                  <a
                    href="#featured"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
                  >
                    <Star className="h-4 w-4" /> Nổi bật
                  </a>
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="grid h-40 w-40 place-items-center rounded-3xl bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-transparent">
                  <Sparkles className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Nhân vật" value={celebs.length} />
              <Stat label="Nổi bật" value={featuredCount} />
              <Stat
                label="Lĩnh vực"
                value={new Set(celebs.map((c) => c.category)).size}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Library */}
      <section id="library" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-6 w-6 text-primary" /> Danh bạ
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length}/{celebs.length} hồ sơ
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-card/60 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên, nghệ danh, quốc tịch…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition " +
                (category === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10")
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-white/5 bg-card/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={celebs.length > 0} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CelebCard key={c.id} celeb={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function CelebCard({ celeb }: { celeb: Celeb }) {
  const label = CATEGORIES.find((x) => x.value === celeb.category)?.label ?? "Khác";
  return (
    <Link
      to="/celebrities/$slug"
      params={{ slug: celeb.slug }}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-card/60 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-fuchsia-500/10">
        {celeb.cover_url ? (
          <img
            src={celeb.cover_url}
            alt={celeb.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : celeb.avatar_url ? (
          <img
            src={celeb.avatar_url}
            alt={celeb.name}
            loading="lazy"
            className="h-full w-full object-cover blur-sm opacity-40"
          />
        ) : null}
        {celeb.featured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
            <Star className="h-3 w-3" /> Nổi bật
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30">
          {celeb.avatar_url ? (
            <img
              src={celeb.avatar_url}
              alt={celeb.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-primary/20 text-sm font-bold text-primary">
              {celeb.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {celeb.stage_name || celeb.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {label}
            {celeb.nationality ? ` · ${celeb.nationality}` : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-card/40 py-16 text-center">
      <Users className="mx-auto h-10 w-10 text-primary/60" />
      <p className="mt-3 text-sm text-muted-foreground">
        {hasAny
          ? "Không có kết quả phù hợp với bộ lọc."
          : "Chưa có nhân vật nào trong danh bạ."}
      </p>
      {!hasAny && (
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Vào Quản lý để thêm
        </Link>
      )}
    </div>
  );
}
