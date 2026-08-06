import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap-en.xml")({
  server: {
    handlers: {
      GET: async () => {
        // VNSupplier is currently focused on Vietnam market (VI).
        // Returning a minimal valid sitemap for EN if requested, or redirect to main sitemap.
        // For now, let's just return a valid empty sitemap to avoid 404.
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});