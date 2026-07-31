import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMyCompanies } from "@/lib/payments.functions";
import {
  getAuctionStatus,
  placeFeaturedBid,
  recalculatePriority,
  endAuctionRound,
} from "@/lib/priority.functions";
import { INDUSTRIES, PROVINCES } from "@/lib/factory";
import { BID_STEP, MIN_BID, FEATURED_SLOTS, formatVnd, TIER_LABEL } from "@/lib/priority";
import { Gavel, Loader2, RefreshCw, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/auction")({
  head: () => ({
    meta: [
      { title: "Đấu giá vị trí Featured | VNSupplier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuctionPage,
});

function AuctionPage() {
  const qc = useQueryClient();
  const [industry, setIndustry] = useState(INDUSTRIES[0]?.slug ?? "");
  const [province, setProvince] = useState(PROVINCES[0]?.slug ?? "");
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState(MIN_BID);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const listCompanies = useServerFn(listMyCompanies);
  const status = useServerFn(getAuctionStatus);
  const bid = useServerFn(placeFeaturedBid);
  const recalc = useServerFn(recalculatePriority);
  const endRound = useServerFn(endAuctionRound);

  const companiesQ = useQuery({ queryKey: ["my-companies"], queryFn: () => listCompanies() });

  const roleQ = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.rpc("is_admin_role", { _user_id: u.user.id });
      return Boolean(data);
    },
  });

  const slotKey = ["auction", industry, province] as const;
  const statusQ = useQuery({
    queryKey: slotKey,
    queryFn: () => status({ data: { industry_slug: industry, province_slug: province } }),
    enabled: Boolean(industry && province),
  });

  const rankingQ = useQuery({
    queryKey: ["priority-cache", industry, province],
    queryFn: async () => {
      const { data } = await supabase
        .from("priority_cache")
        .select("company_id, priority_score, display_order")
        .eq("industry_slug", industry)
        .eq("province_slug", province)
        .order("display_order", { ascending: true })
        .limit(20);
      if (!data?.length) return [];
      const { data: cos } = await supabase
        .from("companies")
        .select("id, name, slug, is_featured, is_verified")
        .in("id", data.map((r) => r.company_id));
      const byId = new Map((cos ?? []).map((c) => [c.id, c]));
      return data.map((r) => ({ ...r, company: byId.get(r.company_id) }));
    },
    enabled: Boolean(industry && province),
  });

  const bidM = useMutation({
    mutationFn: async () => {
      setErr(null);
      setMsg(null);
      return bid({
        data: {
          industry_slug: industry,
          province_slug: province,
          company_id: companyId,
          bid_amount: amount,
        },
      });
    },
    onSuccess: () => {
      setMsg("Đã ghi nhận giá thầu. Kết quả được chốt khi phiên kết thúc (second-price).");
      qc.invalidateQueries({ queryKey: slotKey });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Đặt giá thất bại"),
  });

  const adminM = useMutation({
    mutationFn: async (mode: "recalc" | "settle") => {
      setErr(null);
      setMsg(null);
      if (mode === "recalc") {
        return recalc({ data: { industry_slug: industry, province_slug: province } });
      }
      return endRound({ data: { industry_slug: industry, province_slug: province } });
    },
    onSuccess: () => {
      setMsg("Hoàn tất. Thứ tự hiển thị đã được cập nhật.");
      qc.invalidateQueries({ queryKey: ["priority-cache", industry, province] });
      qc.invalidateQueries({ queryKey: slotKey });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Thao tác thất bại"),
  });

  const isAdmin = roleQ.data === true;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">Đấu giá vị trí Featured</h1>
            <p className="text-sm text-muted-foreground">
              {FEATURED_SLOTS} slot mỗi ngành × tỉnh · giá sàn {formatVnd(MIN_BID)} · bước{" "}
              {formatVnd(BID_STEP)}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Ngành</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {INDUSTRIES.map((i) => (
                <option key={i.slug} value={i.slug}>{i.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tỉnh / Thành phố</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {PROVINCES.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Công ty của bạn</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— Chọn công ty —</option>
              {(companiesQ.data ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Giá thầu (₫/tháng)</span>
            <input
              type="number"
              min={MIN_BID}
              step={BID_STEP}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <button
            type="button"
            disabled={!companyId || bidM.isPending}
            onClick={() => bidM.mutate()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
          >
            {bidM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            Đặt giá
          </button>
        </div>

        {statusQ.data ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Giá thầu cao nhất bạn thấy được trong phiên này:{" "}
            <strong>{formatVnd(statusQ.data.highest_visible_bid || MIN_BID)}</strong> · người thắng chỉ
            trả giá của người kế tiếp + 1 bước (đấu giá second-price).
          </p>
        ) : null}

        {msg ? <p className="mt-3 text-sm text-brand">{msg}</p> : null}
        {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-brand" /> Thứ tự hiển thị hiện tại
          </h2>
          {isAdmin ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => adminM.mutate("settle")}
                disabled={adminM.isPending}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand disabled:opacity-50"
              >
                Chốt phiên
              </button>
              <button
                type="button"
                onClick={() => adminM.mutate("recalc")}
                disabled={adminM.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {adminM.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Tính lại
              </button>
            </div>
          ) : null}
        </div>

        {rankingQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : (rankingQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có dữ liệu ưu tiên cho slot này. Admin có thể bấm “Tính lại”.
          </p>
        ) : (
          <ol className="divide-y">
            {(rankingQ.data ?? []).map((r) => (
              <li key={r.company_id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-7 shrink-0 text-center font-mono text-xs text-muted-foreground">
                    #{r.display_order}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {r.company?.name ?? r.company_id}
                  </span>
                  {r.company?.is_featured ? (
                    <span className="shrink-0 rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-foreground">
                      {TIER_LABEL.featured}
                    </span>
                  ) : r.company?.is_verified ? (
                    <span className="shrink-0 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                      Verified
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {r.priority_score.toLocaleString("vi-VN")} đ/điểm
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
