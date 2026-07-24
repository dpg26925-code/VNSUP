import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory, LogIn, LogOut, Shield, Search, Facebook, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
            <Factory className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            VNSupplier
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block">
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 transition focus-within:ring-2 focus-within:ring-brand/25">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm CNC, ép nhựa, SMT…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link to="/search" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block">Tìm kiếm</Link>
          <Link to="/pricing" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block">Bảng giá</Link>
          <ThemeToggle />
          {isAdmin && (
            <Link to="/dashboard/admin/edit" className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary sm:inline-flex">
              <Shield className="h-3.5 w-3.5" strokeWidth={1.75} /> Quản lý
            </Link>
          )}
          {userId ? (
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> Đăng xuất
            </button>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-sm transition hover:-translate-y-px hover:bg-brand/90">
              <LogIn className="h-3.5 w-3.5" strokeWidth={2} /> Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground">
                <Factory className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <span className="font-bold tracking-tight">VNSupplier</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Danh bạ AI nhà máy & nhà cung cấp sản xuất Việt Nam.
            </p>
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              <a href="https://zalo.me/vnsupplier" target="_blank" rel="noreferrer" aria-label="Zalo" className="hover:text-foreground">
                <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a href="https://www.linkedin.com/company/vnsupplier" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-foreground">
                <Linkedin className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a href="https://facebook.com/vnsupplier" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-foreground">
                <Facebook className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a href="https://youtube.com/@vnsupplier" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-foreground">
                <Youtube className="h-5 w-5" strokeWidth={1.75} />
              </a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Khám phá</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground">Tìm nhà máy</Link></li>
              <li><Link to="/industry/$slug" params={{ slug: "cnc" }} className="hover:text-foreground">CNC</Link></li>
              <li><Link to="/industry/$slug" params={{ slug: "nhua" }} className="hover:text-foreground">Ép nhựa</Link></li>
              <li><Link to="/industry/$slug" params={{ slug: "dien-tu" }} className="hover:text-foreground">Điện tử SMT</Link></li>
              <li><Link to="/industry/$slug" params={{ slug: "kim-loai" }} className="hover:text-foreground">Kim loại</Link></li>
              <li><Link to="/industry/$slug" params={{ slug: "bao-bi" }} className="hover:text-foreground">Bao bì</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Khu vực</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/province/$slug" params={{ slug: "ha-noi" }} className="hover:text-foreground">Hà Nội</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "tp-hcm" }} className="hover:text-foreground">TP.HCM</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "hai-phong" }} className="hover:text-foreground">Hải Phòng</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "bac-ninh" }} className="hover:text-foreground">Bắc Ninh</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "dong-nai" }} className="hover:text-foreground">Đồng Nai</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "tp-hcm" }} className="hover:text-foreground">Bình Dương</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <div>© {year} VNSupplier. All rights reserved.</div>
          <div className="mt-1">
            <Link to="/" hash="terms" className="hover:text-foreground">Điều khoản</Link>
            <span className="mx-2">|</span>
            <Link to="/" hash="privacy" className="hover:text-foreground">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
