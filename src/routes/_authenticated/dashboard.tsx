import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Bảng điều khiển" },
      { name: "description", content: "Trang cá nhân của bạn." },
    ],
  }),
  component: Dashboard,
});

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url")
        .eq("id", userData.user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Bảng điều khiển</h1>
          <button
            onClick={signOut}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Đăng xuất
          </button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : profile ? (
            <div className="space-y-2">
              <p><span className="text-muted-foreground">Tên:</span> {profile.display_name ?? "—"}</p>
              <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có hồ sơ</p>
          )}
        </div>
      </div>
    </div>
  );
}
