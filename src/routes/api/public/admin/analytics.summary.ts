import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, requireAdmin } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/analytics/summary")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      GET: async ({ request }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const [companies, pendingCompanies, articles, publishedArticles, draftArticles, leads] =
          await Promise.all([
            supabaseAdmin.from("companies").select("id", { count: "exact", head: true }),
            supabaseAdmin
              .from("companies")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending"),
            supabaseAdmin.from("articles").select("id", { count: "exact", head: true }),
            supabaseAdmin
              .from("articles")
              .select("id", { count: "exact", head: true })
              .eq("status", "published"),
            supabaseAdmin
              .from("articles")
              .select("id", { count: "exact", head: true })
              .eq("status", "draft"),
            supabaseAdmin.from("leads").select("id", { count: "exact", head: true }),
          ]);

        return json({
          data: {
            companies: {
              total: companies.count ?? 0,
              pending: pendingCompanies.count ?? 0,
            },
            articles: {
              total: articles.count ?? 0,
              published: publishedArticles.count ?? 0,
              draft: draftArticles.count ?? 0,
            },
            leads: {
              total: leads.count ?? 0,
            },
            generated_at: new Date().toISOString(),
          },
        });
      },
    },
  },
});
