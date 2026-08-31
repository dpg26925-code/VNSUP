// Server-only helpers for the Admin API (/api/public/admin/*).
// Verifies the caller's Supabase bearer token, checks their admin-tier role,
// and returns a Supabase client scoped to that user so RLS applies as them.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdminRole = "admin" | "publisher" | "editor";

const ROLE_RANK: Record<AdminRole, number> = { editor: 1, publisher: 2, admin: 3 };

export type AdminContext = {
  userId: string;
  email: string | null;
  roles: AdminRole[];
  highestRole: AdminRole;
  allowedCategories: string[];
  canPublish: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  supabase: SupabaseClient<Database>;
  request: Request;
};

/** Enforce editor category allow-list. Returns null if OK, or a Response on failure. */
export function enforceCategoryAllowed(
  ctx: AdminContext,
  category: string | null | undefined,
): Response | null {
  if (ctx.highestRole !== "editor") return null;
  if (!ctx.allowedCategories || ctx.allowedCategories.length === 0) return null;
  if (!category) return null;
  if (ctx.allowedCategories.includes(category)) return null;
  return json(
    {
      error: "forbidden",
      message: `Editor không được phép thao tác trên chuyên mục '${category}'.`,
      allowed_categories: ctx.allowedCategories,
    },
    403,
  );
}

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type, apikey",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
      ...extraHeaders,
    },
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type, apikey",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "access-control-max-age": "86400",
    },
  });
}

function bearerFrom(request: Request): string | null {
  const h = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/** Authenticate the caller and require at least `minRole`. Returns Response on failure. */
export async function requireAdmin(
  request: Request,
  minRole: AdminRole = "editor",
): Promise<AdminContext | Response> {
  const token = bearerFrom(request);
  if (!token) return json({ error: "unauthorized", message: "Missing Bearer token" }, 401);

  const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    "https://fnyonwdojxkchbrqrcpu.supabase.co";
  const anon =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_GnTAgTLODhvGTCdwN3NTKg_vXA3ruuj";

  const supabase = createClient<Database>(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });

  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr) {
      console.error("[admin-api] auth error:", userErr.message);
      return json({ error: "invalid_token", message: userErr.message || "Unauthorized" }, 401);
    }
    user = userData?.user ?? null;
    if (!user) return json({ error: "invalid_token", message: "Unauthorized" }, 401);
  } catch (err) {
    console.error("[admin-api] auth exception:", err);
    return json({ error: "invalid_token", message: "Auth provider error" }, 401);
  }

  let roleRows: Array<Record<string, unknown>> | null = null;
  try {
    const { data, error: roleErr } = await supabase
      .from("user_roles")
      .select("role, allowed_categories, can_publish, can_delete, can_manage_users");
    if (roleErr) {
      const msg = roleErr.message ?? "";
      if (/jwt|token|expired|unauthor/i.test(msg)) {
        return json({ error: "invalid_token", message: msg }, 401);
      }
      return json({ error: "role_lookup_failed", message: msg }, 500);
    }
    roleRows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  } catch (err) {
    console.error("[admin-api] role lookup exception:", err);
    return json({ error: "role_lookup_failed", message: (err as Error).message }, 500);
  }

  const rows: Array<Record<string, unknown>> = roleRows ?? [];
  const roles = rows
    .map((r) => r.role as string)
    .filter((r): r is AdminRole => r === "admin" || r === "publisher" || r === "editor");

  if (roles.length === 0) {
    return json({ error: "forbidden", message: "Not an admin user" }, 403);
  }

  const highestRole = roles.reduce<AdminRole>(
    (best, r) => (ROLE_RANK[r] > ROLE_RANK[best] ? r : best),
    roles[0],
  );

  if (ROLE_RANK[highestRole] < ROLE_RANK[minRole]) {
    return json(
      { error: "forbidden", message: `Requires role >= ${minRole}, you have ${highestRole}` },
      403,
    );
  }

  const allowedCategories = Array.from(
    new Set(rows.flatMap((r) => (r.allowed_categories as string[] | null) ?? [])),
  ) as string[];
  const canPublish =
    highestRole === "admin" || highestRole === "publisher" || rows.some((r) => Boolean(r.can_publish));
  const canDelete =
    highestRole === "admin" || highestRole === "publisher" || rows.some((r) => Boolean(r.can_delete));
  const canManageUsers = highestRole === "admin" || rows.some((r) => Boolean(r.can_manage_users));

  return {
    userId: user.id,
    email: user.email ?? null,

    roles,
    highestRole,
    allowedCategories,
    canPublish,
    canDelete,
    canManageUsers,
    supabase,
    request,
  };
}

/** Write an audit log entry using the service role (bypasses RLS on the log table). */
export async function logAudit(
  ctx: AdminContext,
  action: string,
  target: { type?: string; id?: string | null; slug?: string | null } = {},
  changes: Record<string, unknown> = {},
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_user_id: ctx.userId,
      action,
      target_type: target.type ?? null,
      target_id: target.id ?? null,
      target_slug: target.slug ?? null,
      changes: changes as never,
      ip:
        ctx.request.headers.get("x-forwarded-for") ??
        ctx.request.headers.get("cf-connecting-ip") ??
        null,
      user_agent: ctx.request.headers.get("user-agent") ?? null,
    });
  } catch (err) {
    console.error("[admin-audit] failed:", err);
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
