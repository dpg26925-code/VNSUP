import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Check, Star, BadgeCheck, Bell } from "lucide-react";
import { abs } from "@/lib/factory";

const TITLE = "Bảng giá | FactoryHub Vietnam";
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
  name: string; price: string; period: string; desc: string; icon: React.ComponentType<{ className?: string }>;
  features: string[]; highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Featured Listing", price: "499.000₫", period: "/tháng", icon: Star, highlight: true,
    desc: "Hiển thị nổi bật trên trang chủ, trang ngành và trang tỉnh.",
    features: ["Vị trí ưu tiên trong kết quả", "Huy hiệu Featured", "Banner trên trang ngành liên quan", "Thống kê lượt xem hàng tuần"],
  },
  {
    name: "Verified Badge", price: "299.000₫", period: "/tháng", icon: BadgeCheck,
    desc: "Xác minh doanh nghiệp qua GPKD, địa chỉ nhà xưởng và liên hệ.",
    features: ["Huy hiệu Verified xanh", "Ưu tiên xếp hạng thứ 2", "Trang hồ sơ đầy đủ liên hệ", "Bảo vệ trước hồ sơ giả"],
  },
  {
    name: "Lead Notification", price: "199.000₫", period: "/tháng", icon: Bell,
    desc: "Nhận email/SMS khi có buyer gửi yêu cầu báo giá phù hợp năng lực.",
    features: ["Thông báo lead theo ngành/tỉnh", "Tối đa 50 lead/tháng", "Xuất CSV danh sách lead", "Hỗ trợ chat trong giờ hành chính"],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Bảng giá dịch vụ</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Đăng ký linh hoạt theo tháng. Không hợp đồng dài hạn. Hủy bất cứ lúc nào.
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
                  to="/auth"
                  className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border hover:bg-accent"}`}
                >
                  Đăng ký ngay
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          Cần gói doanh nghiệp cho nhiều nhà máy? Liên hệ <a href="mailto:sales@factoryhub.vn" className="text-primary hover:underline">sales@factoryhub.vn</a>.
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
