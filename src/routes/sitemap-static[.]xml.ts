import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        return renderUrlset([
          { loc: "/", lastmod: now, changefreq: "daily", priority: "1.0" },
          { loc: "/search", lastmod: now, changefreq: "daily", priority: "0.9" },
          { loc: "/pricing", lastmod: now, changefreq: "daily", priority: "1.0" },
          { loc: "/khu-cong-nghiep", lastmod: now, changefreq: "daily", priority: "1.0" },
          { loc: "/cum-cong-nghiep", lastmod: now, changefreq: "daily", priority: "1.0" },
          { loc: "/about", lastmod: now, changefreq: "monthly", priority: "0.5" },
          { loc: "/api", lastmod: now, changefreq: "monthly", priority: "0.4" },
        ]);
      },
    },
  },
});
