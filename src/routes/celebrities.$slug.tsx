import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Globe, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";

type Celeb = {
  id: string;
  slug: string;
  name: string;
  stage_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  nationality: string | null;
  birth_date: string | null;
  category: string;
  achievements: string[];
  socials: Record<string, string>;
  featured: boolean;
  views: number;
};

const celebQuery = (slug: string) =>
  queryOptions({
    queryKey: ["celebrity", slug],
    queryFn: async (): Promise<Celeb> => {
      const { data, error } = await supabase
        .from("celebrities")
        .select(
          "id, slug, name, stage_name, avatar_url, cover_url, bio, nationality, birth_date, category, achievements, socials, featured, views"
        )
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as Celeb;
    },
  });

const CATEGORY_LABEL: Record<string, string> = {
  singer: "Ca sĩ",
  actor: "Diễn viên",
  athlete: "Vận động viên",
  entrepreneur: "Doanh nhân",
  influencer: "KOL / Người ảnh hưởng",
  other: "Khác",
};

export const Route = createFileRoute("/celebrities/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(celebQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Không tìm thấy — Người nổi tiếng" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const c = loaderData as Celeb;
    const title = `${c.stage_name || c.name} — Người nổi tiếng`;
    const desc =
      (c.bio && c.bio.slice(0, 150)) ||
      `Hồ sơ ${c.stage_name || c.name}, ${CATEGORY_LABEL[c.category] ?? "nhân vật nổi bật"}.`;
    const img = c.cover_url || c.avatar_url;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (img && /^https?:\/\//.test(img)) {
      meta.push({ property: "og:image", content: img });
      meta.push({ name: "twitter:image", content: img });
    }
    return { meta };
  },
  component: CelebPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy nhân vật</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hồ sơ này có thể đã bị gỡ hoặc chưa được xuất bản.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Không tải được</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function CelebPage() {
  const { slug } = Route.useParams();
  const { data: c } = useSuspenseQuery(celebQuery(slug));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Cover */}
      <div className="relative h-56 overflow-hidden sm:h-72">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-background" />
        {c.cover_url && (
          <img
            src={c.cover_url}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto -mt-20 max-w-5xl px-4 pb-24">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Về danh bạ
        </Link>

        <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
          <div>
            <div className="aspect-square overflow-hidden rounded-3xl border-4 border-background bg-card ring-1 ring-white/10">
              {c.avatar_url ? (
                <img
                  src={c.avatar_url}
                  alt={c.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-primary/20 text-6xl font-bold text-primary">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 sm:pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                {CATEGORY_LABEL[c.category] ?? "Khác"}
              </span>
              {c.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-medium text-fuchsia-300">
                  <Star className="h-3 w-3" /> Nổi bật
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {c.stage_name || c.name}
            </h1>
            {c.stage_name && (
              <p className="text-sm text-muted-foreground">
                Tên thật: {c.name}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {c.nationality && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> {c.nationality}
                </span>
              )}
              {c.birth_date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />{" "}
                  {new Date(c.birth_date).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>

            {Object.keys(c.socials || {}).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(c.socials).map(([k, v]) => (
                  <a
                    key={k}
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    {k}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {c.bio && (
          <section className="mt-10 rounded-3xl border border-white/10 bg-card/50 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Tiểu sử
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {c.bio}
            </p>
          </section>
        )}

        {c.achievements?.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-card/50 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Star className="h-4 w-4 text-primary" /> Thành tích nổi bật
            </h2>
            <ul className="space-y-2">
              {c.achievements.map((a, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                >
                  <span className="text-primary">◆</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
