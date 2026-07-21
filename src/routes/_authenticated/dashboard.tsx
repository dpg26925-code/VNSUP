import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Admin | FactoryHub" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
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

  if (!checked) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Đang tải…</div>;

  // Users without any admin-tier role fall back to the legacy account pages.
  const hasAdminRole = role === "admin" || role === "publisher" || role === "editor";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        {hasAdminRole && <AdminSidebar role={role} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-3">
            {hasAdminRole && <SidebarTrigger />}
            <Link to="/" className="text-sm font-semibold">
              FactoryHub {hasAdminRole && <span className="text-muted-foreground font-normal">/ Admin</span>}
            </Link>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="hidden text-muted-foreground sm:inline">{email}</span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5" /> Đăng xuất
              </button>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
