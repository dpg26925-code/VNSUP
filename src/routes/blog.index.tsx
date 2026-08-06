import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />
      <main className="py-12">
        <Container>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog & Tin tức</h1>
            <p className="mt-4 text-muted-foreground">Kinh nghiệm và cập nhật mới nhất từ thị trường sản xuất Việt Nam.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 text-xs text-muted-foreground">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString("vi-VN") : "Bản nháp"}
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight group-hover:text-brand">{post.title}</h3>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                  <div className="text-sm font-medium text-brand">Đọc tiếp →</div>
                </div>
              </Link>
            ))}
          </div>
          
          {articles.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">Chưa có bài viết nào.</div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
