import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPayment, listMyOrders, listMySubscriptions, listMyCompanies } from "@/lib/payments.functions";
import { Star, BadgeCheck, Bell, ShieldCheck, FileCheck2, Loader2, ExternalLink } from "lucide-react";

const PLANS = [
  { key: "featured_listing",     name: "Featured Listing",  price: 499000, icon: Star,        scope: "company" as const, ownership: "owner"     as const, unit: "/tháng",    desc: "Hiển thị nổi bật + huy hiệu Featured cho 1 công ty (30 ngày)" },
  { key: "verified_badge",       name: "Verified Badge",    price: 299000, icon: BadgeCheck,  scope: "company" as const, ownership: "owner"     as const, unit: "/tháng",    desc: "Huy hiệu xác minh cho 1 công ty (30 ngày)" },
  { key: "lead_notification",    name: "Lead Notification", price: 199000, icon: Bell,        scope: "account" as const, ownership: "owner"     as const, unit: "/tháng",    desc: "Nhận thông báo lead theo tài khoản (30 ngày)" },
  { key: "profile_verification", name: "Xác Minh Hồ Sơ",    price: 500000, icon: ShieldCheck, scope: "company" as const, ownership: "owner"     as const, unit: " · trọn đời", desc: "Admin xác minh hồ sơ doanh nghiệp của bạn và gắn huy hiệu Verified vĩnh viễn" },
  { key: "profile_claim",        name: "Claim Hồ Sơ",       price: 500000, icon: FileCheck2,  scope: "company" as const, ownership: "claimable" as const, unit: " · trọn đời", desc: "Nhận quyền sở hữu ngay một trang doanh nghiệp do admin tạo sẵn (chưa có chủ)" },
] as const;

export const Route = createFileRoute("/_authenticated/dashboard/subscriptions")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Gói dịch vụ của tôi | VNSupplier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubscriptionsPage,
});

function fmtVnd(n: number) { return n.toLocaleString("vi-VN") + "₫"; }

function SubscriptionsPage() {
  const search = useSearch({ from: "/_authenticated/dashboard/subscriptions" });
  const [selectedPlan, setSelectedPlan] = useState<string>(search.plan ?? "featured_listing");
  const [companyId, setCompanyId] = useState<string>("");

  const create = useServerFn(createPayment);
  const listOrders = useServerFn(listMyOrders);
  const listSubs = useServerFn(listMySubscriptions);
  const listCompanies = useServerFn(listMyCompanies);

  const companiesQ = useQuery({ queryKey: ["my-companies"], queryFn: () => listCompanies() });
  const ordersQ = useQuery({ queryKey: ["my-orders"], queryFn: () => listOrders() });
  const subsQ = useQuery({ queryKey: ["my-subs"], queryFn: () => listSubs() });

  const claimableQ = useQuery({
    queryKey: ["claimable-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, province")
        .is("submitted_by", null)
        .eq("status", "approved")
        .order("name")
        .limit(500);
      return data ?? [];
    },
    enabled: selectedPlan === "profile_claim",
  });

  const currentPlan = PLANS.find((p) => p.key === selectedPlan)!;
  const needCompany = currentPlan.scope === "company";
  const useClaimable = currentPlan.ownership === "claimable";
  const companyOptions = useClaimable ? (claimableQ.data ?? []) : (companiesQ.data ?? []);

  useEffect(() => { setCompanyId(""); }, [selectedPlan]);
  useEffect(() => {
    if (companyOptions.length && !companyId) setCompanyId(companyOptions[0].id);
  }, [companyOptions, companyId]);

  const buyMut = useMutation({
    mutationFn: async () => {
      return create({ data: { plan: currentPlan.key as any, companyId: needCompany ? companyId || undefined : undefined } });
    },
    onSuccess: (res) => {
      window.location.href = res.checkoutUrl;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Gói dịch vụ & Thanh toán</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chọn gói và thanh toán qua chuyển khoản VietQR (payOS).</p>

      {/* Chọn gói */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const active = selectedPlan === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setSelectedPlan(p.key)}
              className={`text-left rounded-xl border p-5 transition ${active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:border-primary/50"}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <div className="font-semibold">{p.name}</div>
              </div>
              <div className="mt-3 text-2xl font-bold">{fmtVnd(p.price)}<span className="text-sm font-normal text-muted-foreground">{p.unit}</span></div>
              <p className="mt-2 text-xs text-muted-foreground">{p.desc}</p>
            </button>
          );
        })}
      </section>

      {/* Form thanh toán */}
      <section className="mt-6 rounded-xl border bg-card p-5">
        {needCompany && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              {useClaimable ? "Chọn doanh nghiệp muốn claim (chưa có chủ sở hữu)" : "Áp dụng cho công ty của bạn"}
            </label>
            {(useClaimable ? claimableQ.isLoading : companiesQ.isLoading) ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : companyOptions.length ? (
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {companyOptions.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.province ? ` — ${c.province}` : ""}</option>
                ))}
              </select>
            ) : useClaimable ? (
              <p className="text-sm text-muted-foreground">Không còn doanh nghiệp nào chưa có chủ sở hữu. Vui lòng thử lại sau.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn chưa có công ty nào. <a href="/dashboard/submit-company" className="text-primary underline">Gửi hồ sơ công ty</a> trước khi mua gói.</p>
            )}
          </div>
        )}

        <button
          disabled={buyMut.isPending || (needCompany && !companyId)}
          onClick={() => buyMut.mutate()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {buyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Thanh toán {fmtVnd(currentPlan.price)} qua VietQR
        </button>
        {buyMut.error && (
          <p className="mt-3 text-sm text-red-600">{(buyMut.error as Error).message}</p>
        )}
      </section>


      {/* Subscriptions đang hoạt động */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Gói đang hoạt động</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Gói</th><th className="p-3 text-left">Trạng thái</th><th className="p-3 text-left">Hết hạn</th></tr>
            </thead>
            <tbody>
              {(subsQ.data ?? []).length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Chưa có gói nào</td></tr>}
              {(subsQ.data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{s.plan_type}</td>
                  <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs ${s.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted"}`}>{s.status}</span></td>
                  <td className="p-3">{new Date(s.expires_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lịch sử đơn */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Lịch sử thanh toán</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Mã đơn</th><th className="p-3 text-left">Gói</th><th className="p-3 text-right">Số tiền</th><th className="p-3 text-left">Trạng thái</th><th className="p-3 text-left">Thời gian</th></tr>
            </thead>
            <tbody>
              {(ordersQ.data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Chưa có đơn nào</td></tr>}
              {(ordersQ.data ?? []).map((o: any) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-mono text-xs">#{o.order_code}</td>
                  <td className="p-3">{o.plan_type}</td>
                  <td className="p-3 text-right">{fmtVnd(o.amount)}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${o.status === "paid" ? "bg-emerald-100 text-emerald-800" : o.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-muted"}`}>{o.status}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
