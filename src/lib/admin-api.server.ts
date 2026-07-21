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
  supabase: SupabaseClient<Database>;
  request: Request;
};

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

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) return json({ error: "server_misconfigured" }, 500);

  const supabase = createClient<Database>(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return json({ error: "invalid_token", message: userErr?.message ?? "Invalid token" }, 401);
  }

  const { data: roleRows, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  if (roleErr) return json({ error: "role_lookup_failed", message: roleErr.message }, 500);

  const roles = (roleRows ?? [])
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

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    roles,
    highestRole,
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
