// Server-only: tính lại priority_cache và chốt phiên đấu giá Featured.
import {
  profileCompleteness,
  rankSuppliers,
  resolveAuction,
  type SubscriptionTier,
  type SupplierInput,
} from "./priority";
import { industryBySlug, provinceBySlug } from "./factory";

export type RecalcResult = {
  industry_slug: string;
  province_slug: string;
  companies: number;
  updated: number;
};

function tierFromPlan(plan: string, tier: number | null): SubscriptionTier {
  if (plan === "featured_listing") return "featured";
  if (plan === "verified_badge" || plan === "profile_verification") {
    if (tier === 1) return "verified_tier1";
    if (tier === 2) return "verified_tier2";
    return "verified_tier3";
  }
  if (plan === "lead_notification") return "lead";
  return "none";
}

export async function recomputeSlot(
  industrySlug: string,
  provinceSlug: string,
): Promise<RecalcResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const industry = industryBySlug(industrySlug);
  const province = provinceBySlug(provinceSlug);
  if (!industry || !province) throw new Error("Ngành hoặc tỉnh/thành không hợp lệ");

  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("status", "approved")
    .eq("industry", industry.name)
    .eq("province", province.name);
  if (error) throw error;
  const list = companies ?? [];
  if (list.length === 0) return { industry_slug: industrySlug, province_slug: provinceSlug, companies: 0, updated: 0 };

  const ids = list.map((c) => c.id);
  const nowIso = new Date().toISOString();

  const [{ data: subs }, { data: bids }, { data: reviews }] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("company_id, plan_type, tier, status, expires_at, industry_slug, province_slug")
      .in("company_id", ids)
      .eq("status", "active")
      .gt("expires_at", nowIso),
    supabaseAdmin
      .from("featured_bids")
      .select("company_id, effective_bid, bid_status, period_end")
      .in("company_id", ids)
      .eq("industry_slug", industrySlug)
      .eq("province_slug", provinceSlug)
      .eq("bid_status", "won")
      .gt("period_end", nowIso),
    supabaseAdmin
      .from("company_reviews")
      .select("company_id, rating")
      .in("company_id", ids)
      .eq("status", "approved"),
  ]);

  const bidByCompany = new Map<string, number>();
  for (const b of bids ?? []) bidByCompany.set(b.company_id, b.effective_bid ?? 0);

  const tierByCompany = new Map<string, SubscriptionTier>();
  const rankOrder: SubscriptionTier[] = [
    "featured",
    "verified_tier1",
    "verified_tier2",
    "verified_tier3",
    "lead",
    "none",
  ];
  for (const s of subs ?? []) {
    if (!s.company_id) continue;
    // Gói có phạm vi phải khớp slot đang tính; gói không phạm vi áp dụng toàn hệ thống.
    if (s.industry_slug && s.industry_slug !== industrySlug) continue;
    if (s.province_slug && s.province_slug !== provinceSlug) continue;
    const t = tierFromPlan(String(s.plan_type), s.tier ?? null);
    const cur = tierByCompany.get(s.company_id) ?? "none";
    if (rankOrder.indexOf(t) < rankOrder.indexOf(cur)) tierByCompany.set(s.company_id, t);
  }

  const ratingAgg = new Map<string, { sum: number; n: number }>();
  for (const r of reviews ?? []) {
    const cur = ratingAgg.get(r.company_id) ?? { sum: 0, n: 0 };
    cur.sum += r.rating ?? 0;
    cur.n += 1;
    ratingAgg.set(r.company_id, cur);
  }

  const inputs: SupplierInput[] = list.map((c) => {
    const agg = ratingAgg.get(c.id);
    let tier = tierByCompany.get(c.id) ?? "none";
    if (tier !== "featured" && bidByCompany.has(c.id)) tier = "featured";
    return {
      company_id: c.id,
      name: c.name,
      tier,
      effective_bid: bidByCompany.get(c.id) ?? 0,
      completeness: profileCompleteness(c as unknown as Record<string, unknown>),
      rating: agg && agg.n > 0 ? agg.sum / agg.n : 0,
      review_count: agg?.n ?? 0,
      views: 0,
      updated_at: c.updated_at,
      verified: c.is_verified || c.verified,
    };
  });

  const ranked = rankSuppliers(inputs);
  const rows = ranked.map((r) => ({
    industry_slug: industrySlug,
    province_slug: provinceSlug,
    company_id: r.company_id,
    priority_score: r.priority_score,
    display_order: r.display_order,
    computed_at: nowIso,
  }));

  const { error: upErr } = await supabaseAdmin
    .from("priority_cache")
    .upsert(rows, { onConflict: "industry_slug,province_slug,company_id" });
  if (upErr) throw upErr;

  return {
    industry_slug: industrySlug,
    province_slug: provinceSlug,
    companies: list.length,
    updated: rows.length,
  };
}

/** Tính lại toàn bộ các cặp ngành × tỉnh đang có nhà máy approved. */
export async function recomputeAll(): Promise<RecalcResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { industrySlug, provinceSlug } = await import("./factory");
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("industry, province")
    .eq("status", "approved");
  if (error) throw error;

  const slots = new Set<string>();
  for (const row of data ?? []) {
    if (!row.industry || !row.province) continue;
    slots.add(`${industrySlug(row.industry)}|${provinceSlug(row.province)}`);
  }

  const results: RecalcResult[] = [];
  for (const key of slots) {
    const [i, p] = key.split("|");
    try {
      results.push(await recomputeSlot(i!, p!));
    } catch {
      // bỏ qua slot có slug không map được
    }
  }
  return results;
}

/** Chốt phiên đấu giá của một slot: xác định winner, effective_bid (second-price). */
export async function settleAuction(industrySlug: string, provinceSlug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();
  const { data: bids, error } = await supabaseAdmin
    .from("featured_bids")
    .select("id, company_id, bid_amount, created_at")
    .eq("industry_slug", industrySlug)
    .eq("province_slug", provinceSlug)
    .eq("bid_status", "active")
    .gt("period_end", nowIso);
  if (error) throw error;

  const resolved = resolveAuction(bids ?? []);
  for (const r of resolved) {
    const { error: e } = await supabaseAdmin
      .from("featured_bids")
      .update({ rank: r.rank, effective_bid: r.effective_bid, bid_status: r.bid_status })
      .eq("id", r.id);
    if (e) throw e;
  }
  await recomputeSlot(industrySlug, provinceSlug);
  return resolved;
}
