import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = process.env.SITE_URL || "https://cheerful-wave-works.lovable.app";

const CreateInput = z.object({
  plan: z.enum(["featured_listing", "verified_badge", "lead_notification"]),
  companyId: z.string().uuid().optional(),
});

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => CreateInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { createPayOSPaymentLink, generateOrderCode, PLAN_CATALOG } = await import("./payos.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const plan = PLAN_CATALOG[data.plan];

    if (plan.scope === "company") {
      if (!data.companyId) throw new Error("Vui lòng chọn công ty áp dụng gói");
      // Verify user owns the company
      const { data: co, error } = await context.supabase
        .from("companies").select("id, name, submitted_by").eq("id", data.companyId).maybeSingle();
      if (error || !co) throw new Error("Không tìm thấy công ty");
      if (co.submitted_by && co.submitted_by !== context.userId) {
        throw new Error("Bạn không sở hữu công ty này");
      }
    }

    const orderCode = generateOrderCode();
    const description = `${plan.name.slice(0, 20)}`.slice(0, 25); // payOS giới hạn 25 ký tự

    const paylink = await createPayOSPaymentLink({
      orderCode,
      amount: plan.amount,
      description,
      returnUrl: `${SITE_URL}/payment/success?orderCode=${orderCode}`,
      cancelUrl: `${SITE_URL}/payment/cancel?orderCode=${orderCode}`,
    });

    const { error: insertErr } = await supabaseAdmin.from("payment_orders").insert({
      order_code: orderCode,
      user_id: context.userId,
      company_id: data.companyId ?? null,
      plan_type: data.plan,
      amount: plan.amount,
      description: `${plan.name}${data.companyId ? " - company " + data.companyId.slice(0, 8) : ""}`,
      payos_payment_link_id: paylink.paymentLinkId,
      checkout_url: paylink.checkoutUrl,
      qr_code: paylink.qrCode,
      return_url: `${SITE_URL}/payment/success`,
      cancel_url: `${SITE_URL}/payment/cancel`,
    });
    if (insertErr) throw new Error("Lưu đơn hàng thất bại: " + insertErr.message);

    return {
      orderCode,
      checkoutUrl: paylink.checkoutUrl,
      qrCode: paylink.qrCode,
      amount: plan.amount,
    };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("payment_orders")
      .select("id, order_code, plan_type, amount, status, company_id, checkout_url, created_at, paid_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const listMySubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select("id, plan_type, status, starts_at, expires_at, company_id")
      .order("expires_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const listMyCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("companies")
      .select("id, name, slug")
      .eq("submitted_by", context.userId)
      .order("name");
    return data ?? [];
  });
