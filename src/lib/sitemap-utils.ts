export const SITE_URL = "https://vnsupplier.cloud";

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
};

export function renderUrlset(entries: SitemapEntry[]): Response {
  const body = entries
    .map((e) => {
      const parts = [
        `    <loc>${SITE_URL}${e.loc}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        `    <xhtml:link rel="alternate" hreflang="vi" href="${SITE_URL}${e.loc}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${e.loc}"/>`,
      ].filter(Boolean);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
