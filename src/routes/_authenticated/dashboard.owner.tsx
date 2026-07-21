import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Building2, FileCheck, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const [claims, setClaims] = useState(0);
  const [leads, setLeads] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      if (!email) return;
      supabase.from("company_claims").select("id", { count: "exact", head: true }).eq("requester_email", email)
        .then(({ count }) => setClaims(count ?? 0));
      supabase.from("leads").select("id", { count: "exact", head: true })
        .then(({ count }) => setLeads(count ?? 0));
    });
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Bảng điều khiển Owner</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý hồ sơ nhà máy và các lead nhận được.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-5">
            <FileCheck className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{claims}</div>
            <div className="text-sm text-muted-foreground">Hồ sơ đang claim</div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <Inbox className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{leads}</div>
            <div className="text-sm text-muted-foreground">Lead nhận được</div>
          </div>
          <Link to="/pricing" className="rounded-lg border bg-card p-5 hover:border-primary">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Nâng cấp gói</div>
            <div className="text-sm text-muted-foreground">Featured, Verified, Lead Notification.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
