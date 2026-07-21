import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, logAudit, requireAdmin, slugify } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/articles")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      // GET /api/public/admin/articles?status=draft&limit=50&offset=0&q=...
      GET: async ({ request }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;

        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const q = url.searchParams.get("q");
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
        const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

        let query = ctx.supabase
          .from("articles")
          .select(
            "id,title,slug,excerpt,cover_image,category,tags,status,author_id,published_at,view_count,created_at,updated_at",
            { count: "exact" },
          )
          .order("updated_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status as never);
        if (q) query = query.ilike("title", `%${q}%`);

        const { data, count, error } = await query;
        if (error) return json({ error: "query_failed", message: error.message }, 500);
        return json({ data, count, limit, offset });
      },

      // POST /api/public/admin/articles  { title, content, slug?, excerpt?, category?, tags?, status?, cover_image?, meta_* }
      POST: async ({ request }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;

        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const title = String(body.title ?? "").trim();
        if (!title) return json({ error: "validation", message: "title is required" }, 400);
        const content = typeof body.content === "string" ? body.content : "";
        const requestedStatus = String(body.status ?? "draft");
        const status =
          ["draft", "pending", "published", "archived"].includes(requestedStatus)
            ? (requestedStatus as "draft" | "pending" | "published" | "archived")
            : "draft";

        // Only publisher/admin can create as "published" directly
        if (status === "published" && ctx.highestRole === "editor") {
          return json({ error: "forbidden", message: "Editors cannot publish directly" }, 403);
        }

        const slug = String(body.slug ?? "").trim() || slugify(title) || `bai-viet-${Date.now()}`;

        const insertRow = {
          title,
          slug,
          excerpt: (body.excerpt as string) ?? null,
          content,
          cover_image: (body.cover_image as string) ?? null,
          category: (body.category as string) ?? null,
          tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
          status,
          meta_title: (body.meta_title as string) ?? null,
          meta_description: (body.meta_description as string) ?? null,
          og_image: (body.og_image as string) ?? null,
          author_id: ctx.userId,
          published_at: status === "published" ? new Date().toISOString() : null,
        };

        const { data, error } = await ctx.supabase
          .from("articles")
          .insert(insertRow)
          .select()
          .single();

        if (error) {
          const code = error.code === "23505" ? 409 : 400;
          return json({ error: "insert_failed", message: error.message }, code);
        }

        await logAudit(ctx, "article.create", { type: "article", id: data.id, slug: data.slug }, {
          status: data.status,
        });
        return json({ data }, 201);
      },
    },
  },
});
