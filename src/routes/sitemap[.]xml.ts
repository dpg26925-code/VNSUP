import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://vnsupplier.cloud";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const children = [
          "sitemap-static.xml",
          "sitemap-industries.xml",
          "sitemap-provinces.xml",
          "sitemap-companies.xml",
          "sitemap-zones.xml",
        ];
        const body = children
          .map((c) => `  <sitemap><loc>${BASE_URL}/${c}</loc><lastmod>${now}</lastmod></sitemap>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
