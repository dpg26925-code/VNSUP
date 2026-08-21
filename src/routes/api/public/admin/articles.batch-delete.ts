import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/articles/batch-delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
          const body = await request.json();
          const { ids } = z.object({ ids: z.array(z.string()) }).parse(body);

          if (ids.length === 0) {
            return new Response(JSON.stringify({ error: "No IDs provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { error } = await supabaseAdmin
            .from("articles")
            .delete()
            .in("id", ids);

          if (error) throw error;

          return new Response(JSON.stringify({ success: true, count: ids.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[BatchDelete] Error:", e);
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: (e as any).status || 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
