import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin, json, corsPreflight } from "@/lib/admin-api.server";

export const Route = createFileRoute("/api/public/admin/articles/delete-all")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        try {
          const admin = await requireAdmin(request);
          if (!admin.canDelete) {
            return json({ error: "forbidden", message: "Bạn không có quyền xóa bài viết." }, 403);
          }

          // Count existing articles first
          const { count, error: countErr } = await supabaseAdmin
            .from("articles")
            .select("*", { count: "exact", head: true });

          if (countErr) throw countErr;

          // Delete all articles
          const { error: deleteErr } = await supabaseAdmin
            .from("articles")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          if (deleteErr) throw deleteErr;

          // Write audit log
          try {
            await supabaseAdmin.from("admin_audit_log").insert({
              admin_user_id: admin.userId,
              action: "DELETE_ALL_ARTICLES",
              target_type: "articles",
              target_id: null,
              changes: { deleted_count: count ?? 0 },
            });
          } catch (logErr) {
            console.warn("[DeleteAllArticles] Audit log error:", logErr);
          }

          return json({
            success: true,
            message: `Đã xóa thành công toàn bộ ${count ?? 0} bài viết khỏi hệ thống.`,
            count: count ?? 0,
          });
        } catch (e) {
          console.error("[DeleteAllArticles] Error:", e);
          return json({ error: (e as Error).message }, (e as any).status || 500);
        }
      },
    },
  },
});
