import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, json, requireAdmin } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/leads")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflight(),

      // GET /api/public/admin/leads?limit=100&offset=0
      GET: async ({ request }) => {
        const ctx = await requireAdmin(request, "publisher");
        if (ctx instanceof Response) return ctx;

        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
        const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

        // Leads are user-scoped by RLS; publisher/admin need service-role to read all.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, count, error } = await supabaseAdmin
          .from("leads")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) return json({ error: "query_failed", message: error.message }, 500);
        return json({ data, count, limit, offset });
      },
    },
  },
});
