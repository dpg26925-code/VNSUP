import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, enforceCategoryAllowed, json, logAudit, requireAdmin } from "@/lib/admin-api.server";

const UPDATABLE = [
  "title",
  "slug",
  "excerpt",
  "content",
  "cover_image",
  "category",
  "tags",
  "meta_title",
  "meta_description",
  "og_image",
  "status",
] as const;

export const Route = createFileRoute("/api/public/admin/articles/$id")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      GET: async ({ request, params }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;
        const { data, error } = await ctx.supabase
          .from("articles")
          .select("*")
          .eq("id", params.id)
          .maybeSingle();
        if (error) return json({ error: "query_failed", message: error.message }, 500);
        if (!data) return json({ error: "not_found" }, 404);
        return json({ data });
      },

      PATCH: async (evt) => updateArticle(evt, "patch"),
      PUT: async (evt) => updateArticle(evt, "put"),

      DELETE: async ({ request, params }) => {
        const ctx = await requireAdmin(request, "publisher");
        if (ctx instanceof Response) return ctx;

        const { data, error } = await ctx.supabase
          .from("articles")
          .delete()
          .eq("id", params.id)
          .select("id, slug")
          .maybeSingle();

        if (error) return json({ error: "delete_failed", message: error.message }, 400);
        if (!data) return json({ error: "not_found" }, 404);
        await logAudit(ctx, "article.delete", { type: "article", id: data.id, slug: data.slug });
        return json({ ok: true });
      },
    },
  },
});
