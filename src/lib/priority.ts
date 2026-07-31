// Pure priority engine — không phụ thuộc DB, dùng chung cho server và client.

export type SubscriptionTier =
  | "featured"
  | "verified_tier1"
  | "verified_tier2"
  | "verified_tier3"
  | "lead"
  | "none";

export const TIER_BASE: Record<SubscriptionTier, number> = {
  featured: 100_000,
  verified_tier1: 50_000,
  verified_tier2: 40_000,
  verified_tier3: 30_000,
  lead: 5_000,
  none: 0,
};

export const TIER_LABEL: Record<SubscriptionTier, string> = {
  featured: "Featured",
  verified_tier1: "Verified Enterprise",
  verified_tier2: "Verified Premium",
  verified_tier3: "Verified",
  lead: "Lead Notification",
  none: "Miễn phí",
};

export type SupplierInput = {
  company_id: string;
  name: string;
  tier: SubscriptionTier;
  /** Giá thầu hiệu lực (second-price) của slot Featured, VND */
  effective_bid?: number | null;
  /** 0..1 — độ đầy đủ hồ sơ */
  completeness?: number | null;
  /** 0..5 */
  rating?: number | null;
  review_count?: number | null;
  views?: number | null;
  /** ISO date của lần cập nhật gần nhất */
  updated_at?: string | null;
  verified?: boolean | null;
};

export type RankedSupplier = SupplierInput & {
  priority_score: number;
  display_order: number;
};

/** Điểm chất lượng hồ sơ (0 → ~12.000) — luôn nhỏ hơn khoảng cách giữa các tier. */
export function qualityScore(s: SupplierInput): number {
  const completeness = clamp(s.completeness ?? 0, 0, 1);
  const rating = clamp(s.rating ?? 0, 0, 5);
  const reviews = Math.max(0, s.review_count ?? 0);
  const views = Math.max(0, s.views ?? 0);

  const completenessPts = Math.round(completeness * 5_000); // 0..5000
  const ratingPts = Math.round((rating / 5) * 3_000); // 0..3000
  const reviewPts = Math.round(Math.min(1, reviews / 20) * 1_500); // 0..1500
  const viewPts = Math.round(Math.min(1, views / 5_000) * 1_000); // 0..1000
  const freshPts = Math.round(freshness(s.updated_at) * 1_000); // 0..1000
  const verifiedPts = s.verified ? 500 : 0;

  return completenessPts + ratingPts + reviewPts + viewPts + freshPts + verifiedPts;
}

/** 1 nếu cập nhật hôm nay, giảm dần về 0 sau 180 ngày. */
export function freshness(updatedAt?: string | null): number {
  if (!updatedAt) return 0;
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(days) || days < 0) return 1;
  return clamp(1 - days / 180, 0, 1);
}

export function calculatePriorityScore(s: SupplierInput): number {
  const base = TIER_BASE[s.tier] ?? 0;
  // Featured: cộng thêm theo giá thầu hiệu lực (1 điểm / 1.000₫, trần 50.000 điểm)
  const bidPts =
    s.tier === "featured" ? Math.min(50_000, Math.round((s.effective_bid ?? 0) / 1_000)) : 0;
  return base + bidPts + qualityScore(s);
}

/**
 * Sắp hạng: điểm ưu tiên giảm dần, tie-break theo rating → số review → lượt xem →
 * cập nhật gần nhất → tên (A→Z) để thứ tự luôn ổn định (deterministic).
 */
export function rankSuppliers(list: SupplierInput[]): RankedSupplier[] {
  return [...list]
    .map((s) => ({ ...s, priority_score: calculatePriorityScore(s), display_order: 0 }))
    .sort(
      (a, b) =>
        b.priority_score - a.priority_score ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (b.review_count ?? 0) - (a.review_count ?? 0) ||
        (b.views ?? 0) - (a.views ?? 0) ||
        tsOf(b.updated_at) - tsOf(a.updated_at) ||
        a.name.localeCompare(b.name, "vi"),
    )
    .map((s, i) => ({ ...s, display_order: i + 1 }));
}

/**
 * Đấu giá second-price (Vickrey): người thắng chỉ trả giá của người ngay sau + bước giá.
 * Trả về danh sách bid kèm rank, effective_bid và trạng thái won/lost.
 */
export const BID_STEP = 10_000;
export const MIN_BID = 100_000;
export const FEATURED_SLOTS = 3;

export type BidInput = {
  id: string;
  company_id: string;
  bid_amount: number;
  created_at?: string | null;
};

export type BidResult = BidInput & {
  rank: number;
  effective_bid: number;
  bid_status: "won" | "lost";
};

export function resolveAuction(bids: BidInput[], slots = FEATURED_SLOTS): BidResult[] {
  const sorted = [...bids].sort(
    (a, b) => b.bid_amount - a.bid_amount || tsOf(a.created_at) - tsOf(b.created_at),
  );
  return sorted.map((bid, i) => {
    const next = sorted[i + 1];
    const won = i < slots;
    const effective = won
      ? Math.max(MIN_BID, Math.min(bid.bid_amount, (next?.bid_amount ?? MIN_BID) + BID_STEP))
      : 0;
    return {
      ...bid,
      rank: i + 1,
      effective_bid: effective,
      bid_status: won ? "won" : "lost",
    };
  });
}

/** Độ đầy đủ hồ sơ 0..1 dựa trên các trường quan trọng của nhà máy. */
export function profileCompleteness(c: Record<string, unknown>): number {
  const fields = [
    "description",
    "logo_url",
    "cover_url",
    "phone",
    "email",
    "website",
    "address",
    "industry",
    "province",
    "employee_range",
    "founded_year",
    "revenue_range",
  ];
  const filled = fields.filter((f) => {
    const v = c[f];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  const jsonbFilled = ["capabilities", "certifications", "gallery_urls", "faqs"].filter((f) => {
    const v = c[f];
    return Array.isArray(v) ? v.length > 0 : v && Object.keys(v as object).length > 0;
  }).length;
  return clamp((filled + jsonbFilled) / (fields.length + 4), 0, 1);
}

export function formatVnd(n: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(n))}₫`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function tsOf(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}
