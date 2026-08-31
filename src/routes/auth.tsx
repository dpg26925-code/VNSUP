import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Building2, ShoppingBag, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập & Đăng ký Doanh nghiệp | VNSupplier" },
      { name: "description", content: "Đăng nhập hoặc đăng ký tài khoản Doanh nghiệp / Nhà máy / Khách mua hàng B2B trên VNSupplier." },
    ],
    links: [
      { rel: "canonical", href: "https://vnsupplier.cloud/auth" },
      { rel: "alternate", hrefLang: "vi", href: "https://vnsupplier.cloud/auth" },
      { rel: "alternate", hrefLang: "x-default", href: "https://vnsupplier.cloud/auth" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [accountType, setAccountType] = useState<"supplier" | "buyer">("supplier");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; name?: boolean; company?: boolean }>({});

  useEffect(() => {
    // If user is already logged in, redirect to target or dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        navigate({ to: (search.redirect as any) || "/dashboard" });
      }
    });
  }, [navigate, search.redirect]);

  const emailErr = useMemo(() => {
    if (!touched.email) return null;
    if (!email) return "Email là bắt buộc";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không hợp lệ";
    return null;
  }, [email, touched.email]);

  const passErr = useMemo(() => {
    if (!touched.password) return null;
    if (!password) return "Mật khẩu là bắt buộc";
    if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
    return null;
  }, [password, touched.password]);

  const nameErr = useMemo(() => {
    if (mode !== "signup" || !touched.name) return null;
    if (displayName.trim().length < 2) return "Vui lòng nhập họ và tên của bạn";
    return null;
  }, [displayName, mode, touched.name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, name: true, company: true });
    if (emailErr || passErr || (mode === "signup" && nameErr)) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const redirectTo = `${window.location.origin}${search.redirect || "/dashboard"}`;
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: displayName.trim(),
              company_name: companyName.trim() || undefined,
              account_type: accountType,
            },
          },
        });
        if (signUpErr) throw signUpErr;
        setMessage("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản nếu hệ thống yêu cầu.");
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
        navigate({ to: (search.redirect as any) || "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${search.redirect || "/dashboard"}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthErr) throw oauthErr;
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Đăng nhập Google thất bại";
      const isProviderDisabled = /provider is not enabled|unsupported provider/i.test(rawMessage);
      setError(
        isProviderDisabled
          ? "Google OAuth chưa được kích hoạt trong Supabase Auth."
          : rawMessage,
      );
      setLoading(false);
    }
  };

  const inputCls = (err: string | null) =>
    `w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition ${
      err ? "border-destructive focus:ring-2 focus:ring-destructive/20" : "border-input focus:border-brand focus:ring-2 focus:ring-brand/20"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/80 bg-card p-7 shadow-xl shadow-brand/5">
        <div className="text-center flex flex-col items-center">
          <BrandLogo size="lg" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Đăng nhập Doanh nghiệp" : "Đăng ký Tài khoản B2B"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin"
              ? "Quản lý hồ sơ nhà máy, catalogue và yêu cầu báo giá"
              : "Kết nối chuỗi cung ứng sản xuất hàng đầu Việt Nam"}
          </p>
        </div>

        {/* Account Type Selector for Sign Up */}
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setAccountType("supplier")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                accountType === "supplier"
                  ? "bg-card text-brand shadow-xs border border-brand/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Nhà máy / Supplier
            </button>
            <button
              type="button"
              onClick={() => setAccountType("buyer")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                accountType === "buyer"
                  ? "bg-card text-brand shadow-xs border border-brand/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Khách mua / Buyer
            </button>
          </div>
        )}

        <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-center text-xs">
          <div className="inline-flex items-center gap-1.5 font-semibold text-brand">
            <BadgeCheck className="h-4 w-4" /> 2,400+ nhà máy sản xuất đã gia nhập VNSupplier
          </div>
        </div>

        <button
          onClick={google}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition shadow-2xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Tiếp tục với tài khoản Google
        </button>

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-3 relative z-10 font-medium">hoặc qua email</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          {mode === "signup" && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Họ và tên của bạn *"
                  value={displayName}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputCls(nameErr)}
                />
                {nameErr && <p className="mt-1 text-xs text-destructive">{nameErr}</p>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder={accountType === "supplier" ? "Tên nhà máy / doanh nghiệp sản xuất" : "Tên công ty / đơn vị mua hàng"}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputCls(null)}
                />
              </div>
            </>
          )}

          <div>
            <input
              type="email"
              required
              placeholder="Email công việc *"
              value={email}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls(emailErr)}
            />
            {emailErr && <p className="mt-1 text-xs text-destructive">{emailErr}</p>}
          </div>

          <div>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mật khẩu (tối thiểu 6 ký tự) *"
              value={password}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls(passErr)}
            />
            {passErr && <p className="mt-1 text-xs text-destructive">{passErr}</p>}
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 hover:bg-brand/90 disabled:opacity-60 transition"
          >
            {loading ? (
              "Đang xử lý..."
            ) : mode === "signin" ? (
              <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Tạo tài khoản Doanh nghiệp <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setTouched({});
              setError(null);
              setMessage(null);
            }}
            className="font-semibold text-brand hover:underline"
          >
            {mode === "signin" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </button>
          {mode === "signin" && (
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Quên mật khẩu?
            </Link>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground border-t border-border/60 pt-4">
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <Link to="/about" className="underline hover:text-foreground">
            Điều khoản dịch vụ & Chính sách bảo mật B2B
          </Link>{" "}
          của VNSupplier.
        </p>
      </div>
    </div>
  );
}
