import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold">Chào mừng</h1>
        <p className="text-muted-foreground">
          Ứng dụng của bạn đã kết nối với Supabase. Đăng nhập để bắt đầu.
        </p>
        <div className="flex justify-center gap-3">
          {signedIn ? (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Vào bảng điều khiển
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
