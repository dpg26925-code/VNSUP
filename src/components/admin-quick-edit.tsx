import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminEditButtonProps {
  entityId: string;
  entityType: "company" | "zone";
}

export function AdminEditButton({ entityId, entityType }: AdminEditButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (mounted) {
        setIsAdmin(!!data);
        setLoading(false);
      }
    }

    checkAdmin();
    return () => { mounted = false; };
  }, []);

  if (loading || !isAdmin) return null;

  const editUrl = entityType === "company" 
    ? `/dashboard/admin/edit` 
    : `/dashboard/admin/zones`;
  
  // We pass search params to let the admin page know which entity to open in edit mode
  // The current admin pages use local state for editing, but we can extend them 
  // to pick up an 'id' from search params if needed. 
  // For now, navigating to the list is the safest baseline.
  
  return (
    <Link
      to={editUrl}
      search={entityType === "company" ? { q: entityId } : undefined}
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl dark:bg-orange-600 dark:hover:bg-orange-500"
    >
      <Pencil className="h-3.5 w-3.5" />
      Sửa nhanh Admin
    </Link>
  );
}
