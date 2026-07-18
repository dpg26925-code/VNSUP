import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  LogIn,
  LogOut,
  Shield,
  Search,
  Compass,
  Info,
  ChevronDown,
  Mail,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({
  onSearch,
  searchValue,
}: {
  onSearch?: (v: string) => void;
  searchValue?: string;
}) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return setIsAdmin(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node))
        setInfoOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-lg font-extrabold tracking-tight text-primary">
              Người nổi tiếng
            </span>
            <span className="text-sm text-muted-foreground">/ Danh bạ</span>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden flex-1 md:block">
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-white/10 bg-card/60 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Tìm tên, nghệ danh, lĩnh vực…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <a
            href="#library"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/90 hover:text-primary sm:inline-flex"
          >
            <Compass className="h-4 w-4" /> Khám phá
          </a>

          <div ref={infoRef} className="relative hidden sm:block">
            <button
              onClick={() => setInfoOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/90 hover:text-primary"
            >
              <Info className="h-4 w-4" /> Thông tin
              <ChevronDown
                className={
                  "h-3.5 w-3.5 transition " + (infoOpen ? "rotate-180" : "")
                }
              />
            </button>
            {infoOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-popover shadow-xl">
                <a
                  href="#about"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  <BookOpen className="h-4 w-4 text-primary" /> Giới thiệu
                </a>
                <a
                  href="#featured"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  <Sparkles className="h-4 w-4 text-primary" /> Nổi bật
                </a>
                <a
                  href="mailto:hello@example.com"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  <Mail className="h-4 w-4 text-primary" /> Liên hệ
                </a>
              </div>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            >
              <LogIn className="h-3.5 w-3.5" /> Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
