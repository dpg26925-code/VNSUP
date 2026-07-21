import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Search, Bookmark, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/buyer")({
  head: () => ({ meta: [{ title: "Buyer Dashboard | FactoryHub" }, { name: "robots", content: "noindex" }] }),
  component: BuyerDashboard,
});

function BuyerDashboard() {
  const [saved, setSaved] = useState(0);
  const [leads, setLeads] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", uid)
        .then(({ count }) => setSaved(count ?? 0));
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("buyer_user_id", uid)
        .then(({ count }) => setLeads(count ?? 0));
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Bảng điều khiển Buyer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý tìm kiếm và yêu cầu báo giá của bạn.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-5">
            <Bookmark className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{saved}</div>
            <div className="text-sm text-muted-foreground">Tìm kiếm đã lưu</div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{leads}</div>
            <div className="text-sm text-muted-foreground">Yêu cầu báo giá</div>
          </div>
          <Link to="/search" className="rounded-lg border bg-card p-5 hover:border-primary">
            <Search className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Tìm nhà máy mới</div>
            <div className="text-sm text-muted-foreground">Lọc theo ngành, tỉnh, quy mô.</div>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
