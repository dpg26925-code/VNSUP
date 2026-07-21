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
          <Link to="/search" className="rounded-lg border bg-card p-5 hover:border-primary">
            <div className="font-semibold">Tìm nhà máy</div>
            <div className="mt-1 text-sm text-muted-foreground">Khám phá danh bạ nhà máy sản xuất.</div>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-lg border border-primary/40 bg-primary/5 p-5">
              <div className="font-semibold text-primary">Quản lý dữ liệu</div>
              <div className="mt-1 text-sm text-muted-foreground">Thêm/sửa/xóa hồ sơ nhà máy.</div>
            </Link>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
