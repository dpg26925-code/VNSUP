import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LogIn,
  LogOut,
  Shield,
  ChevronDown,
  Mail,
  BookOpen,
  Sparkles,
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
    <header className="sticky top-0 z-40 border-b border-primary/20 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-4 py-5 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 rotate-45 place-items-center bg-primary">
            <Sparkles className="h-5 w-5 -rotate-45 text-primary-foreground" />
          </div>
          <div className="min-w-0 leading-none">
            <div
              className="truncate text-base font-bold uppercase tracking-[0.2em] text-foreground sm:text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Người nổi tiếng
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
              Danh bạ nhân vật
            </div>
          </div>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/80 lg:flex">
            <a href="#library" className="transition hover:text-primary">
              Khám phá
            </a>
            <div ref={infoRef} className="relative">
              <button
                onClick={() => setInfoOpen((v) => !v)}
                className="inline-flex items-center gap-1 transition hover:text-primary"
              >
                Thông tin
                <ChevronDown
                  className={
                    "h-4 w-4 transition " + (infoOpen ? "rotate-180" : "")
                  }
                />
              </button>
              {infoOpen && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden border border-primary/20 bg-popover shadow-xl">
                  <a
                    href="#about"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    <BookOpen className="h-4 w-4 text-primary" /> Giới thiệu
                  </a>
                  <a
                    href="#featured"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    <Sparkles className="h-4 w-4 text-primary" /> Nổi bật
                  </a>
                  <a
                    href="mailto:hello@example.com"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    <Mail className="h-4 w-4 text-primary" /> Liên hệ
                  </a>
                </div>
              )}
            </div>
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Tìm kiếm nhân vật…"
              className="w-64 border-b border-primary/30 bg-secondary/70 px-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
            />
          </nav>

          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 border border-primary/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <Shield className="h-3.5 w-3.5" /> Quản lý
            </Link>
          )}
          {userId ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 border border-foreground/20 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-foreground/80 transition hover:border-primary hover:text-primary"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 border border-primary px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <LogIn className="h-3.5 w-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
