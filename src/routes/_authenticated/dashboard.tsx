import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | FactoryHub" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      if (data.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle()
          .then(({ data: r }) => setIsAdmin(!!r));
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Xin chào {email}</h1>
        <p className="mt-1 text-muted-foreground">Bảng điều khiển tài khoản FactoryHub.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link to="/dashboard/submit-company" className="rounded-lg border border-brand/40 bg-brand-soft p-5 hover:border-brand">
            <div className="font-semibold text-brand">+ Gửi doanh nghiệp</div>
            <div className="mt-1 text-sm text-muted-foreground">Đăng ký hồ sơ nhà máy của bạn để admin duyệt.</div>
          </Link>
          <Link to="/dashboard/my-companies" className="rounded-lg border bg-card p-5 hover:border-primary">
            <div className="font-semibold">Doanh nghiệp của tôi</div>
            <div className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái duyệt và các yêu cầu claim.</div>
          </Link>
          <Link to="/search" className="rounded-lg border bg-card p-5 hover:border-primary">
            <div className="font-semibold">Tìm nhà máy</div>
            <div className="mt-1 text-sm text-muted-foreground">Khám phá danh bạ nhà máy sản xuất.</div>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-lg border border-primary/40 bg-primary/5 p-5">
              <div className="font-semibold text-primary">Quản lý & duyệt</div>
              <div className="mt-1 text-sm text-muted-foreground">Duyệt hồ sơ mới, chỉnh sửa, xoá nhà máy.</div>
            </Link>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
