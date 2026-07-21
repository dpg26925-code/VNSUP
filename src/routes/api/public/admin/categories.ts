import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, logAudit, requireAdmin, slugify } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/categories")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      GET: async ({ request }) => {
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;
        const { data, error } = await ctx.supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        if (error) return json({ error: "query_failed", message: error.message }, 500);
        return json({ data });
      },

      POST: async ({ request }) => {
        const ctx = await requireAdmin(request, "publisher");
        if (ctx instanceof Response) return ctx;
        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const name = String(body.name ?? "").trim();
        if (!name) return json({ error: "validation", message: "name is required" }, 400);
        const slug = String(body.slug ?? "").trim() || slugify(name);

        const { data, error } = await ctx.supabase
          .from("categories")
          .insert({
            name,
            slug,
            description: (body.description as string) ?? null,
            parent_id: (body.parent_id as string) ?? null,
          })
          .select()
          .single();

        if (error) {
          const code = error.code === "23505" ? 409 : 400;
          return json({ error: "insert_failed", message: error.message }, code);
        }
        await logAudit(ctx, "category.create", { type: "category", id: data.id, slug: data.slug });
        return json({ data }, 201);
      },
    },
  },
});
