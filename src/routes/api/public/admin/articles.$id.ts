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

async function updateArticle(
  { request, params }: { request: Request; params: { id: string } },
  mode: "patch" | "put",
) {
  const ctx = await requireAdmin(request, "editor");
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // PUT requires title + content (full replacement of updatable fields).
  if (mode === "put") {
    if (!body.title || typeof body.title !== "string")
      return json({ error: "validation", message: "title is required for PUT" }, 400);
    if (typeof body.content !== "string")
      return json({ error: "validation", message: "content is required for PUT" }, 400);
  }

  const patch: Record<string, unknown> = {};
  for (const key of UPDATABLE) {
    if (mode === "put") {
      patch[key] = key in body ? body[key] : key === "tags" ? [] : null;
    } else if (key in body) {
      patch[key] = body[key];
    }
  }

  // Enforce editor allowed_categories on both current (from DB) and target categories.
  if (ctx.highestRole === "editor" && ctx.allowedCategories.length > 0) {
    const { data: current } = await ctx.supabase
      .from("articles")
      .select("category")
      .eq("id", params.id)
      .maybeSingle();
    const currentCat = (current?.category as string | null) ?? null;
    const targetCat = "category" in patch ? (patch.category as string | null) : currentCat;
    const denyCurrent = enforceCategoryAllowed(ctx, currentCat);
    if (denyCurrent) return denyCurrent;
    const denyTarget = enforceCategoryAllowed(ctx, targetCat);
    if (denyTarget) return denyTarget;
  }

  if (patch.status === "published") {
    if (!ctx.canPublish) {
      return json({ error: "forbidden", message: "You cannot publish" }, 403);
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
  await logAudit(
    ctx,
    mode === "put" ? "article.replace" : "article.update",
    { type: "article", id: data.id, slug: data.slug },
    patch,
  );
  return json({ data });
}

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
        const ctx = await requireAdmin(request, "editor");
        if (ctx instanceof Response) return ctx;
        if (!ctx.canDelete) return json({ error: "forbidden", message: "You cannot delete" }, 403);

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
