import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { INDUSTRIES, PROVINCES } from "@/lib/factory";

const BASE_URL = "https://cheerful-wave-works.lovable.app";

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
        const paths: string[] = [
          "/", "/search",
          ...INDUSTRIES.map((i) => `/industry/${i.slug}`),
          ...PROVINCES.map((p) => `/province/${p.slug}`),
          ...slugs.map((s) => `/company/${s}`),
        ];
        const now = new Date().toISOString();
        const urls = paths.map((p) => `  <url><loc>${BASE_URL}${p}</loc><lastmod>${now}</lastmod></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
