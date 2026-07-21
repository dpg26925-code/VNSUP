// Browser helper for the Admin API (/api/public/admin/*).
// Attaches the current Supabase session token as Bearer.
import { supabase } from "@/integrations/supabase/client";

export type AdminApiError = { error: string; message?: string; status: number };

async function bearer(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function adminApi<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = await bearer();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`/api/public/admin${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : ({} as unknown);
  if (!res.ok) {
    const err = data as { error?: string; message?: string };
    throw Object.assign(new Error(err?.message || err?.error || `HTTP ${res.status}`), {
      status: res.status,
      error: err?.error,
    }) as Error & AdminApiError;
  }
  return data as T;
}
