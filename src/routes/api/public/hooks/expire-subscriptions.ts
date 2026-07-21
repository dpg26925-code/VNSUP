import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/expire-subscriptions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Bảo vệ endpoint bằng Supabase anon apikey header (khớp mẫu pg_cron)
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        // 1) Đánh dấu subscriptions hết hạn
        const { data: expiredSubs } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("status", "active")
          .lte("expires_at", now)
          .select("id, company_id, plan_type, user_id");

        // 2) Hạ cờ trên bảng companies
        await supabaseAdmin.from("companies").update({
          is_featured: false, featured_expires_at: null,
        }).eq("is_featured", true).lte("featured_expires_at", now);

        await supabaseAdmin.from("companies").update({
          is_verified: false, verified_expires_at: null,
        }).eq("is_verified", true).lte("verified_expires_at", now);

        await supabaseAdmin.from("companies").update({
          lead_notify_expires_at: null,
        }).lte("lead_notify_expires_at", now);

        // 3) Gửi email nhắc gia hạn cho subscription còn 3 ngày (best-effort, chưa gửi lần nào)
        const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: expiringSoon } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, plan_type, expires_at")
          .eq("status", "active")
          .is("reminder_sent_at", null)
          .lte("expires_at", in3days);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (apiKey && expiringSoon?.length) {
          for (const s of expiringSoon) {
            try {
              const { data: u } = await supabaseAdmin.auth.admin.getUserById(s.user_id);
              const email = u?.user?.email;
              if (!email) continue;
              await fetch("https://api.lovable.dev/v1/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                  to: email,
                  subject: "VNSupplier - Nhắc gia hạn gói dịch vụ",
                  html: `<p>Gói <strong>${s.plan_type}</strong> của bạn sẽ hết hạn vào <strong>${new Date(s.expires_at).toLocaleDateString("vi-VN")}</strong>.</p>
                    <p><a href="https://vnsupplier.cloud/dashboard/subscriptions">Gia hạn ngay</a></p>`,
                }),
              });
              await supabaseAdmin.from("subscriptions").update({ reminder_sent_at: now }).eq("id", s.id);
            } catch (e) {
              console.warn("[expire-cron] reminder failed:", e);
            }
          }
        }

        return Response.json({
          success: true,
          expired: expiredSubs?.length ?? 0,
          reminded: expiringSoon?.length ?? 0,
        });
      },
    },
  },
});
