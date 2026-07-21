import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, logAudit, requireAdmin } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/articles/$id/publish")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      // POST /api/public/admin/articles/:id/publish  { publish?: boolean }
      POST: async ({ request, params }) => {
        const ctx = await requireAdmin(request, "publisher");
        if (ctx instanceof Response) return ctx;

        let publish = true;
        try {
          const body = await request.json();
          if (typeof body?.publish === "boolean") publish = body.publish;
        } catch {
          // no body — default publish=true
        }

        const patch = publish
          ? { status: "published" as const, published_at: new Date().toISOString() }
          : { status: "draft" as const };

        const { data, error } = await ctx.supabase
          .from("articles")
          .update(patch)
          .eq("id", params.id)
          .select("id, slug, status, published_at")
          .single();

        if (error) return json({ error: "publish_failed", message: error.message }, 400);
        await logAudit(
          ctx,
          publish ? "article.publish" : "article.unpublish",
          { type: "article", id: data.id, slug: data.slug },
          patch,
        );
        return json({ data });
      },
    },
  },
});
