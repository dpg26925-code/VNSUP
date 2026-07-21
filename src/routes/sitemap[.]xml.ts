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
        let slugs: string[] = [];
        if (url && key) {
          const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data } = await s.from("companies").select("slug").limit(50000);
          slugs = (data ?? []).map((r: { slug: string }) => r.slug);
        }
        const now = new Date().toISOString();
        const rows: { loc: string; changefreq: string; priority: string }[] = [
          { loc: "/", changefreq: "daily", priority: "1.0" },
          { loc: "/search", changefreq: "daily", priority: "0.9" },
          { loc: "/pricing", changefreq: "weekly", priority: "0.7" },
          { loc: "/about", changefreq: "monthly", priority: "0.5" },
          ...INDUSTRIES.map((i) => ({ loc: `/industry/${i.slug}`, changefreq: "weekly", priority: "0.8" })),
          ...PROVINCES.map((p) => ({ loc: `/province/${p.slug}`, changefreq: "weekly", priority: "0.8" })),
          ...slugs.map((s) => ({ loc: `/company/${s}`, changefreq: "weekly", priority: "0.7" })),
        ];
        const urls = rows.map((r) => `  <url><loc>${BASE_URL}${r.loc}</loc><lastmod>${now}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
