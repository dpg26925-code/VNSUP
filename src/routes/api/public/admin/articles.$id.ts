import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, logAudit, requireAdmin } from "@/lib/admin-api.server";

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

      PATCH: async ({ request, params }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;

        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const patch: Record<string, unknown> = {};
        for (const key of UPDATABLE) {
          if (key in body) patch[key] = body[key];
        }

        if (patch.status === "published") {
          if (ctx.highestRole === "editor") {
            return json({ error: "forbidden", message: "Editors cannot publish" }, 403);
          }
          patch.published_at = new Date().toISOString();
        }

        if (Object.keys(patch).length === 0) {
          return json({ error: "validation", message: "no updatable fields provided" }, 400);
        }

        const { data, error } = await ctx.supabase
          .from("articles")
          .update(patch as never)
          .eq("id", params.id)
          .select()
          .single();

        if (error) return json({ error: "update_failed", message: error.message }, 400);
        await logAudit(ctx, "article.update", { type: "article", id: data.id, slug: data.slug }, patch);
        return json({ data });
      },

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
