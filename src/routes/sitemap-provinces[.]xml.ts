import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PROVINCES } from "@/lib/factory";
import { renderUrlset } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-provinces.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        return renderUrlset(
          PROVINCES.map((p) => ({
            loc: `/province/${p.slug}`,
            lastmod: now,
            changefreq: "weekly",
            priority: "0.8",
          })),
        );
      },
    },
  },
});
