import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { renderUrlset, type SitemapEntry } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-zones.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const entries: SitemapEntry[] = [
          { loc: "/khu-cong-nghiep", changefreq: "weekly", priority: "0.8" },
          { loc: "/cum-cong-nghiep", changefreq: "weekly", priority: "0.7" },
        ];
        if (url && key) {
          const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data } = await s
            .from("industrial_zones")
            .select("slug,kind,updated_at")
            .eq("status", "approved")
            .limit(50000);
          for (const z of (data ?? []) as { slug: string; kind: "kcn" | "ccn"; updated_at: string | null }[]) {
            const base = z.kind === "kcn" ? "/khu-cong-nghiep" : "/cum-cong-nghiep";
            entries.push({
              loc: `${base}/${z.slug}`,
              lastmod: z.updated_at ?? undefined,
              changefreq: "monthly",
              priority: "0.7",
            });
          }
        }
        return renderUrlset(entries);
      },
    },
  },
});
