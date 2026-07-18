import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://cheerful-wave-works.lovable.app";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: Entry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
          { path: "/forgot-password", changefreq: "yearly", priority: "0.2" },
        ];

        let dynamic: Entry[] = [];
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data } = await supabaseAdmin
            .from("celebrities")
            .select("slug, updated_at")
            .eq("published", true);
          if (data) {
            dynamic = data.map((r: { slug: string; updated_at?: string | null }) => ({
              path: `/celebrities/${r.slug}`,
              changefreq: "weekly",
              priority: "0.8",
              lastmod: r.updated_at ?? undefined,
            }));
          }
        } catch {
          // ignore — sitemap still lists static routes
        }

        const urls = [...staticEntries, ...dynamic].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
