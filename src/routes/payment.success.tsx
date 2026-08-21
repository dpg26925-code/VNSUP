import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/payment/success")({
  head: () => ({
    meta: [
      { title: "Thanh toán thành công | VNSupplier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    orderCode: typeof s.orderCode === "string" ? s.orderCode : undefined,
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderCode } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 text-3xl font-bold">Thanh toán thành công!</h1>
        <p className="mt-3 text-muted-foreground">
          Cảm ơn bạn. Gói dịch vụ sẽ được kích hoạt trong vài giây sau khi hệ thống xác nhận từ ngân hàng.
        </p>
        {orderCode && (
          <p className="mt-2 text-sm text-muted-foreground">Mã đơn: <span className="font-mono">#{orderCode}</span></p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/dashboard/subscriptions" search={{}} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Xem gói của tôi
          </Link>
          <Link to="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
            Về trang chủ
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
