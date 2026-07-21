import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory, LogIn, LogOut, Shield, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return setIsAdmin(false);
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { q: q || undefined } as any });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Factory className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">FactoryHub</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Vietnam</div>
          </div>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block">
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-md border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhà máy CNC, ép nhựa, SMT…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-sm">
          <Link to="/search" className="hidden rounded-md px-3 py-1.5 hover:bg-accent sm:inline-block">Tìm kiếm</Link>
          {isAdmin && (
            <Link to="/admin" className="hidden items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 sm:inline-flex">
              <Shield className="h-3.5 w-3.5" /> Quản lý
            </Link>
          )}
          {userId ? (
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70">
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <LogIn className="h-3.5 w-3.5" /> Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold"><Factory className="h-4 w-4 text-primary" /> FactoryHub Vietnam</div>
          <p className="mt-2 text-muted-foreground">Nền tảng AI danh bạ nhà máy sản xuất Việt Nam.</p>
        </div>
        <div>
          <div className="font-semibold">Khám phá</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Tìm nhà máy</Link></li>
            <li><Link to="/industry/$slug" params={{ slug: "cnc" }} className="hover:text-foreground">CNC</Link></li>
            <li><Link to="/industry/$slug" params={{ slug: "nhua" }} className="hover:text-foreground">Ép nhựa</Link></li>
            <li><Link to="/industry/$slug" params={{ slug: "dien-tu" }} className="hover:text-foreground">Điện tử SMT</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Khu vực</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li><Link to="/province/$slug" params={{ slug: "binh-duong" }} className="hover:text-foreground">Bình Dương</Link></li>
            <li><Link to="/province/$slug" params={{ slug: "dong-nai" }} className="hover:text-foreground">Đồng Nai</Link></li>
            <li><Link to="/province/$slug" params={{ slug: "bac-ninh" }} className="hover:text-foreground">Bắc Ninh</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Về chúng tôi</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>Liên hệ: hello@factoryhub.vn</li>
            <li>© {new Date().getFullYear()} FactoryHub</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
