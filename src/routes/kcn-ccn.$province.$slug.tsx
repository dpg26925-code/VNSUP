import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kcn-ccn/$province/$slug")({
  loader: async ({ params }) => {
    // We need to determine if it's a kcn or ccn to redirect to the correct base path
    const { data } = await supabase
      .from("industrial_zones")
      .select("kind")
      .eq("slug", params.slug)
      .maybeSingle();

    const kind = data?.kind === "ccn" ? "cum-cong-nghiep" : "khu-cong-nghiep";

    throw redirect({
      to: `/${kind}/$slug`,
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});

