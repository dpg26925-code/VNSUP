import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/payment/cancel")({
  head: () => ({
    meta: [
      { title: "Đã hủy thanh toán | VNSupplier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <XCircle className="mx-auto h-16 w-16 text-orange-500" />
        <h1 className="mt-6 text-3xl font-bold">Đã hủy thanh toán</h1>
        <p className="mt-3 text-muted-foreground">Bạn có thể quay lại chọn gói và thử lại bất cứ lúc nào.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/pricing" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Xem bảng giá
          </Link>
          <Link to="/dashboard" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
            Về dashboard
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
