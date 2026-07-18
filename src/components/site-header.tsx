import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, LogIn, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">
              Người nổi tiếng
            </div>
            <div className="text-[11px] text-muted-foreground">
              Danh bạ người nổi tiếng Việt & thế giới
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 sm:inline-flex"
            >
              <Shield className="h-3.5 w-3.5" /> Quản lý
            </Link>
          )}
          {userId ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <LogIn className="h-3.5 w-3.5" /> Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
