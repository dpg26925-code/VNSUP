import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Lock, ShieldCheck, Building2, CheckCircle2, AlertCircle, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Cài đặt Tài khoản | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("user");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Profile update state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        setFullName((data.user.user_metadata?.full_name as string) || "");
        setPhone((data.user.user_metadata?.phone as string) || "");

        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        if (roles && roles.length > 0) {
          setRole(roles[0].role as string);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });
      if (error) throw error;
      setProfileSuccess("Cập nhật thông tin tài khoản thành công!");
    } catch (err: any) {
      setProfileError(err?.message || "Không thể cập nhật thông tin.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassSaving(true);
    setPassSuccess(null);
    setPassError(null);

    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      setPassSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Xác nhận mật khẩu mới không trùng khớp.");
      setPassSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setPassSuccess("Đổi mật khẩu thành công!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err?.message || "Không thể đổi mật khẩu.");
    } finally {
      setPassSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Đang tải thông tin tài khoản…</div>;
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1";

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt Tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý thông tin hồ sơ đại diện, số điện thoại liên hệ và bảo mật tài khoản.
          </p>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Left card: User overview */}
          <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
                <User className="h-10 w-10" />
              </div>
              <h2 className="mt-4 font-bold text-foreground text-lg">{fullName || "Người dùng VNSupplier"}</h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                <ShieldCheck className="h-3.5 w-3.5" />
                {role === "admin" ? "Quản trị viên (Admin)" : "Thành viên Doanh nghiệp"}
              </div>
            </div>

            <div className="mt-6 border-t pt-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đang hoạt động</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày tham gia:</span>
                <span className="font-medium text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <Link
                to="/dashboard/my-companies"
                className="flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent text-foreground w-full"
              >
                <Building2 className="h-4 w-4 text-brand" /> Nhà máy của tôi
              </Link>
            </div>
          </div>

          {/* Right column: Forms */}
          <div className="space-y-6 md:col-span-2">
            {/* Form 1: General Info */}
            <form onSubmit={handleUpdateProfile} className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-brand" /> Thông tin cá nhân & Đại diện
              </h2>

              {profileSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Địa chỉ Email</label>
                  <input
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Email dùng để đăng nhập và nhận thông báo báo giá RFQ.</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Họ và tên người đại diện *</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Số điện thoại liên hệ</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901 234 567"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {profileSaving ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </div>
            </form>

            {/* Form 2: Change Password */}
            <form onSubmit={handleChangePassword} className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-brand" /> Đổi mật khẩu
              </h2>

              {passSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}
              {passError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Mật khẩu mới *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Xác nhận mật khẩu mới *</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={passSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" /> {passSaving ? "Đang đổi..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
