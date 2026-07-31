import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron: chốt phiên đấu giá Featured + tính lại toàn bộ priority_cache.
 * Gọi bằng pg_net kèm header `apikey` = Supabase publishable key.
 */
export const Route = createFileRoute("/api/public/hooks/priority-recalculate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let settleAuctions = false;
        try {
          const body = (await request.json()) as { settle_auctions?: boolean } | null;
          settleAuctions = Boolean(body?.settle_auctions);
        } catch {
          // body rỗng — chỉ tính lại priority
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { recomputeAll, settleAuction } = await import("@/lib/priority.server");

        let settled = 0;
        if (settleAuctions) {
          const nowIso = new Date().toISOString();
          const { data: slots } = await supabaseAdmin
            .from("featured_bids")
            .select("industry_slug, province_slug")
            .eq("bid_status", "active")
            .gt("period_end", nowIso);
          const unique = new Set((slots ?? []).map((s) => `${s.industry_slug}|${s.province_slug}`));
          for (const key of unique) {
            const [i, p] = key.split("|");
            try {
              await settleAuction(i!, p!);
              settled += 1;
            } catch (e) {
              console.warn("[priority-cron] settle failed:", key, e);
            }
          }
        }

        const results = await recomputeAll();
        return Response.json({
          success: true,
          settled_slots: settled,
          recomputed_slots: results.length,
          total_rows: results.reduce((n, r) => n + r.updated, 0),
        });
      },
    },
  },
});
