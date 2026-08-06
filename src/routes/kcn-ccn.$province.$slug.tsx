import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ZoneDetail, buildZoneHead } from "@/components/zone-detail";
import { ZONE_META, type ZoneRow } from "@/lib/zones";

const zoneQO = (provinceSlug: string, slug: string) => queryOptions({
  queryKey: ["zone", provinceSlug, slug],
  queryFn: async () => {
    // Note: We need to find the zone by slug. Kind is not strictly known but we can check both.
    const { data, error } = await supabase
      .from("industrial_zones")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw error;
    return data as ZoneRow;
  },
});

export const Route = createFileRoute("/kcn-ccn/$province/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(zoneQO(params.province, params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy KCN" }, { name: "robots", content: "noindex" }] };
    return buildZoneHead(loaderData);
  },
  component: ZoneSlugPage,
});

function ZoneSlugPage() {
  const zone = Route.useLoaderData();
  return <ZoneDetail zone={zone} />;
}
