import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container, CardGrid, SectionHeader } from "@/components/primitives";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const blogListQO = queryOptions({
  queryKey: ["blog-articles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("id,slug,title,excerpt,published_at,cover_image,author:profiles(full_name)")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(blogListQO),
  head: () => ({
    meta: [
      { title: "Blog & Tin tức Sản xuất | VNSupplier" },
      { name: "description", content: "Cập nhật tin tức, kiến thức về ngành sản xuất, gia công cơ khí, ép nhựa và điện tử tại Việt Nam." },
    ],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  const { data: articles } = useSuspenseQuery(blogListQO);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container>
          <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">Blog & Tin tức</span>
          </nav>

          <SectionHeader
            title="Blog & Tin tức sản xuất"
            description="Kinh nghiệm, kiến thức và cập nhật mới nhất từ thị trường sản xuất Việt Nam."
          />

          <div className="mt-10">
            {articles.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border border-dashed rounded-2xl">
                Chưa có bài viết nào.
              </div>
            ) : (
              <CardGrid gap="8">
                {articles.map((post) => (
                  <Link
                    key={post.id}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/30 font-bold">VNSupplier</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-brand">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString("vi-VN") : "Bản nháp"}
                      </div>
                      <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-tight group-hover:text-brand transition-colors">{post.title}</h3>
                      <p className="mb-6 line-clamp-3 flex-1 text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-brand group-hover:gap-3 transition-all">
                        Đọc tiếp <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardGrid>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}


