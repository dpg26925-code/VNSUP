import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Shield, Search, Facebook, Linkedin, Youtube, MessageCircle, Menu, X, PlusCircle, Factory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Adaptive to Dark/Light mode */}
        <BrandLogo size="md" />

        {/* Quick Search Omnibar on Header */}
        <form onSubmit={submitSearch} className="hidden flex-1 md:block max-w-sm lg:max-w-md mx-2">
          <div className="relative flex items-center rounded-xl border border-border/80 bg-card/60 px-3 py-1.5 transition-all focus-within:border-brand focus-within:bg-card focus-within:ring-2 focus-within:ring-brand/20 shadow-2xs">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhà máy, công nghệ gia công, linh kiện…"
              className="w-full bg-transparent px-2 text-xs lg:text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        {/* Navigation Links */}
        <nav className="ml-auto flex items-center gap-1.5 text-sm">
          <Link
            to="/companies"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground md:inline-block"
          >
            Nhà máy
          </Link>
          <Link
            to="/kcn-ccn"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground md:inline-block"
          >
            Khu công nghiệp
          </Link>
          <Link
            to="/search"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground lg:inline-block"
          >
            Tìm kiếm AI
          </Link>
          <Link
            to="/blog"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground xl:inline-block"
          >
            Tin tức & Báo cáo
          </Link>
          <Link
            to="/pricing"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground lg:inline-block"
          >
            Bảng giá
          </Link>

          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Post Factory / Supplier Portal Button */}
          <Link
            to="/auth"
            className="hidden items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition-all hover:bg-brand/10 hover:border-brand/60 sm:inline-flex"
          >
            <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} /> Đăng nhà máy
          </Link>

          {isAdmin && (
            <Link
              to="/dashboard/admin/edit"
              className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary sm:inline-flex"
            >
              <Shield className="h-3.5 w-3.5 text-brand" strokeWidth={2} /> Quản trị
            </Link>
          )}

          {userId ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> Đăng xuất
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand/90 hover:shadow-sm sm:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2.2} /> Đăng nhập
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center rounded-lg border border-border p-2 text-foreground hover:bg-secondary md:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        </nav>
      </div>

      {/* Mobile slide-out drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85%] flex-col gap-2 border-l border-border bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div onClick={() => setMenuOpen(false)}>
                <BrandLogo size="sm" />
              </div>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={(e) => { setMenuOpen(false); submitSearch(e); }} className="mb-3">
              <div className="flex items-center rounded-xl border border-border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm nhà máy, CNC, ép nhựa…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </form>

            <div className="flex flex-col gap-1 text-sm font-medium">
              {[
                { to: "/", label: "Trang chủ" },
                { to: "/companies", label: "Danh sách Nhà máy" },
                { to: "/kcn-ccn", label: "Khu công nghiệp & Cụm CN" },
                { to: "/search", label: "Tìm kiếm AI thông minh" },
                { to: "/blog", label: "Tin tức & Báo cáo thị trường" },
                { to: "/pricing", label: "Bảng giá & Gói dịch vụ" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto border-t border-border pt-4 flex flex-col gap-2">
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/10 py-2.5 text-sm font-semibold text-brand"
              >
                <Factory className="h-4 w-4" /> Đăng ký hồ sơ nhà máy
              </Link>
              {userId ? (
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  className="w-full rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Đăng xuất
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl bg-brand py-2.5 text-center text-sm font-bold text-white shadow-xs hover:bg-brand/90"
                >
                  Đăng nhập tài khoản
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border/80 bg-card/60 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo size="md" />

            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Nền tảng AI kết nối mạng lưới 2,400+ nhà máy & nhà cung cấp sản xuất công nghiệp tại Việt Nam.
              Cung cấp hồ sơ năng lực chi tiết, máy móc thiết bị, chứng nhận quốc tế và gửi yêu cầu báo giá (RFQ) trực tiếp.
            </p>

            <div className="mt-6 flex items-center gap-3 text-muted-foreground">
              <a
                href="https://zalo.me/vnsupplier"
                target="_blank"
                rel="noreferrer"
                aria-label="Zalo"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:border-brand hover:text-brand transition-colors"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
              </a>
              <a
                href="https://www.linkedin.com/company/vnsupplier"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:border-brand hover:text-brand transition-colors"
              >
                <Linkedin className="h-4 w-4" strokeWidth={2} />
              </a>
              <a
                href="https://facebook.com/vnsupplier"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:border-brand hover:text-brand transition-colors"
              >
                <Facebook className="h-4 w-4" strokeWidth={2} />
              </a>
              <a
                href="https://youtube.com/@vnsupplier"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background hover:border-brand hover:text-brand transition-colors"
              >
                <Youtube className="h-4 w-4" strokeWidth={2} />
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-foreground tracking-tight">Khám phá Nền tảng</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/companies" className="hover:text-brand transition-colors">Danh bạ nhà máy</Link></li>
              <li><Link to="/kcn-ccn" className="hover:text-brand transition-colors">Khu công nghiệp (KCN/CCN)</Link></li>
              <li><Link to="/search" className="hover:text-brand transition-colors">Tìm kiếm AI thông minh</Link></li>
              <li><Link to="/blog" className="hover:text-brand transition-colors">Báo cáo thị trường & Blog</Link></li>
              <li><Link to="/pricing" className="hover:text-brand transition-colors">Bảng giá gói thành viên</Link></li>
              <li><Link to="/auth" className="hover:text-brand transition-colors">Dành cho Nhà máy sản xuất</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold text-foreground tracking-tight">Khu vực Công nghiệp</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/province/$slug" params={{ slug: "ha-noi" }} className="hover:text-brand transition-colors">Hà Nội & Bắc Bộ</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "bac-ninh" }} className="hover:text-brand transition-colors">Bắc Ninh (Điện tử & Cơ khí)</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "hai-phong" }} className="hover:text-brand transition-colors">Hải Phòng (Cảng biển & Công nghiệp)</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "tp-hcm" }} className="hover:text-brand transition-colors">TP. Hồ Chí Minh</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "dong-nai" }} className="hover:text-brand transition-colors">Đồng Nai & Đông Nam Bộ</Link></li>
              <li><Link to="/province/$slug" params={{ slug: "binh-duong" }} className="hover:text-brand transition-colors">Bình Dương (Sản xuất & Chế tạo)</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {year} VNSupplier (vnsupplier.cloud). All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/" hash="terms" className="hover:text-foreground">Điều khoản sử dụng</Link>
            <span>•</span>
            <Link to="/" hash="privacy" className="hover:text-foreground">Chính sách bảo mật</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-foreground">Về chúng tôi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
