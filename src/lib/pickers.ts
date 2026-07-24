// Shared pickers: industrial zones + industries (from DB + fallback constants)
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRIES } from "@/lib/factory";

export type ZoneOption = {
  id: string;
  name: string;
  slug: string;
  kind: "kcn" | "ccn";
  province: string | null;
};

export function useZoneOptions() {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("industrial_zones")
        .select("id,name,slug,kind,province")
        .eq("status", "approved")
        .order("kind", { ascending: true })
        .order("name", { ascending: true })
        .limit(1000);
      if (mounted) {
        setZones((data ?? []) as ZoneOption[]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return { zones, loading };
}

export type IndustryOption = { slug: string; name: string };

/** Merge hard-coded INDUSTRIES with entries in the `categories` table so that
 * newly added categories become quick-select options right away. */
export function useIndustryOptions() {
  const [extras, setExtras] = useState<IndustryOption[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("name,slug")
        .order("name", { ascending: true })
        .limit(500);
      if (mounted) setExtras(((data ?? []) as IndustryOption[]));
    })();
    return () => { mounted = false; };
  }, []);
  const seen = new Set<string>();
  const all: IndustryOption[] = [];
  for (const i of INDUSTRIES) {
    if (!seen.has(i.name.toLowerCase())) { seen.add(i.name.toLowerCase()); all.push({ slug: i.slug, name: i.name }); }
  }
  for (const i of extras) {
    if (i.name && !seen.has(i.name.toLowerCase())) { seen.add(i.name.toLowerCase()); all.push(i); }
  }
  return all;
}
