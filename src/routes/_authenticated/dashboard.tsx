import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand-logo";
import {
  LogOut,
  Building2,
  Inbox,
  Send,
  User,
  LayoutDashboard,
  CreditCard,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Bảng điều khiển | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const { data: rows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        const roles = (rows ?? []).map((r) => r.role as string);
        const rank = { admin: 3, publisher: 2, editor: 1 } as Record<string, number>;
        const highest = roles.reduce<string | null>(
          (best, r) => ((rank[r] ?? 0) > (rank[best ?? ""] ?? 0) ? r : best),
          null,
        );
        setRole(highest);
      }
      setChecked(true);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!checked)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Đang tải thông tin người dùng…
      </div>
    );

  const hasAdminRole = role === "admin" || role === "publisher" || role === "editor";
  const path = location.pathname;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        {hasAdminRole && <AdminSidebar role={role} />}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              {hasAdminRole && <SidebarTrigger />}
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" />
                {hasAdminRole && <span className="text-muted-foreground font-normal text-xs">/ Admin</span>}
              </div>
            </div>

            {/* User Nav (Non-admin top menu) */}
            {!hasAdminRole && (
              <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
                <Link
                  to="/"
                  className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  Trang chủ
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md transition ${
                    path === "/dashboard" || path === "/dashboard/"
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  Tổng quan
                </Link>
                <Link
                  to="/dashboard/my-companies"
                  className={`px-3 py-1.5 rounded-md transition ${
                    path.startsWith("/dashboard/my-companies") || path.startsWith("/dashboard/manage-company")
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  Nhà máy của tôi
                </Link>
                <Link
                  to="/dashboard/leads"
                  className={`px-3 py-1.5 rounded-md transition ${
                    path.startsWith("/dashboard/leads")
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  Hộp thư Báo giá (RFQ)
                </Link>
                <Link
                  to="/dashboard/claim"
                  className={`px-3 py-1.5 rounded-md transition ${
                    path.startsWith("/dashboard/claim")
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  Xác thực (Claim)
                </Link>
                <Link
                  to="/dashboard/submit-company"
                  className={`px-3 py-1.5 rounded-md transition ${
                    path.startsWith("/dashboard/submit-company")
                      ? "bg-brand text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  + Đăng ký nhà máy
                </Link>
                <Link
                  to="/pricing"
                  className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Gói dịch vụ
                </Link>
              </nav>
            )}

            <div className="flex items-center gap-3 text-xs">
              <Link
                to="/dashboard/profile"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition ${
                  path.startsWith("/dashboard/profile") ? "border-brand text-brand bg-brand/5" : "hover:bg-accent text-foreground"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">{email}</span>
              </Link>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </header>

          {/* Subheader mobile menu for non-admin */}
          {!hasAdminRole && (
            <div className="border-b bg-background px-4 py-2 lg:hidden overflow-x-auto">
              <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap">
                <Link
                  to="/"
                  className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground"
                >
                  Trang chủ
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md ${
                    path === "/dashboard" || path === "/dashboard/" ? "bg-brand text-white shadow-xs" : "bg-muted text-foreground"
                  }`}
                >
                  Tổng quan
                </Link>
                <Link
                  to="/dashboard/my-companies"
                  className={`px-3 py-1.5 rounded-md ${
                    path.startsWith("/dashboard/my-companies") || path.startsWith("/dashboard/manage-company")
                      ? "bg-brand text-white shadow-xs"
                      : "bg-muted text-foreground"
                  }`}
                >
                  Nhà máy của tôi
                </Link>
                <Link
                  to="/dashboard/leads"
                  className={`px-3 py-1.5 rounded-md ${
                    path.startsWith("/dashboard/leads") ? "bg-brand text-white shadow-xs" : "bg-muted text-foreground"
                  }`}
                >
                  Hộp thư RFQ
                </Link>
                <Link
                  to="/dashboard/claim"
                  className={`px-3 py-1.5 rounded-md ${
                    path.startsWith("/dashboard/claim") ? "bg-brand text-white shadow-xs" : "bg-muted text-foreground"
                  }`}
                >
                  Xác thực
                </Link>
                <Link
                  to="/dashboard/submit-company"
                  className={`px-3 py-1.5 rounded-md ${
                    path.startsWith("/dashboard/submit-company") ? "bg-brand text-white shadow-xs" : "bg-muted text-foreground"
                  }`}
                >
                  + Đăng ký mới
                </Link>
                <Link to="/pricing" className="px-3 py-1.5 rounded-md bg-muted text-foreground">
                  Gói nâng cấp
                </Link>
              </div>
            </div>
          )}

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
