import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Check, Star, BadgeCheck, Bell, X, Minus } from "lucide-react";
import { abs } from "@/lib/factory";
import { useState } from "react";

const TITLE = "Bảng giá | VNSupplier";
const DESC = "Gói dịch vụ cho nhà máy: Featured Listing, Verified Badge, Lead Notification. Minh bạch, không hợp đồng dài hạn.";
const URL_ = abs("/pricing");

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL_ },
    ],
    links: [{ rel: "canonical", href: URL_ }],
  }),
  component: PricingPage,
});

type Plan = {
  key: string;
  name: string; price: string; period: string; desc: string; icon: React.ComponentType<{ className?: string }>;
  features: string[]; highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "featured",
    name: "Featured Listing", price: "499.000₫", period: "/tháng", icon: Star, highlight: true,
    desc: "Hiển thị nổi bật trên trang chủ, trang ngành và trang tỉnh.",
    features: ["Vị trí ưu tiên trong kết quả", "Huy hiệu Featured", "Banner trên trang ngành liên quan", "Thống kê lượt xem hàng tuần"],
  },
  {
    key: "verified",
    name: "Verified Badge", price: "299.000₫", period: "/tháng", icon: BadgeCheck,
    desc: "Xác minh doanh nghiệp qua GPKD, địa chỉ nhà xưởng và liên hệ.",
    features: ["Huy hiệu Verified xanh", "Ưu tiên xếp hạng thứ 2", "Trang hồ sơ đầy đủ liên hệ", "Bảo vệ trước hồ sơ giả"],
  },
  {
    key: "lead",
    name: "Lead Notification", price: "199.000₫", period: "/tháng", icon: Bell,
    desc: "Nhận email/SMS khi có buyer gửi yêu cầu báo giá phù hợp năng lực.",
    features: ["Thông báo lead theo ngành/tỉnh", "Tối đa 50 lead/tháng", "Xuất CSV danh sách lead", "Hỗ trợ chat trong giờ hành chính"],
  },
];

const COMPARISON: { label: string; featured: boolean | string; verified: boolean | string; lead: boolean | string }[] = [
  { label: "Hồ sơ công khai", featured: true, verified: true, lead: true },
  { label: "Huy hiệu Featured", featured: true, verified: false, lead: false },
  { label: "Huy hiệu Verified", featured: false, verified: true, lead: false },
  { label: "Vị trí ưu tiên trong kết quả", featured: "Hạng 1", verified: "Hạng 2", lead: "Hạng 3" },
  { label: "Banner trang ngành liên quan", featured: true, verified: false, lead: false },
  { label: "Số lead tối đa/tháng", featured: "Không giới hạn", verified: "20", lead: "50" },
  { label: "Xuất CSV danh sách lead", featured: true, verified: false, lead: true },
  { label: "Thống kê lượt xem hàng tuần", featured: true, verified: true, lead: false },
  { label: "Hỗ trợ chat", featured: "Ưu tiên", verified: "Cơ bản", lead: "Giờ hành chính" },
];

const FAQ = [
  { q: "Tôi có thể hủy gói bất cứ lúc nào không?", a: "Có. Không hợp đồng dài hạn, hủy trong dashboard và không bị tính phí tháng tiếp theo." },
  { q: "Có thể kết hợp nhiều gói không?", a: "Có. Bạn có thể mua đồng thời Featured + Verified + Lead Notification để đạt hiệu quả tối đa." },
  { q: "Làm sao để được xác thực?", a: "Sau khi đăng ký gói Verified, đội ngũ VNSupplier sẽ đối chiếu GPKD, địa chỉ nhà xưởng và liên hệ trong 24-48h." },
  { q: "Lead có được đảm bảo chất lượng không?", a: "Chúng tôi lọc spam và chỉ chuyển các yêu cầu buyer khớp với ngành/tỉnh bạn đã khai báo. Lead không phù hợp có thể báo cáo để hoàn credit." },
  { q: "Có xuất hóa đơn VAT không?", a: "Có. Hóa đơn điện tử VAT phát hành trong 3 ngày làm việc sau khi thanh toán." },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-success" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <span className="text-xs font-medium">{v}</span>;
}

function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-brand" fill="currentColor" /> Không hợp đồng dài hạn
          </div>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">Bảng giá dịch vụ</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Đăng ký linh hoạt theo tháng. Hủy bất cứ lúc nào trong dashboard.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className={`relative rounded-xl border bg-card p-6 ${p.highlight ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Phổ biến nhất
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="font-semibold">{p.name}</div>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard/subscriptions"
                  search={{ plan: p.key === "featured" ? "featured_listing" : p.key === "verified" ? "verified_badge" : "lead_notification" }}
                  className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border hover:bg-accent"}`}
                >
                  Đăng ký & thanh toán
                </Link>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">Thanh toán qua VietQR (payOS)</p>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">So sánh chi tiết</h2>
          <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 text-left">Tính năng</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Verified</th>
                  <th className="p-4 text-center">Lead</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r, idx) => (
                  <tr key={r.label} className={idx % 2 === 0 ? "" : "bg-muted/30"}>
                    <td className="p-4 font-medium">{r.label}</td>
                    <td className="p-4 text-center"><Cell v={r.featured} /></td>
                    <td className="p-4 text-center"><Cell v={r.verified} /></td>
                    <td className="p-4 text-center"><Cell v={r.lead} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">Câu hỏi thường gặp</h2>
          <div className="mx-auto mt-6 max-w-3xl divide-y rounded-xl border bg-card">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
                    <span className="font-medium">{f.q}</span>
                    <span className="text-muted-foreground">{open ? <X className="h-4 w-4" /> : <span className="text-xl leading-none">+</span>}</span>
                  </button>
                  {open && <div className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          Cần gói doanh nghiệp cho nhiều nhà máy? Liên hệ <a href="mailto:sales@vnsupplier.cloud" className="text-primary hover:underline">sales@vnsupplier.cloud</a>.
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
