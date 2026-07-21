import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập | VNSupplier" },
      { name: "description", content: "Đăng nhập hoặc đăng ký tài khoản VNSupplier." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; name?: boolean }>({});

  useEffect(() => {}, [navigate]);

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
    if (displayName.trim().length < 2) return "Nhập tên hiển thị";
    return null;
  }, [displayName, mode, touched.name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, name: true });
    if (emailErr || passErr || (mode === "signup" && nameErr)) return;
    setError(null); setMessage(null); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: displayName } },
        });
        if (error) throw error;
        setMessage("Kiểm tra email để xác nhận tài khoản (nếu bật xác nhận email).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
  };

  const inputCls = (err: string | null) => `w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition ${err ? "border-destructive focus:ring-2 focus:ring-destructive/20" : "focus:ring-2 focus:ring-primary/20"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <Link to="/" className="text-sm font-bold text-brand">VNSupplier</Link>
          <h1 className="mt-4 text-2xl font-semibold">
            {mode === "signin" ? "Đăng nhập" : "Đăng ký"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Chào mừng trở lại" : "Tạo tài khoản buyer hoặc nhà máy"}
          </p>
        </div>

        <div className="rounded-lg border border-brand/20 bg-brand-soft/40 p-3 text-center text-xs">
          <div className="inline-flex items-center gap-1.5 font-semibold text-brand">
            <BadgeCheck className="h-3.5 w-3.5" /> 2,400+ nhà máy đã tham gia VNSupplier
          </div>
        </div>

        <button
          onClick={google}
          type="button"
          className="w-full rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Tiếp tục với Google
        </button>

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">hoặc</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          {mode === "signup" && (
            <div>
              <input
                type="text" placeholder="Tên hiển thị"
                value={displayName} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputCls(nameErr)}
              />
              {nameErr && <p className="mt-1 text-xs text-destructive">{nameErr}</p>}
            </div>
          )}
          <div>
            <input
              type="email" required placeholder="Email" value={email}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls(emailErr)}
            />
            {emailErr && <p className="mt-1 text-xs text-destructive">{emailErr}</p>}
          </div>
          <div>
            <input
              type="password" required minLength={6} placeholder="Mật khẩu (≥ 6 ký tự)" value={password}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls(passErr)}
            />
            {passErr && <p className="mt-1 text-xs text-destructive">{passErr}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setTouched({}); setError(null); }} className="text-primary hover:underline">
            {mode === "signin" ? "Tạo tài khoản" : "Đã có tài khoản?"}
          </button>
          {mode === "signin" && (
            <Link to="/forgot-password" className="text-primary hover:underline">Quên mật khẩu?</Link>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Bằng cách tiếp tục, bạn đồng ý với <Link to="/about" className="underline">Điều khoản</Link> của VNSupplier.
        </p>
      </div>
    </div>
  );
}
