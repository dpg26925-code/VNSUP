import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { INDUSTRIES, PROVINCES } from "@/lib/factory";

const BASE_URL = "https://vnsupplier.cloud";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        let companies: { slug: string; updated_at: string | null }[] = [];
        if (url && key) {
          const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data } = await s.from("companies").select("slug,updated_at").eq("status", "approved").limit(50000);
          companies = (data ?? []) as typeof companies;
        }
        const now = new Date().toISOString();
        const rows: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
          { loc: "/", lastmod: now, changefreq: "daily", priority: "1.0" },
          { loc: "/search", lastmod: now, changefreq: "daily", priority: "0.9" },
          { loc: "/pricing", lastmod: now, changefreq: "weekly", priority: "0.7" },
          { loc: "/about", lastmod: now, changefreq: "monthly", priority: "0.5" },
          ...INDUSTRIES.map((i) => ({ loc: `/industry/${i.slug}`, lastmod: now, changefreq: "weekly", priority: "0.8" })),
          ...PROVINCES.map((p) => ({ loc: `/province/${p.slug}`, lastmod: now, changefreq: "weekly", priority: "0.8" })),
          ...companies.map((c) => ({ loc: `/company/${c.slug}`, lastmod: c.updated_at ?? now, changefreq: "weekly", priority: "0.7" })),
        ];
        const urls = rows.map((r) => `  <url><loc>${BASE_URL}${r.loc}</loc><lastmod>${r.lastmod}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
