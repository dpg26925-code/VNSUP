import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        return renderUrlset([
          { loc: "/", changefreq: "daily", priority: "1.0" },
          { loc: "/search", changefreq: "daily", priority: "0.9" },
          { loc: "/pricing", changefreq: "daily", priority: "1.0" },
          { loc: "/khu-cong-nghiep", changefreq: "daily", priority: "1.0" },
          { loc: "/cum-cong-nghiep", changefreq: "daily", priority: "1.0" },
          { loc: "/about", changefreq: "monthly", priority: "0.5" },
          { loc: "/api", changefreq: "monthly", priority: "0.4" },
        ]);
      },
    },
  },
});
