import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { INDUSTRIES } from "@/lib/factory";
import { renderUrlset } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-industries.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        return renderUrlset(
          INDUSTRIES.map((i) => ({
            loc: `/industry/${i.slug}`,
            lastmod: now,
            changefreq: "weekly",
            priority: "0.8",
          })),
        );
      },
    },
  },
});
