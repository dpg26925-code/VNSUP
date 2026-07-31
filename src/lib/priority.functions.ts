import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SlotInput = z.object({
  industry_slug: z.string().min(1).max(80),
  province_slug: z.string().min(1).max(80),
});

/** Public: thứ tự hiển thị đã tính sẵn của một slot ngành × tỉnh. */
export const getRanking = createServerFn({ method: "GET" })
  .inputValidator((raw) => SlotInput.parse(raw))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rows, error } = await client
      .from("priority_cache")
      .select("company_id, priority_score, display_order, computed_at")
      .eq("industry_slug", data.industry_slug)
      .eq("province_slug", data.province_slug)
      .order("display_order", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Admin: tính lại priority cho một slot (hoặc toàn bộ nếu all=true). */
export const recalculatePriority = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z
      .object({
        industry_slug: z.string().min(1).optional(),
        province_slug: z.string().min(1).optional(),
        all: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin_role", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Bạn không có quyền thực hiện thao tác này");

    const { recomputeSlot, recomputeAll } = await import("./priority.server");
    if (data.all || !data.industry_slug || !data.province_slug) {
      const results = await recomputeAll();
      return { slots: results.length, results };
    }
    const result = await recomputeSlot(data.industry_slug, data.province_slug);
    return { slots: 1, results: [result] };
  });

/** Owner: xem tình trạng phiên đấu giá của slot (giá sàn, bước giá, số slot, top bid). */
export const getAuctionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => SlotInput.parse(raw))
  .handler(async ({ data, context }) => {
    const nowIso = new Date().toISOString();
    const { data: myBids } = await context.supabase
      .from("featured_bids")
      .select("id, company_id, bid_amount, effective_bid, bid_status, rank, period_start, period_end")
      .eq("industry_slug", data.industry_slug)
      .eq("province_slug", data.province_slug)
      .gt("period_end", nowIso)
      .order("bid_amount", { ascending: false });

    const { MIN_BID, BID_STEP, FEATURED_SLOTS } = await import("./priority");
    const highest = (myBids ?? []).reduce((m, b) => Math.max(m, b.bid_amount), 0);
    return {
      min_bid: MIN_BID,
      bid_step: BID_STEP,
      slots: FEATURED_SLOTS,
      highest_visible_bid: highest,
      bids: myBids ?? [],
    };
  });

/** Owner: đặt giá thầu cho slot Featured của công ty mình. */
export const placeFeaturedBid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    SlotInput.extend({
      company_id: z.string().uuid(),
      bid_amount: z.number().int().min(100_000).max(1_000_000_000),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { BID_STEP } = await import("./priority");
    if (data.bid_amount % BID_STEP !== 0) {
      throw new Error(`Giá thầu phải là bội số của ${BID_STEP.toLocaleString("vi-VN")}₫`);
    }

    const { data: company, error: coErr } = await context.supabase
      .from("companies")
      .select("id, name, submitted_by")
      .eq("id", data.company_id)
      .maybeSingle();
    if (coErr || !company) throw new Error("Không tìm thấy công ty");

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    // RLS (can_manage_company) đảm bảo chỉ chủ sở hữu hoặc admin ghi được.
    const { data: inserted, error } = await context.supabase
      .from("featured_bids")
      .insert({
        company_id: data.company_id,
        industry_slug: data.industry_slug,
        province_slug: data.province_slug,
        bid_amount: data.bid_amount,
        effective_bid: 0,
        bid_status: "active",
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        created_by: context.userId,
      })
      .select("id, bid_amount, period_start, period_end")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

/** Admin: chốt phiên đấu giá của slot (second-price) và tính lại thứ tự. */
export const endAuctionRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => SlotInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin_role", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Bạn không có quyền chốt phiên đấu giá");
    const { settleAuction } = await import("./priority.server");
    return await settleAuction(data.industry_slug, data.province_slug);
  });
