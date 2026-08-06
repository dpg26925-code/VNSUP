import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";
import { ArrowLeft, Clock, User, Share2 } from "lucide-react";

const articleQO = (slug: string) => queryOptions({
  queryKey: ["article", slug],
  queryFn: async () => {
    // Fetch article first
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
      
    if (articleError) throw articleError;
    if (!article) return null;

    // Fetch author separately if present
    if (article.author_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", article.author_id)
        .maybeSingle();
        
      if (!profileError && profile) {
        return { ...article, author: profile };
      }
    }

    return { ...article, author: null };
  },
});

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(articleQO(params.slug)),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || ""} | VNSupplier Blog` },
      { name: "description", content: loaderData?.excerpt || "" },
      { property: "og:image", content: loaderData?.cover_image || "" },
    ],
  }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const { data: post } = useSuspenseQuery(articleQO(slug));

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="py-24 text-center">
          <Container>
            <h1 className="text-2xl font-bold">Không tìm thấy bài viết</h1>
            <Link to="/blog" className="mt-4 inline-block text-brand hover:underline">Quay lại Blog</Link>
          </Container>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container className="max-w-4xl">
          <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Quay lại Blog
          </Link>

          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.published_at ? new Date(post.published_at).toLocaleDateString("vi-VN") : "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {(post.author as any)?.display_name || "Ban biên tập"}
              </div>
              <button className="flex items-center gap-2 hover:text-brand">
                <Share2 className="h-4 w-4" /> Chia sẻ
              </button>
            </div>
          </header>

          {post.cover_image && (
            <div className="mb-12 aspect-video overflow-hidden rounded-3xl bg-muted shadow-xl">
              <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}

          <article className="prose prose-lg dark:prose-invert max-w-none prose-orange prose-headings:font-bold prose-a:text-brand">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
