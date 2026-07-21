import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/payos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyWebhookSignature, PLAN_CATALOG } = await import("@/lib/payos.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // payOS gửi "webhook test" khi lưu URL, có thể không đủ trường -> chấp nhận trả 200
        if (!payload?.data || !payload?.signature) {
          return Response.json({ success: true, note: "ping" });
        }

        // Verify signature
        const ok = verifyWebhookSignature(payload.data, payload.signature);
        if (!ok) {
          console.warn("[payos-webhook] Invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        const d = payload.data as {
          orderCode: number;
          amount: number;
          reference?: string;
          transactionDateTime?: string;
          code?: string;
          desc?: string;
        };

        // Idempotency: nếu đã paid thì bỏ qua
        const { data: order, error: findErr } = await supabaseAdmin
          .from("payment_orders")
          .select("id, user_id, company_id, plan_type, status, amount")
          .eq("order_code", d.orderCode)
          .maybeSingle();

        if (findErr || !order) {
          console.warn("[payos-webhook] Order not found:", d.orderCode);
          return Response.json({ success: true, note: "order_not_found" });
        }

        if (order.status === "paid") {
          return Response.json({ success: true, note: "already_paid" });
        }

        const isSuccess = payload.code === "00" || payload.success === true;

        if (!isSuccess) {
          await supabaseAdmin.from("payment_orders").update({
            status: "failed",
            raw_webhook: payload,
          }).eq("id", order.id);
          return Response.json({ success: true });
        }

        // Mark paid + create subscription + apply flags
        const plan = PLAN_CATALOG[order.plan_type as keyof typeof PLAN_CATALOG];
        const now = new Date();
        const expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

        await supabaseAdmin.from("payment_orders").update({
          status: "paid",
          paid_at: now.toISOString(),
          raw_webhook: payload,
        }).eq("id", order.id);

        const { data: sub } = await supabaseAdmin.from("subscriptions").insert({
          user_id: order.user_id,
          company_id: order.company_id,
          plan_type: order.plan_type,
          status: "active",
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          order_id: order.id,
        }).select("id").single();

        // Apply flags to company
        if (order.company_id) {
          const patch: any = {};
          if (order.plan_type === "featured_listing") {
            patch.is_featured = true;
            patch.featured_expires_at = expiresAt.toISOString();
          } else if (order.plan_type === "verified_badge") {
            patch.is_verified = true;
            patch.verified_expires_at = expiresAt.toISOString();
          } else if (order.plan_type === "lead_notification") {
            patch.lead_notify_expires_at = expiresAt.toISOString();
          }
          if (Object.keys(patch).length) {
            await supabaseAdmin.from("companies").update(patch).eq("id", order.company_id);
          }
        }

        // Best-effort: gửi email xác nhận qua Lovable Email API
        try {
          const apiKey = process.env.LOVABLE_API_KEY;
          if (apiKey) {
            const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
            const email = userInfo?.user?.email;
            if (email) {
              await fetch("https://api.lovable.dev/v1/email/send", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  to: email,
                  subject: `FactoryHub - Xác nhận thanh toán ${plan.name}`,
                  html: `<h2>Cảm ơn bạn!</h2>
                    <p>Đơn hàng <strong>#${d.orderCode}</strong> đã thanh toán thành công.</p>
                    <ul>
                      <li>Gói: <strong>${plan.name}</strong></li>
                      <li>Số tiền: <strong>${plan.amount.toLocaleString("vi-VN")}₫</strong></li>
                      <li>Hiệu lực đến: <strong>${expiresAt.toLocaleDateString("vi-VN")}</strong></li>
                    </ul>
                    <p>Xem chi tiết: <a href="https://cheerful-wave-works.lovable.app/dashboard/subscriptions">Dashboard</a></p>`,
                }),
              }).catch((e) => console.warn("[payos-webhook] email send failed:", e));
            }
          }
        } catch (e) {
          console.warn("[payos-webhook] email best-effort error:", e);
        }

        // Audit log (best-effort)
        try {
          await supabaseAdmin.from("admin_audit_log").insert({
            action: "payment.paid",
            target_type: "payment_order",
            target_id: order.id,
            changes: { orderCode: d.orderCode, amount: d.amount, plan: order.plan_type, subscription_id: sub?.id },
          } as any);
        } catch {}

        return Response.json({ success: true });
      },
    },
  },
});
