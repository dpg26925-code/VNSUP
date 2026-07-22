import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { renderUrlset, type SitemapEntry } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-companies.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        const now = new Date().toISOString();
        let entries: SitemapEntry[] = [];
        if (url && key) {
          const s = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data } = await s
            .from("companies")
            .select("slug,updated_at")
            .eq("status", "approved")
            .limit(50000);
          entries = ((data ?? []) as { slug: string; updated_at: string | null }[]).map((c) => ({
            loc: `/company/${c.slug}`,
            lastmod: c.updated_at ?? now,
            changefreq: "weekly",
            priority: "0.7",
          }));
        }
        return renderUrlset(entries);
      },
    },
  },
});
